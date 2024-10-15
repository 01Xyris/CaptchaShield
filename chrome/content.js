(async function() {
  if (typeof browser === "undefined") {
    window.browser = chrome;
  }

  let settings = { preventClipboardHijacking: true };
  let stats = { clipboardBlocked: 0 };
  let whitelist = [];
  let suspiciousPatternDetected = false;

  const loadStorageData = async () => {
    const result = await browser.storage.local.get(['settings', 'stats', 'whitelist']);
    Object.assign(settings, result.settings);
    Object.assign(stats, result.stats);
    whitelist = result.whitelist || [];
    initProtection();
  };

  const initProtection = () => {
    detectPatterns();
    if (settings.preventClipboardHijacking && suspiciousPatternDetected) {
      injectClipboardOverride();
    }
  };


  const detectPatterns = () => {
    const patterns = [
      {
        selector: 'script',
        regex: /powershell(?:\.exe)?\s+-?(?:Command|NoProfile|EncodedCommand)\b/i
      },
      {
        selector: 'h2, p',
        regex: /(?:Verify You Are Human|Please verify that you are a human to continue\.)/i
      },
      {
        selector: 'p',
        regex: /Press Windows Button/i
      }
    ];
  
    suspiciousPatternDetected = patterns.some(({ selector, regex }) =>
      [...document.querySelectorAll(selector)].some(el =>
        regex.test(el.textContent)
      )
    );
  
    if (suspiciousPatternDetected) blockPage();
  };

  const blockPage = () => {
    if (whitelist.includes(window.location.hostname)) return;

    document.body.innerHTML = `
      <style>
        body { font-family: Arial, sans-serif; padding: 50px; background-color: #f44336; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; }
        h1 { font-size: 36px; margin-bottom: 20px; }
        p { font-size: 18px; margin-bottom: 30px; }
        button { padding: 15px 30px; font-size: 16px; background-color: white; color: #f44336; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background-color: #e0e0e0; }
      </style>
      <div>
        <h1>⚠️ Warning: Suspicious Content Detected</h1>
        <p>This site contains patterns that may indicate malicious content.</p>
        <button id="proceedButton">Proceed Anyway</button>
      </div>
    `;

    document.getElementById('proceedButton').addEventListener('click', () => whitelistSite(window.location.hostname));
  };

  const whitelistSite = async (host) => {
    const result = await browser.storage.local.get('whitelist');
    const updatedWhitelist = [...new Set([...(result.whitelist || []), host])];
    await browser.storage.local.set({ whitelist: updatedWhitelist });
    window.location.reload();
  };

  const injectClipboardOverride = () => {
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('clipboard-override.js');
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => {
      script.remove();
    };
  };

  document.addEventListener('clipboardHijackingBlocked', () => {
    stats.clipboardBlocked++;
    browser.storage.local.set({ stats });
    browser.runtime.sendMessage({ action: 'updateBadge', count: stats.clipboardBlocked });
  });

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.settings) settings = changes.settings.newValue;
      if (changes.whitelist) whitelist = changes.whitelist.newValue;
      if (changes.stats) stats = changes.stats.newValue;
      initProtection();
    }
  });

  await loadStorageData();
})();