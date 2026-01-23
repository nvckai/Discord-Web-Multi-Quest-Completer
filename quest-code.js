(function() {
  'use strict';

  function waitForWebpack(callback) {
    const checkInterval = 100;
    const maxAttempts = 100;
    let attempts = 0;

    const check = () => {
      if (attempts >= maxAttempts) {
        console.error('Discord Auto Quest: Failed to load webpack after multiple attempts.');
        return;
      }

      if (typeof window.webpackChunkdiscord_app === 'undefined') {
        attempts++;
        setTimeout(check, checkInterval);
        return;
      }

      try {
        const originalJQuery = window.$;
        delete window.$;

        const webpackRequire = window.webpackChunkdiscord_app.push([[Symbol()], {}, (require) => require]);
        window.webpackChunkdiscord_app.pop();

        if (originalJQuery) {window.$ = originalJQuery;}

        if (!webpackRequire || !webpackRequire.c || Object.keys(webpackRequire.c).length < 10) {
          attempts++;
          setTimeout(check, checkInterval);
          return;
        }

        console.info(`Discord Auto Quest: Webpack loaded with ${Object.keys(webpackRequire.c).length} modules.`);
        callback(webpackRequire);

      } catch (error) {
        console.error('Discord Auto Quest: Error accessing webpack:', error);
        attempts++;
        setTimeout(check, checkInterval);
      }
    };

    check();
  }

  function findModule(webpackRequire, filter) {
    const modules = Object.values(webpackRequire.c);
    for (const module of modules) {
      if (module && module.exports) {
        if (module.exports.Z && filter(module.exports.Z)) {return module.exports.Z;}
        if (module.exports.ZP && filter(module.exports.ZP)) {return module.exports.ZP;}
        if (filter(module.exports)) {return module.exports;}
      }
    }
    return null;
  }

  function sendUpdate(type, data) {
    window.postMessage({
      prefix: 'DISCORD_QUEST_COMPLETER',
      type: type,
      data: data
    }, '*');
  }

  async function runQuestCode(webpackRequire) {
    try {
      console.info('Discord Auto Quest: Initializing...');

      const isDesktopApp = typeof window.DiscordNative !== "undefined";
      if (!isDesktopApp) {
        console.info('Discord Auto Quest: Spoofing Desktop Client via Heartbeat Simulation.');
      }

      const stores = loadStores(webpackRequire);
      if (!stores) {return;}

      const activeQuests = getActiveQuests(stores.QuestsStore);

      if (activeQuests.length === 0) {
        console.info("Discord Auto Quest: You don't have any uncompleted active quests!");
        return;
      }

      console.info(`Discord Auto Quest: Found ${activeQuests.length} active quest(s).`);

      const questStates = activeQuests.map(quest => initializeQuestState(quest));

      sendUpdate('QUEST_LIST', questStates.map(state => ({
        id: state.quest.id,
        name: state.questName,
        progress: Math.floor(state.currentProgress),
        target: state.secondsNeeded,
        completed: state.completed
      })));

      
      const videoStates = questStates.filter(s => s.taskType.startsWith("WATCH_VIDEO"));
      const heartbeatStates = questStates.filter(s => !s.taskType.startsWith("WATCH_VIDEO"));

      const heartbeatInterval = 30000;
      const videoInterval = 1000;

      const videoPromise = (async () => {
        let videoRunning = true;
        while (videoRunning && videoStates.length > 0) {
          let allVideoComplete = true;
          const now = Date.now();
          for (const state of videoStates) {
            if (state.completed) {continue;}
            allVideoComplete = false;
            
            if (now - state.lastUpdate >= videoInterval) {
               await processVideoStep(state, stores.api);
               state.lastUpdate = now;
            }
          }
          if (allVideoComplete) {videoRunning = false;}
          await new Promise(r => setTimeout(r, 1000));
        }
      })();

      const heartbeatPromise = (async () => {
         let heartbeatRunning = true;
         while (heartbeatRunning && heartbeatStates.length > 0) {
           let anyProcessed = false;
           let allHeartbeatComplete = true;

           for (const state of heartbeatStates) {
             if (state.completed) {continue;}
             allHeartbeatComplete = false;
             anyProcessed = true;

             await processHeartbeatStep(state, stores);
             
             if (state.completed) {continue;}
             
             console.info(`Discord Auto Quest: Waiting ${heartbeatInterval / 1000}s to next heartbeat...`);
             await new Promise(r => setTimeout(r, heartbeatInterval));
           }

           if (allHeartbeatComplete) {heartbeatRunning = false;}
           
           if (!anyProcessed) {break;}
         }
      })();

      await Promise.all([videoPromise, heartbeatPromise]);

      console.info("Discord Auto Quest: All quests processing finished!");

    } catch (error) {
      console.error('Discord Auto Quest: Critical error:', error);
    }
  }

  function getActiveQuests(QuestsStore) {
    const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];

    return [...QuestsStore.quests.values()].filter(quest => {
      const isExpired = new Date(quest.config.expiresAt).getTime() <= Date.now();
      const isCompleted = !!quest.userStatus?.completedAt;
      const isEnrolled = !!quest.userStatus?.enrolledAt;
      const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
      const hasSupportedTask = supportedTasks.some(type => taskConfig.tasks[type] !== null);
      
      return isEnrolled && !isCompleted && !isExpired && hasSupportedTask;
    });
  }

  function initializeQuestState(quest) {
    const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
    const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];
    const taskType = supportedTasks.find(type => taskConfig.tasks[type] !== undefined && taskConfig.tasks[type] !== null);
    
    const taskData = taskConfig.tasks[taskType];
    const secondsNeeded = taskData?.target ?? 0;
    const currentProgress = quest.userStatus?.progress?.[taskType]?.value ?? quest.userStatus?.streamProgressSeconds ?? 0;

    return {
      quest,
      taskType,
      secondsNeeded,
      currentProgress,
      completed: currentProgress >= secondsNeeded,
      lastUpdate: 0,
      enrolledAt: new Date(quest.userStatus.enrolledAt).getTime(),
      appName: quest.config.application.name,
      appId: quest.config.application.id,
      questName: quest.config.messages.questName
    };
  }

  function loadStores(webpackRequire) {
    try {
      const ApplicationStreamingStore = findModule(webpackRequire, m => m.__proto__?.getStreamerActiveStreamMetadata);
      const RunningGameStore = findModule(webpackRequire, m => m.getRunningGames);
      const QuestsStore = findModule(webpackRequire, m => m.__proto__?.getQuest);
      const ChannelStore = findModule(webpackRequire, m => m.__proto__?.getAllThreadsForParent);
      const GuildChannelStore = findModule(webpackRequire, m => m.getSFWDefaultChannel);
      const FluxDispatcher = findModule(webpackRequire, m => m.__proto__?.flushWaitQueue);
      const api = findModule(webpackRequire, m => m.tn?.get)?.tn;

      if (!ApplicationStreamingStore || !RunningGameStore || !QuestsStore || !ChannelStore || !GuildChannelStore || !FluxDispatcher || !api) {
        const missing = [];
        if (!ApplicationStreamingStore) {missing.push('ApplicationStreamingStore');}
        if (!RunningGameStore) {missing.push('RunningGameStore');}
        if (!QuestsStore) {missing.push('QuestsStore');}
        if (!ChannelStore) {missing.push('ChannelStore');}
        if (!GuildChannelStore) {missing.push('GuildChannelStore');}
        if (!FluxDispatcher) {missing.push('FluxDispatcher');}
        if (!api) {missing.push('api');}
        throw new Error(`Could not find stores: ${missing.join(', ')}`);
      }

      return { ApplicationStreamingStore, RunningGameStore, QuestsStore, ChannelStore, GuildChannelStore, FluxDispatcher, api };
    } catch (error) {
      console.error('Discord Auto Quest: Error loading stores:', error);
      return null;
    }
  }

  const notifyUI = (quest, progress, target, completed) => {
     sendUpdate('QUEST_UPDATE', { id: quest.id, name: quest.config.messages.questName, progress, target, completed });
  };

  async function processVideoStep(state, api) {
    const { quest, secondsNeeded, enrolledAt, currentProgress, questName } = state;
    const maxFuture = 10;
    const speed = 7; 
    
    const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
    const diff = maxAllowed - currentProgress;

    if (diff < speed) {
       return;
    }

    const nextTime = Math.min(secondsNeeded, currentProgress + speed + Math.random());
    
    try {
        const body = { timestamp: nextTime };
        const res = await api.post({ url: `/quests/${quest.id}/video-progress`, body });
        
        state.currentProgress = nextTime;
        console.info(`Discord Auto Quest: "${questName}" (Video) progress: ${Math.floor(state.currentProgress)}/${secondsNeeded}s`);
        notifyUI(quest, Math.floor(state.currentProgress), secondsNeeded, false);

        if (res.body.completed_at !== null || state.currentProgress >= secondsNeeded) {
            state.completed = true;
            console.info(`Discord Auto Quest: Quest "${questName}" completed!`);
            notifyUI(quest, secondsNeeded, secondsNeeded, true);
            
            try { 
              await api.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: secondsNeeded } }); 
            } catch (error) {
              console.error('Discord Auto Quest: Final update failed', error);
            }
        }
    } catch (error) {
        console.error(`Discord Auto Quest: Error updating video progress for "${questName}":`, error);
    }
  }

  async function processHeartbeatStep(state, stores) {
    const { api, ChannelStore, GuildChannelStore } = stores;
    const { quest, taskType, secondsNeeded, questName } = state;

    let streamKey = `call:${quest.id}:1`;

    if (taskType === "PLAY_ACTIVITY") {
       const channelId = getVoiceChannelId(ChannelStore, GuildChannelStore);
       if (channelId) {
         streamKey = `call:${channelId}:1`;
       } else {
         console.warn(`Discord Auto Quest: No voice channel found for activity quest "${questName}". Skipping step.`);
         return; 
       }
    }

    try {
      console.info(`Discord Auto Quest: Sending heartbeat for "${questName}"...`);
      const response = await api.post({
        url: `/quests/${quest.id}/heartbeat`,
        body: { stream_key: streamKey, terminal: false }
      });

      const serverProgress = response.body?.progress?.[taskType]?.value ?? 0;
      state.currentProgress = serverProgress;
      
      console.info(`Discord Auto Quest: "${questName}" progress: ${Math.floor(state.currentProgress)}/${secondsNeeded}s`);
      notifyUI(quest, Math.floor(state.currentProgress), secondsNeeded, state.currentProgress >= secondsNeeded);

      if (state.currentProgress >= secondsNeeded) {
        await api.post({
          url: `/quests/${quest.id}/heartbeat`,
          body: { stream_key: streamKey, terminal: true }
        });
        state.completed = true;
        console.info(`Discord Auto Quest: Quest "${questName}" completed!`);
        notifyUI(quest, secondsNeeded, secondsNeeded, true);
      }
    } catch (error) {
      console.error(`Discord Auto Quest: Error sending heartbeat for "${questName}":`, error);
    }
  }

  function getVoiceChannelId(ChannelStore, GuildChannelStore) {
    const privateChannels = ChannelStore.getSortedPrivateChannels();
    let channelId = privateChannels[0]?.id;

    if (!channelId) {
      const guilds = Object.values(GuildChannelStore.getAllGuilds());
      const guildWithVoice = guilds.find(g => g && g.VOCAL && g.VOCAL.length > 0);
      if (guildWithVoice) {
        channelId = guildWithVoice.VOCAL[0].channel.id;
      }
    }
    return channelId;
  }

  waitForWebpack(runQuestCode);

})();
