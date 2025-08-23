// YouTube Content Script - Advanced Subtitle Extraction
// This script runs on YouTube pages to extract subtitles using multiple methods

(function() {
    'use strict';
    
    let isExtensionActive = true;
    let currentVideoId = null;
    let subtitleExtractors = [];
    
    const log = (...args) => console.log('[YT-SubtitleCatcher]', ...args);
    
    // Method 1: Intercept YouTube's internal API calls
    function interceptYouTubeAPI() {
        // Override XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._url = url;
            return originalXHROpen.apply(this, [method, url, ...args]);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            if (this._url && this._url.includes('timedtext')) {
                log('Intercepted timedtext request:', this._url);
                
                const originalOnLoad = this.onload;
                this.onload = function() {
                    try {
                        if (this.status === 200 && this.responseText) {
                            extractSubtitleFromResponse(this.responseText, this._url);
                        }
                    } catch (e) {
                        log('Error processing intercepted subtitle:', e);
                    }
                    if (originalOnLoad) originalOnLoad.apply(this, arguments);
                };
            }
            return originalXHRSend.apply(this, [data]);
        };
        
        // Override fetch
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            const urlStr = typeof url === 'string' ? url : url.toString();
            
            if (urlStr.includes('timedtext') || urlStr.includes('caption')) {
                log('Intercepted fetch request:', urlStr);
                
                return originalFetch(url, options).then(response => {
                    if (response.ok) {
                        // Clone response to avoid consuming it
                        const clonedResponse = response.clone();
                        clonedResponse.text().then(text => {
                            extractSubtitleFromResponse(text, urlStr);
                        }).catch(e => log('Error reading fetched subtitle:', e));
                    }
                    return response;
                });
            }
            
            return originalFetch(url, options);
        };
    }
    
    // Method 2: Extract from YouTube player config
    function extractFromPlayerConfig() {
        try {
            // Try to find ytInitialPlayerResponse
            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
                const content = script.textContent;
                if (content.includes('ytInitialPlayerResponse')) {
                    const match = content.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
                    if (match) {
                        const playerResponse = JSON.parse(match[1]);
                        extractSubtitlesFromPlayerResponse(playerResponse);
                        return;
                    }
                }
            }
            
            // Try window.ytInitialPlayerResponse
            if (window.ytInitialPlayerResponse) {
                extractSubtitlesFromPlayerResponse(window.ytInitialPlayerResponse);
            }
        } catch (e) {
            log('Error extracting from player config:', e);
        }
    }
    
    // Method 3: Direct timedtext API access
    function extractViaDirectAPI(videoId) {
        if (!videoId) return;
        
        const apiUrls = [
            `https://www.youtube.com/api/timedtext?v=${videoId}&asr_langs=de,en,es,fr,it,ja,ko,pt,ru&caps=asr&exp=xftt,xctw&xoaf=5&hl=en&ip=0.0.0.0&ipbits=0&expire=1640995200&sparams=ip,ipbits,expire,v,asr_langs,caps,exp,xoaf&signature=placeholder&key=yttt1&kind=asr`,
            `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&name=&fmt=vtt`,
            `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`,
            `https://video.google.com/timedtext?v=${videoId}&lang=en&fmt=vtt`
        ];
        
        apiUrls.forEach(url => {
            fetch(url, {
                method: 'GET',
                credentials: 'include'
            }).then(response => {
                if (response.ok) {
                    return response.text();
                }
                throw new Error(`HTTP ${response.status}`);
            }).then(text => {
                if (text && text.trim()) {
                    extractSubtitleFromResponse(text, url);
                }
            }).catch(e => {
                log('Direct API request failed:', url, e.message);
            });
        });
    }
    
    // Method 4: Extract from video info
    function extractFromVideoInfo(videoId) {
        if (!videoId) return;
        
        const videoInfoUrl = `https://www.youtube.com/get_video_info?video_id=${videoId}&el=embedded&ps=default&eurl=&gl=US&hl=en`;
        
        fetch(videoInfoUrl)
            .then(response => response.text())
            .then(data => {
                try {
                    const params = new URLSearchParams(data);
                    const playerResponse = params.get('player_response');
                    if (playerResponse) {
                        const parsed = JSON.parse(playerResponse);
                        extractSubtitlesFromPlayerResponse(parsed);
                    }
                } catch (e) {
                    log('Error parsing video info:', e);
                }
            })
            .catch(e => log('Video info request failed:', e));
    }
    
    // Method 5: Extract from page HTML patterns
    function extractFromPageHTML() {
        try {
            // Look for caption tracks in the page
            const captionElements = document.querySelectorAll('[class*="caption"], [class*="subtitle"], [data-language-code]');
            captionElements.forEach(element => {
                const href = element.getAttribute('href');
                const src = element.getAttribute('src');
                const dataUrl = element.getAttribute('data-url');
                
                [href, src, dataUrl].forEach(url => {
                    if (url && (url.includes('timedtext') || url.includes('caption'))) {
                        log('Found caption URL in HTML:', url);
                        fetchSubtitleFromUrl(url);
                    }
                });
            });
        } catch (e) {
            log('Error extracting from HTML:', e);
        }
    }
    
    // Helper function to extract subtitles from player response
    function extractSubtitlesFromPlayerResponse(playerResponse) {
        try {
            const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            if (captions && captions.length > 0) {
                log('Found', captions.length, 'caption tracks');
                
                captions.forEach(caption => {
                    const baseUrl = caption.baseUrl;
                    if (baseUrl) {
                        // Try different formats
                        const formats = ['vtt', 'srv3', 'ttml'];
                        formats.forEach(fmt => {
                            const url = baseUrl.includes('fmt=') 
                                ? baseUrl.replace(/fmt=[^&]*/, `fmt=${fmt}`)
                                : `${baseUrl}&fmt=${fmt}`;
                            
                            log('Fetching subtitle:', url);
                            fetchSubtitleFromUrl(url);
                        });
                    }
                });
            }
            
            // Also check for auto-generated captions
            const autoCaptions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.audioTracks;
            if (autoCaptions && autoCaptions.length > 0) {
                log('Found auto-generated captions');
                autoCaptions.forEach(track => {
                    const captionTrackUrl = track?.captionTrackIndices?.[0];
                    if (captionTrackUrl) {
                        fetchSubtitleFromUrl(captionTrackUrl);
                    }
                });
            }
        } catch (e) {
            log('Error extracting from player response:', e);
        }
    }
    
    // Helper function to fetch subtitle from URL
    function fetchSubtitleFromUrl(url) {
        fetch(url, {
            method: 'GET',
            credentials: 'include'
        }).then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(`HTTP ${response.status}`);
        }).then(text => {
            extractSubtitleFromResponse(text, url);
        }).catch(e => {
            log('Failed to fetch subtitle from URL:', url, e.message);
        });
    }
    
    // Process extracted subtitle content
    function extractSubtitleFromResponse(content, url) {
        if (!content || content.trim().length === 0) return;
        
        try {
            // Basic validation - check if it looks like subtitle content
            const lowerContent = content.toLowerCase();
            if (lowerContent.includes('webvtt') || 
                lowerContent.includes('-->') || 
                lowerContent.includes('<transcript>') ||
                /\d{2}:\d{2}:\d{2}/.test(content)) {
                
                log('Valid subtitle content detected, sending to background');
                
                // Send to background script
                chrome.runtime.sendMessage({
                    type: 'newYouTubeSubtitle',
                    content: content,
                    url: url,
                    videoId: currentVideoId,
                    pageTitle: document.title,
                    pageUrl: window.location.href
                }).catch(e => log('Error sending subtitle to background:', e));
            }
        } catch (e) {
            log('Error processing subtitle content:', e);
        }
    }
    
    // Get current video ID
    function getCurrentVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('v');
        if (videoId && videoId !== currentVideoId) {
            currentVideoId = videoId;
            log('New video detected:', videoId);
            
            // Try all extraction methods
            setTimeout(() => {
                extractFromPlayerConfig();
                extractViaDirectAPI(videoId);
                extractFromVideoInfo(videoId);
                extractFromPageHTML();
            }, 2000); // Wait for page to load
        }
        return videoId;
    }
    
    // Monitor for YouTube navigation (SPA)
    function monitorNavigation() {
        let lastUrl = location.href;
        
        const observer = new MutationObserver(() => {
            const currentUrl = location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                log('YouTube navigation detected');
                setTimeout(() => {
                    getCurrentVideoId();
                }, 1000);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Also listen for popstate events
        window.addEventListener('popstate', () => {
            setTimeout(() => {
                getCurrentVideoId();
            }, 1000);
        });
        
        // Override pushState and replaceState
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function() {
            originalPushState.apply(history, arguments);
            setTimeout(() => getCurrentVideoId(), 1000);
        };
        
        history.replaceState = function() {
            originalReplaceState.apply(history, arguments);
            setTimeout(() => getCurrentVideoId(), 1000);
        };
    }
    
    // Initialize
    function initialize() {
        log('YouTube content script initialized');
        
        // Start API interception
        interceptYouTubeAPI();
        
        // Monitor navigation
        monitorNavigation();
        
        // Initial extraction
        getCurrentVideoId();
        
        // Listen for messages from popup/background
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'extractCurrentVideo') {
                log('Manual extraction requested');
                const videoId = getCurrentVideoId();
                if (videoId) {
                    extractFromPlayerConfig();
                    extractViaDirectAPI(videoId);
                    extractFromVideoInfo(videoId);
                    extractFromPageHTML();
                    sendResponse({ success: true, videoId });
                } else {
                    sendResponse({ success: false, error: 'No video detected' });
                }
            }
            return true;
        });
        
        log('All extraction methods activated');
    }
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();