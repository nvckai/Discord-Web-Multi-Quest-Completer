chrome.runtime.onInstalled.addListener(() => {
  console.info('Discord Auto Quest extension installed');
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
  }
  return true;
});
