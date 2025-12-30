(function() {
    'use strict';
    
    const electronUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Discord/1.0.0 Chrome/120.0.0.0 Electron/28.0.0 Safari/537.36';
    
    try {
      Object.defineProperty(navigator, 'userAgent', {
        get: function() {
          return electronUserAgent;
        },
        configurable: true
      });
      
      Object.defineProperty(navigator, 'platform', {
        get: function() {
          return 'Win32';
        },
        configurable: true
      });
      
      console.log('[Discord Quest Helper] User-Agent override active');
    } catch (error) {
      console.error('[Discord Quest Helper] Failed to override user agent:', error);
    }
  })();