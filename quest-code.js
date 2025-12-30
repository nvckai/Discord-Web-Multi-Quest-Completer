(function() {
  'use strict';

  function waitForWebpack(callback, maxAttempts = 100, attempt = 0) {
    if (attempt >= maxAttempts) {
      console.error('Failed to load webpack after', maxAttempts, 'attempts');
      return;
    }

    if (typeof window.webpackChunkdiscord_app === 'undefined') {
      setTimeout(() => waitForWebpack(callback, maxAttempts, attempt + 1), 100);
      return;
    }

    let wpRequire;
    try {
      delete window.$;
      wpRequire = window.webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
      window.webpackChunkdiscord_app.pop();
      
      if (!wpRequire || !wpRequire.c || Object.keys(wpRequire.c).length === 0) {
        setTimeout(() => waitForWebpack(callback, maxAttempts, attempt + 1), 100);
        return;
      }
      
      const moduleCount = Object.keys(wpRequire.c).length;
      if (moduleCount < 10) {
        setTimeout(() => waitForWebpack(callback, maxAttempts, attempt + 1), 100);
        return;
      }
      
      console.log(`Webpack loaded with ${moduleCount} modules`);
    } catch (error) {
      console.error('Error accessing webpack:', error);
      setTimeout(() => waitForWebpack(callback, maxAttempts, attempt + 1), 100);
      return;
    }

    callback(wpRequire);
  }

  function runQuestCode(wpRequire) {
    (async () => {
      try {
        const userAgent = navigator.userAgent;
        console.log('Current User-Agent:', userAgent);
        const hasElectron = userAgent.includes("Electron/");
        if (!hasElectron) {
          console.warn('User-Agent does not contain "Electron/". Some quest types may not work.');
        } else {
          console.log('User-Agent override is working (contains Electron/)');
        }

        let ApplicationStreamingStore, RunningGameStore, QuestsStore, ChannelStore, GuildChannelStore, FluxDispatcher, api;

        try {
          console.log('Loading Discord stores...');
          
          ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.Z;
          if (!ApplicationStreamingStore) throw new Error('Could not find ApplicationStreamingStore');
          
          RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames)?.exports?.ZP;
          if (!RunningGameStore) throw new Error('Could not find RunningGameStore');
          
          QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest)?.exports?.Z;
          if (!QuestsStore) throw new Error('Could not find QuestsStore');
          
          ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent)?.exports?.Z;
          if (!ChannelStore) throw new Error('Could not find ChannelStore');
          
          GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel)?.exports?.ZP;
          if (!GuildChannelStore) throw new Error('Could not find GuildChannelStore');
          
          FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue)?.exports?.Z;
          if (!FluxDispatcher) throw new Error('Could not find FluxDispatcher');
          
          api = Object.values(wpRequire.c).find(x => x?.exports?.tn?.get)?.exports?.tn;
          if (!api) throw new Error('Could not find API');
          
          console.log('All Discord stores loaded successfully');
        } catch (error) {
          console.error('Error loading Discord stores:', error);
          console.log('Please wait for Discord to fully load and try again.');
          return;
        }

        if (!QuestsStore || !QuestsStore.quests || QuestsStore.quests.size === 0) {
          console.log('No quests found. Please accept a quest first!');
          return;
        }

        let quests = [...QuestsStore.quests.values()].filter(x => 
          x.id !== "1412491570820812933" && 
          x.userStatus?.enrolledAt && 
          !x.userStatus?.completedAt && 
          new Date(x.config.expiresAt).getTime() > Date.now()
        );

        const isApp = typeof window.DiscordNative !== "undefined";
        
        if (!isApp) {
          console.warn('Not running in Discord desktop app. Some quest types may not work.');
        }
        
        if (quests.length === 0) {
          console.log("You don't have any uncompleted quests!");
          return;
        }

        console.log(`Found ${quests.length} active quest(s). Starting multi-quest execution...`);

        const questPromises = quests.map(async (quest) => {
          const pid = Math.floor(Math.random() * 30000) + 1000 + Math.floor(Math.random() * 1000);
          
          const applicationId = quest.config.application.id;
          const applicationName = quest.config.application.name;
          const questName = quest.config.messages.questName;
          const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
          const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"].find(x => taskConfig.tasks[x] != null);
          const secondsNeeded = taskConfig.tasks[taskName].target;
          let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;

          console.log(`Starting quest: ${questName} (${taskName})`);

          if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
            const maxFuture = 10, speed = 7, interval = 1;
            const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime();
            let completed = false;
            while (true) {
              const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
              const diff = maxAllowed - secondsDone;
              const timestamp = secondsDone + speed;
              if (diff >= speed) {
                const res = await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: Math.min(secondsNeeded, timestamp + Math.random())}});
                completed = res.body.completed_at != null;
                secondsDone = Math.min(secondsNeeded, timestamp);
              }
              
              if (timestamp >= secondsNeeded) {
                break;
              }
              await new Promise(resolve => setTimeout(resolve, interval * 1000));
            }
            if (!completed) {
              await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: secondsNeeded}});
            }
            console.log(`Quest completed: ${questName}`);
          } else if (taskName === "PLAY_ON_DESKTOP") {
            console.log(`Attempting to complete ${questName} quest (PLAY_ON_DESKTOP)...`);
            if (!isApp) {
              console.warn('Running in browser mode. Using heartbeat method instead of spoofing.');
              const streamKey = `call:${quest.id}:1`;
              
              while (true) {
                const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}});
                const progress = res.body.progress.PLAY_ON_DESKTOP.value;
                console.log(`Quest progress (${questName}): ${progress}/${secondsNeeded}`);
                
                await new Promise(resolve => setTimeout(resolve, 20 * 1000));
                
                if (progress >= secondsNeeded) {
                  await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}});
                  break;
                }
              }
              
              console.log(`Quest completed: ${questName}`);
              return;
            }
            
            const appData = await api.get({url: `/applications/public?application_ids=${applicationId}`}).then(res => res.body[0]);
            const exeName = appData.executables.find(x => x.os === "win32").name.replace(">","");
            
            const fakeGame = {
              cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
              exeName,
              exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
              hidden: false,
              isLauncher: false,
              id: applicationId,
              name: appData.name,
              pid: pid,
              pidPath: [pid],
              processName: appData.name,
              start: Date.now(),
            };
            const realGames = RunningGameStore.getRunningGames();
            const fakeGames = [fakeGame];
            const realGetRunningGames = RunningGameStore.getRunningGames;
            const realGetGameForPID = RunningGameStore.getGameForPID;
            RunningGameStore.getRunningGames = () => fakeGames;
            RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid);
            FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames});
            
            return new Promise((resolve) => {
              let fn = data => {
                let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
                console.log(`Quest progress (${questName}): ${progress}/${secondsNeeded}`);
                
                if (progress >= secondsNeeded) {
                  console.log(`Quest completed: ${questName}`);
                  
                  RunningGameStore.getRunningGames = realGetRunningGames;
                  RunningGameStore.getGameForPID = realGetGameForPID;
                  FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: []});
                  FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                  resolve();
                }
              };
              FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
              
              console.log(`Spoofed your game for ${questName}. Wait for ${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.`);
            });
          } else if (taskName === "STREAM_ON_DESKTOP") {
            console.log(`Attempting to complete ${questName} quest (STREAM_ON_DESKTOP)...`);
            if (!isApp) {
              console.warn('Running in browser mode. Using heartbeat method instead of spoofing.');
              const streamKey = `call:${quest.id}:1`;
              
              while (true) {
                const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}});
                const progress = res.body.progress.STREAM_ON_DESKTOP.value;
                console.log(`Quest progress (${questName}): ${progress}/${secondsNeeded}`);
                
                await new Promise(resolve => setTimeout(resolve, 20 * 1000));
                
                if (progress >= secondsNeeded) {
                  await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}});
                  break;
                }
              }
              
              console.log(`Quest completed: ${questName}`);
              return;
            }
            
            let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
              ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                id: applicationId,
                pid,
                sourceName: null
              });
              
              return new Promise((resolve) => {
                let fn = data => {
                  let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
                  console.log(`Quest progress (${questName}): ${progress}/${secondsNeeded}`);
                  
                  if (progress >= secondsNeeded) {
                    console.log(`Quest completed: ${questName}`);
                    
                    ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
                    FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                    resolve();
                  }
                };
                FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                
                console.log(`Spoofed your stream for ${questName}. Stream any window in vc for ${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.`);
                console.log("Remember that you need at least 1 other person to be in the vc!");
              });
          } else if (taskName === "PLAY_ACTIVITY") {
            console.log(`Attempting to complete ${questName} quest (PLAY_ACTIVITY)...`);
            
            const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0).VOCAL[0].channel.id;
            const streamKey = `call:${channelId}:1`;
            
            while (true) {
              const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}});
              const progress = res.body.progress.PLAY_ACTIVITY.value;
              console.log(`Quest progress (${questName}): ${progress}/${secondsNeeded}`);
              
              await new Promise(resolve => setTimeout(resolve, 20 * 1000));
              
              if (progress >= secondsNeeded) {
                await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}});
                break;
              }
            }
            
            console.log(`Quest completed: ${questName}`);
          }
        });

        await Promise.all(questPromises);
        console.log("All quests completed!");
      } catch (error) {
        console.error('Error running quest code:', error);
      }
    })();
  }

  waitForWebpack(runQuestCode);
})();