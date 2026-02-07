chrome.runtime.onInstalled.addListener(() => {
  console.info('Discord Auto Quest extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVersion') {
    const manifest = chrome.runtime.getManifest();
    sendResponse({ version: manifest.version });
    return false;
  } else if (request.action === 'executeQuestCode') {
    if (sender.tab && sender.tab.id) {
      const manifest = chrome.runtime.getManifest();
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: (version) => { window.__QUEST_VERSION = version; },
        args: [manifest.version],
        world: 'MAIN'
      }).then(() => {
        return chrome.scripting.executeScript({
          target: { tabId: sender.tab.id },
          files: ['quest-code.js'],
          world: 'MAIN'
        });
      }).then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('Error injecting quest code:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    } else {
      sendResponse({ success: false, error: 'No tab ID found' });
      return false;
    }
  }
});
