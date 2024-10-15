(() => {
    const isSuspicious = (text) => text && text.toLowerCase().startsWith('powershell');
    const notifyBlocked = () => document.dispatchEvent(new CustomEvent('clipboardHijackingBlocked'));
  
    const overrideMethod = (obj, method, checker) => {
      const original = obj[method];
      obj[method] = function(...args) {
        if (checker(...args)) {
          notifyBlocked();
          return Promise.resolve();
        }
        return original.apply(this, args);
      };
    };
  
    overrideMethod(navigator.clipboard, 'writeText', isSuspicious);
    overrideMethod(navigator.clipboard, 'write', (content) => 
      content && content[0] && content[0].types.includes('text/plain') && 
      content[0].getType('text/plain').then(blob => blob.text()).then(isSuspicious)
    );
  
    document.execCommand = new Proxy(document.execCommand, {
      apply(target, thisArg, args) {
        const [command] = args;
        if (['copy', 'cut'].includes(command?.toLowerCase()) && isSuspicious(window.getSelection().toString())) {
          window.getSelection().removeAllRanges();
          notifyBlocked();
          return false;
        }
        return Reflect.apply(target, thisArg, args);
      }
    });
  
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'x'].includes(e.key.toLowerCase())) {
        if (isSuspicious(window.getSelection().toString())) {
          e.preventDefault();
          notifyBlocked();
        }
      }
    }, true);
  })();
  