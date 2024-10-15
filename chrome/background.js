let whitelist = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateBadge') {
    chrome.action.setBadgeText({ text: message.count.toString() });
  }
});

function isValidUrl(url) {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch (e) {
      return false;
    }
  }
  
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url && isValidUrl(tab.url)) {
    const url = new URL(tab.url);
    const hostname = url.hostname;
    if (!whitelist.includes(hostname)) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["content.js"]
      });
    }
  }
});

chrome.storage.local.get('whitelist').then((result) => {
  if (result.whitelist) {
    whitelist = result.whitelist;
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.whitelist) {
    whitelist = changes.whitelist.newValue;
  }
});