(function() {
  let settings = {
    preventClipboardHijacking: true
  };

  let stats = {
    clipboardBlocked: 0
  };

  let whitelist = [];

  browser.storage.local.get(['settings', 'stats', 'whitelist']).then((result) => {
    if (result.settings) settings = result.settings;
    if (result.stats) stats = result.stats;
    if (result.whitelist) whitelist = result.whitelist;
    initProtection();
  });

  function initProtection() {
    const currentHost = window.location.hostname;
    if (!whitelist.includes(currentHost)) {
      detectPatterns();
    }
    
    if (settings.preventClipboardHijacking) {
      preventClipboardHijacking();
    }
  }

  function detectPatterns() {
    const patterns = [
      { name: 'Fake Human Verification', selector: 'h2, p', textContent: 'Verify You Are Human' },
      { name: 'Fake Human Verification', selector: 'h2, p', textContent: 'Please verify that you are a human to continue.' },
      { name: 'Suspicious Instructions', selector: 'p', textContent: 'Press Windows Button' }
    ];

    for (let pattern of patterns) {
      const elements = document.querySelectorAll(pattern.selector);
      for (let element of elements) {
        if (element.textContent && element.textContent.toLowerCase().includes(pattern.textContent.toLowerCase())) {
          blockPage();
          return;
        }
      }
    }
  }

  function blockPage() {
    document.documentElement.innerHTML = `
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 50px;
          background-color: #f44336; /* Red background */
          color: white; /* White font */
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          text-align: center;
        }
        h1 {
          font-size: 36px;
          margin-bottom: 20px;
        }
        p {
          font-size: 18px;
          margin-bottom: 30px;
        }
        button {
          padding: 15px 30px;
          font-size: 16px;
          background-color: white;
          color: #f44336;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        button:hover {
          background-color: #e0e0e0;
        }
        .icon {
          font-size: 24px;
        }
      </style>
 
      <div>
        <h1><span class="material-icons icon">warning</span> Warning: Suspicious Content Detected</h1>
        <p>The site you are trying to visit contains patterns that may indicate malicious content.</p>
        <button id="proceedButton">
          <span class="material-icons icon">arrow_forward</span> Proceed Anyway
        </button>
      </div>
 
      <!-- Load Google Material Icons -->
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    `;
 
    document.getElementById('proceedButton').addEventListener('click', () => {
      const currentHost = window.location.hostname;
      browser.storage.local.get('whitelist').then((result) => {
        let updatedWhitelist = result.whitelist || [];
        if (!updatedWhitelist.includes(currentHost)) {
          updatedWhitelist.push(currentHost);
          browser.storage.local.set({ whitelist: updatedWhitelist }).then(() => {
            window.location.reload();
          });
        } else {
          window.location.reload();
        }
      });
    });
  }

  function preventClipboardHijacking() {
    document.addEventListener('copy', (e) => {
      const selection = document.getSelection().toString();
      if (!selection) {
        e.preventDefault();
        stats.clipboardBlocked++;
        updateStats();
      }
    });
  }

  function updateStats() {
    browser.storage.local.set({ stats });
    browser.runtime.sendMessage({ action: 'updateBadge', count: stats.clipboardBlocked });
  }

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.settings) settings = changes.settings.newValue;
      if (changes.whitelist) whitelist = changes.whitelist.newValue;
      initProtection();
    }
  });

  updateStats();
})();