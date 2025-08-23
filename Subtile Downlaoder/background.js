// Enhanced subtitle catcher with automatic file naming
const headerCache = new Map();
const processedUrls = new Set();
const failedUrls = new Set();
const EXTENSION_MARKER = 'x-subtitle-catcher';
const MAX_RETRIES = 2;

// Debug logging
const DEBUG = true;
function log(...args) {
  if (DEBUG) console.log('[SubtitleCatcher]', ...args);
}

// Clean up old cache entries
function cleanupCache() {
  if (headerCache.size > 1000) {
    const oldEntries = Array.from(headerCache.keys()).slice(0, 200);
    oldEntries.forEach(key => headerCache.delete(key));
  }
  
  if (processedUrls.size > 500) {
    const oldUrls = Array.from(processedUrls).slice(0, 100);
    oldUrls.forEach(url => processedUrls.delete(url));
  }
}

// Strict subtitle URL detection - reduced false positives
function isSubtitleUrl(url) {
  const lowerUrl = url.toLowerCase();
  
  // Exclude common non-subtitle file types and patterns
  if (/\.(js|javascript|json|css|html|php|xml|map|txt|log)(\?|$)/i.test(lowerUrl)) {
    return false;
  }
  
  // Exclude ad/tracking URLs and common scripts
  if (lowerUrl.includes('google-analytics') ||
      lowerUrl.includes('doubleclick') ||
      lowerUrl.includes('analytics') ||
      lowerUrl.includes('tracking') ||
      lowerUrl.includes('adserver') ||
      lowerUrl.includes('webpack') ||
      lowerUrl.includes('chunk') ||
      lowerUrl.includes('polyfill')) {
    return false;
  }
  
  // Check for actual subtitle file extensions or paths
  return /\.(vtt|srt|ass|ssa|sbv|sub|ttml|dfxp)(\?|$)/i.test(lowerUrl) ||
         /\/subtitles?\//i.test(lowerUrl) ||
         /\/captions?\//i.test(lowerUrl);
}

// Enhanced content validation with file signature checking
function isValidSubtitleContent(content, url) {
  const lowerContent = content.toLowerCase();
  const lowerUrl = url.toLowerCase();
  
  // First, check for obvious non-subtitle patterns (e.g., JavaScript, HTML, JSON)
  if (lowerContent.includes('<!doctype') ||
      lowerContent.includes('<html') ||
      lowerContent.includes('function(') ||
      lowerContent.includes('var ') ||
      lowerContent.includes('const ') ||
      lowerContent.includes('let ') ||
      lowerContent.includes('=>') ||
      lowerContent.includes('json.parse') ||
      lowerContent.trim().startsWith('{') ||
      lowerContent.trim().startsWith('[') ||
      lowerContent.includes('webpack') ||
      (lowerContent.includes('copyright') && lowerContent.includes('jw player')) ||
      lowerContent.includes('self.webpackchunk')) {
    return false;
  }
  
  // Check for subtitle file signatures at the start of content
  const trimmedContent = content.trim();
  
  // VTT signature: starts with "WEBVTT"
  if (trimmedContent.startsWith('WEBVTT')) {
    return true;
  }
  
  // ASS/SSA signature: contains "[Script Info]"
  if (trimmedContent.includes('[Script Info]')) {
    return true;
  }
  
  // SRT signature: starts with a number followed by newline (e.g., "1\n00:00:00,000 -->")
  if (/^\d+\s*[\r\n]/.test(trimmedContent)) {
    return true;
  }
  
  // TTML/DFXP signature: XML-based, starts with "<?xml" or contains "<tt"
  if (trimmedContent.startsWith('<?xml') || trimmedContent.includes('<tt')) {
    return true;
  }
  
  // Additional subtitle patterns anywhere in content (fallback)
  const subtitlePatterns = [
    /WEBVTT/i,
    /\[Script Info\]/i,
    /\[Events\]/i,
    /Dialogue:/i,
    /Format:/i,
    /\d{1,2}:\d{2}:\d{2}[,\.]\d{3}\s*-->/i,
    /\d{1,2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2}\.\d{3}/i
  ];
  
  return subtitlePatterns.some(pattern => pattern.test(content));
}

