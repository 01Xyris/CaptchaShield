let whitelist = [];

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateBadge') {
    browser.browserAction.setBadgeText({ text: message.count.toString() });
  }
});

browser.webNavigation.onBeforeNavigate.addListener((details) => {
  const url = new URL(details.url);
  const hostname = url.hostname;
  if (!whitelist.includes(hostname)) {
    browser.tabs.executeScript(details.tabId, { file: "content.js", runAt: "document_start" });
  }
});

browser.storage.local.get('whitelist').then((result) => {
  if (result.whitelist) {
    whitelist = result.whitelist;
  }
});

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.whitelist) {
    whitelist = changes.whitelist.newValue;
  }
});