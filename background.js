chrome.runtime.onInstalled.addListener(() => {
  console.log('Discord Quest Helper extension installed');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url && tab.url.includes('discord.com')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['user-agent-override.js'],
      world: 'MAIN'
    }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'executeQuestCode') {
    if (sender.tab && sender.tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        files: ['quest-code.js'],
        world: 'MAIN'
      }).then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('Error injecting quest code:', error);
        sendResponse({ success: false, error: error.message });
      });
    } else {
      sendResponse({ success: false, error: 'No tab ID found' });
    }
    return true;
  }
});