// Generate filename from URL (fallback)
function generateFilename(url) {
  try {
    const urlObj = new URL(url);
    let filename = urlObj.pathname.split('/').pop().split('?')[0] || `subtitle_${Date.now()}`;
    
    // Ensure proper extension
    if (!/\.(vtt|srt|ass|ssa|sbv|sub|ttml|dfxp)$/i.test(filename)) {
      if (url.includes('vtt')) filename += '.vtt';
      else if (url.includes('srt')) filename += '.srt';
      else filename += '.vtt';
    }
    
    return filename;
  } catch {
    return `subtitle_${Date.now()}.vtt`;
  }
}

// NEW FUNCTION: Generate smart filename based on tab title and URL
function generateSmartFilename(url, title, tabUrl) {
  // Try to extract show name, season, episode from title or tabUrl
  let showName = '';
  let season = '';
  let episode = '';

  // Common patterns in title: "Show Name S01E01 - Episode Title" or "Show Name Season 1 Episode 2"
  const seasonEpisodeRegex = /s(\d+)e(\d+)/i; // S01E01
  const seasonEpisodeRegex2 = /season\s*(\d+)\s*episode\s*(\d+)/i; // Season 1 Episode 2
  const seasonEpisodeRegex3 = /(\d+)x(\d+)/i; // 1x02

  let match = title.match(seasonEpisodeRegex) || title.match(seasonEpisodeRegex2) || title.match(seasonEpisodeRegex3);
  if (!match && tabUrl) {
    match = tabUrl.match(seasonEpisodeRegex) || tabUrl.match(seasonEpisodeRegex2) || tabUrl.match(seasonEpisodeRegex3);
  }

  if (match) {
    season = match[1];
    episode = match[2];
  }

  // Extract show name: from title or URL
  if (title) {
    // Remove season/episode info and trim
    showName = title.replace(seasonEpisodeRegex, '').replace(seasonEpisodeRegex2, '').replace(seasonEpisodeRegex3, '').trim();
    // Remove any special characters and multiple spaces
    showName = showName.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    // If showName is too long or empty, use fallback
    if (showName.length === 0) {
      showName = 'Unknown';
    }
  } else {
    showName = 'Unknown';
  }

  // If we have season and episode, format them
  let filename = showName;
  if (season && episode) {
    filename += `_S${season.padStart(2, '0')}E${episode.padStart(2, '0')}`;
  } else {
    // If no season/episode, use a timestamp to avoid overwrites
    filename += `_${Date.now()}`;
  }

  // Get the extension from the subtitle URL
  const urlExt = url.split('.').pop().split('?')[0];
  const validExts = ['vtt', 'srt', 'ass', 'ssa', 'sbv', 'sub', 'ttml', 'dfxp'];
  if (urlExt && validExts.includes(urlExt.toLowerCase())) {
    filename += `.${urlExt}`;
  } else {
    filename += '.vtt'; // default
  }

  // Ensure filename is safe for filesystem: replace invalid characters
  filename = filename.replace(/[\/\\?%*:|"<>]/g, '-');

  return filename;
}

// Enhanced fetch with multiple strategies
async function fetchWithStrategies(url, originalHeaders = []) {
  const strategies = [
    // Strategy 1: Use original headers
    () => {
      const headers = {};
      originalHeaders.forEach(h => {
        if (h.name && h.value && !h.name.toLowerCase().startsWith(':')) {
          headers[h.name] = h.value;
        }
      });
      headers[EXTENSION_MARKER] = '1';
      
      return fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
        mode: 'cors'
      });
    },
    
    // Strategy 2: Minimal headers with referrer
    () => {
      const urlObj = new URL(url);
      return fetch(url, {
        method: 'GET',
        headers: {
          [EXTENSION_MARKER]: '1',
          'Referer': urlObj.origin,
          'Accept': 'text/vtt,text/srt,text/plain,*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        credentials: 'omit',
        mode: 'cors'
      });
    }
  ];

  let lastError;
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      log(`Trying strategy ${i + 1} for:`, url);
      const response = await strategies[i]();
      
      if (response.ok || response.type === 'opaque') {
        return response;
      }
      
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error;
      log(`Strategy ${i + 1} failed:`, error.message);
    }
  }
  
  throw lastError;
}

