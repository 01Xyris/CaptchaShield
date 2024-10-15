document.addEventListener('DOMContentLoaded', () => {
  const preventClipboardHijackingCheckbox = document.getElementById('preventClipboardHijacking');
  const clipboardBlockedSpan = document.getElementById('clipboardBlocked');
  const addToWhitelistButton = document.getElementById('addToWhitelist');
  const removeFromWhitelistButton = document.getElementById('removeFromWhitelist');
  const whitelistStatus = document.getElementById('whitelistStatus');

  let currentHost = '';

  // Load settings, stats, and whitelist from storage
  browser.storage.local.get(['settings', 'stats', 'whitelist']).then((result) => {
    const settings = result.settings || {
      preventClipboardHijacking: true
    };

    const stats = result.stats || {
      clipboardBlocked: 0
    };

    const whitelist = result.whitelist || [
      "www.youtube.com",
      "player.vimeo.com",
      "www.netflix.com",
      "www.hulu.com",
      "www.amazon.com",
      "www.disneyplus.com"
    ];

    // Update UI with settings
    preventClipboardHijackingCheckbox.checked = settings.preventClipboardHijacking;

    // Update UI with stats
    clipboardBlockedSpan.textContent = stats.clipboardBlocked;

    // Get the current tab's hostname
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const url = new URL(tabs[0].url);
      currentHost = url.hostname;
      checkWhitelistStatus(currentHost, whitelist);
    });
  });

  // Save settings when checkboxes are changed
  function saveSettings() {
    const settings = {
      preventClipboardHijacking: preventClipboardHijackingCheckbox.checked
    };
    browser.storage.local.set({ settings });
  }

  preventClipboardHijackingCheckbox.addEventListener('change', saveSettings);

  // Whitelist functions
  function checkWhitelistStatus(hostname, whitelist) {
    if (whitelist.includes(hostname)) {
      whitelistStatus.textContent = `${hostname} is whitelisted.`;
    } else {
      whitelistStatus.textContent = `${hostname} is not whitelisted.`;
    }
  }

  addToWhitelistButton.addEventListener('click', () => {
    browser.storage.local.get('whitelist').then((result) => {
      let whitelist = result.whitelist || [];
      if (!whitelist.includes(currentHost)) {
        whitelist.push(currentHost);
        browser.storage.local.set({ whitelist });
        whitelistStatus.textContent = `${currentHost} has been added.`;
        // Reload the tab to apply changes
        browser.tabs.reload();
      } else {
        whitelistStatus.textContent = `${currentHost} is already in the whitelist.`;
      }
    });
  });

  removeFromWhitelistButton.addEventListener('click', () => {
    browser.storage.local.get('whitelist').then((result) => {
      let whitelist = result.whitelist || [];
      if (whitelist.includes(currentHost)) {
        whitelist = whitelist.filter(site => site !== currentHost);
        browser.storage.local.set({ whitelist });
        whitelistStatus.textContent = `${currentHost} has been removed.`;
        // Reload the tab to apply changes
        browser.tabs.reload();
      } else {
        whitelistStatus.textContent = `${currentHost} is not in the whitelist.`;
      }
    });
  });

  // Tab switching logic
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const tabContentId = tab.getAttribute('data-tab') + 'Content';
      document.getElementById(tabContentId).classList.add('active');
    });
  });
});