// Main subtitle fetching function with smart naming
async function fetchAndCacheSubtitle(url, tabInfo = {}, retryCount = 0) {
  const urlKey = url.split('?')[0];
  if (processedUrls.has(urlKey) || failedUrls.has(urlKey)) {
    return;
  }
  
  processedUrls.add(urlKey);
  
  try {
    log('Fetching subtitle:', url);
    
    const originalHeaders = headerCache.get(url) || [];
    const response = await fetchWithStrategies(url, originalHeaders);
    
    if (response.type === 'opaque') {
      log('Got opaque response, cannot read content');
      return;
    }
    
    const buffer = await response.arrayBuffer();
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('Empty response');
    }
    
    // Convert first 1000 bytes to text for validation
    const uint8Array = new Uint8Array(buffer);
    const firstChunk = new TextDecoder().decode(uint8Array.slice(0, Math.min(1000, uint8Array.length)));
    
    // Strict content validation
    if (!isValidSubtitleContent(firstChunk, url)) {
      log(`Content validation failed for: ${url}`);
      log('Content preview:', firstChunk.substring(0, 200));
      return;
    }
    
    // Convert entire buffer to base64 for storage
    const textContent = new TextDecoder().decode(uint8Array);
    const base64 = btoa(textContent);
    
    // Generate filename: use smart naming if tabInfo is available, else fallback
    let filename;
    if (tabInfo && (tabInfo.title || tabInfo.url)) {
      filename = generateSmartFilename(url, tabInfo.title || '', tabInfo.url || '');
    } else {
      filename = generateFilename(url);
    }
    
    // Store in chrome storage
    const { subtitles = [] } = await chrome.storage.local.get('subtitles');
    
    const exists = subtitles.some(sub => sub.name === filename || sub.url === url);
    if (!exists) {
      subtitles.push({
        name: filename,
        data: base64,
        url: url,
        timestamp: Date.now(),
        size: buffer.byteLength
      });
      
      await chrome.storage.local.set({ subtitles });
      log(`Successfully cached: ${filename} (${buffer.byteLength} bytes)`);
      
      try {
        await chrome.runtime.sendMessage({ type: 'newSubtitle', name: filename });
      } catch (msgError) {
        log('Could not notify popup:', msgError.message);
      }
    }
    
  } catch (error) {
    log(`Failed to fetch ${url}:`, error.message);
    
    if (retryCount < MAX_RETRIES && !error.message.includes('no-cors')) {
      log(`Retrying ${url} (attempt ${retryCount + 1})`);
      setTimeout(() => {
        fetchAndCacheSubtitle(url, tabInfo, retryCount + 1);
      }, 1000 * (retryCount + 1));
    } else {
      failedUrls.add(urlKey);
    }
  }
}

// Capture request headers
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    // Skip our own requests
    if (details.requestHeaders?.some(h => h.name === EXTENSION_MARKER)) {
      return;
    }
    
    // Store headers for potential subtitle requests
    if (isSubtitleUrl(details.url) || details.url.includes('m3u8')) {
      headerCache.set(details.url, details.requestHeaders || []);
    }
    
    // Periodic cleanup
    if (Math.random() < 0.01) {
      cleanupCache();
    }
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders', 'extraHeaders']
);

// Monitor completed requests with tab info
chrome.webRequest.onCompleted.addListener(
  async (details) => {
    // Skip extension requests
    if (details.initiator?.includes('chrome-extension://') ||
        details.requestHeaders?.some(h => h.name === EXTENSION_MARKER)) {
      return;
    }

    const url = details.url;
    
    // NEW: Get tab information if available
    let tabInfo = { url: '', title: '' };
    if (details.tabId && details.tabId !== -1) {
      try {
        const tab = await chrome.tabs.get(details.tabId);
        tabInfo.url = tab.url || '';
        tabInfo.title = tab.title || '';
      } catch (error) {
        log('Error getting tab info:', error);
      }
    }
    
    // Direct subtitle detection
    if (isSubtitleUrl(url)) {
      log(`Detected potential subtitle URL: ${url}`);
      await fetchAndCacheSubtitle(url, tabInfo);  // Pass tabInfo
      return;
    }
    
    // Check response headers for subtitle content
    if (details.responseHeaders) {
      const contentType = details.responseHeaders.find(h => 
        h.name.toLowerCase() === 'content-type'
      )?.value?.toLowerCase();
      
      if (contentType && (
        contentType.includes('text/vtt') ||
        contentType.includes('text/srt') ||
        contentType.includes('application/ttml') ||
        (contentType.includes('text/plain') && isSubtitleUrl(url))
      ) && !contentType.includes('javascript') && !contentType.includes('application/javascript')) {
        await fetchAndCacheSubtitle(url, tabInfo);
        return;
      }
    }
    
    // Parse M3U8 playlists
    if (/\.m3u8(\?|$)/i.test(url)) {
      try {
        const headers = headerCache.get(url) || [];
        const headersObj = {};
        headers.forEach(h => {
          if (h.name && h.value) headersObj[h.name] = h.value;
        });
        headersObj[EXTENSION_MARKER] = '1';
        
        const response = await fetch(url, {
          headers: headersObj,
          credentials: 'include'
        });
        
        if (!response.ok) return;
        
        const text = await response.text();
        
        // Look for subtitle references
        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.includes('SUBTITLES') || trimmed.includes('subtitles')) {
            const urlMatch = trimmed.match(/URI="([^"]+)"/);
            if (urlMatch) {
              const subUrl = new URL(urlMatch[1], url).href;
              await fetchAndCacheSubtitle(subUrl, tabInfo);  // Pass tabInfo
            }
          }
          
          // Also check for direct subtitle URLs
          if (isSubtitleUrl(trimmed)) {
            const subUrl = new URL(trimmed, url).href;
            await fetchAndCacheSubtitle(subUrl, tabInfo);  // Pass tabInfo
          }
        }
        
      } catch (error) {
        log('Error parsing M3U8:', error.message);
      }
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders', 'extraHeaders']
);

// Message handling (unchanged)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'getSubtitles':
          const { subtitles = [] } = await chrome.storage.local.get('subtitles');
          sendResponse({ subtitles });
          break;
          
        case 'clearSubtitles':
          await chrome.storage.local.set({ subtitles: [] });
          processedUrls.clear();
          failedUrls.clear();
          sendResponse({ success: true });
          break;
          
        case 'downloadSubtitle':
          const { file } = message;
          if (!file?.name || !file?.data) {
            throw new Error('Invalid file data');
          }
          
          const dataUrl = `data:text/plain;base64,${file.data}`;
          
          chrome.downloads.download({
            url: dataUrl,
            filename: file.name,
            saveAs: true
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              log('Download failed:', chrome.runtime.lastError);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              log('Download started:', downloadId);
              sendResponse({ success: true, downloadId });
            }
          });
          break;
          
        case 'downloadAllSubtitles':
          const { subtitles: allSubs = [] } = await chrome.storage.local.get('subtitles');
          
          if (allSubs.length === 0) {
            sendResponse({ success: false, error: 'No subtitles available' });
            break;
          }
          
          let downloadCount = 0;
          const errors = [];
          
          for (const file of allSubs) {
            try {
              const dataUrl = `data:text/plain;base64,${file.data}`;
              
              chrome.downloads.download({
                url: dataUrl,
                filename: file.name,
                saveAs: false
              }, (downloadId) => {
                if (chrome.runtime.lastError) {
                  errors.push(`${file.name}: ${chrome.runtime.lastError.message}`);
                } else {
                  downloadCount++;
                }
              });
            } catch (error) {
              errors.push(`${file.name}: ${error.message}`);
            }
          }
          
          sendResponse({ 
            success: true, 
            total: allSubs.length, 
            downloaded: downloadCount,
            errors 
          });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      log('Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true;
});

// Periodic cleanup
setInterval(() => {
  cleanupCache();
  
  if (failedUrls.size > 100) {
    failedUrls.clear();
  }
}, 300000);

log('Subtitle Catcher background script initialized with automatic naming');