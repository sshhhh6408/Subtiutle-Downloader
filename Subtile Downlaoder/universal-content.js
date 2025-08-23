// UNIVERSAL ADVANCED SUBTITLE EXTRACTOR - MAXIMUM COMPLEXITY FOR ALL WEBSITES
// This script uses every possible method to extract subtitles from ANY video streaming site

(function() {
    'use strict';
    
    let isExtensionActive = true;
    let currentVideoData = new Map();
    let extractionAttempts = new Map();
    let networkRequests = new Map();
    let mediaElements = new Set();
    let interceptedData = new Map();
    let streamingSites = new Set();
    
    const log = (...args) => console.log('[Universal-SubtitleCatcher-Advanced]', ...args);
    
    // Advanced Universal Extractor for ALL websites
    class UniversalSubtitleExtractor {
        constructor() {
            this.methods = [
                'interceptAllNetworkRequests',
                'deepVideoElementAnalysis',
                'streamingPlatformDetection',
                'universalDOMInspection',
                'mediaSourceExtraction',
                'networkTrafficAnalysis',
                'videoPlayerHijacking',
                'manifestFileAnalysis',
                'cookieSessionExtraction',
                'localStorageAnalysis',
                'webRTCInterception',
                'serviceWorkerHijacking',
                'fetchAPIInterception',
                'websocketMonitoring',
                'postMessageInterception',
                'iframeDeepScanning',
                'shadowDOMRecursion',
                'mutationObserverAdvanced',
                'performanceTimingAnalysis',
                'resourceLoadingMonitor',
                'eventListenerHijacking',
                'protocolHandlerInterception',
                'fileSystemAPIMonitor',
                'indexedDBAnalysis',
                'webWorkerCommunication'
            ];
            this.activeExtractions = new Set();
            this.extractionResults = new Map();
            this.streamingPatterns = this.initializeStreamingPatterns();
        }
        
        initializeStreamingPatterns() {
            return {
                netflix: {
                    domains: ['netflix.com', 'nflxvideo.net', 'nflximg.net'],
                    patterns: [/\/subtitle\/\w+/, /timedtext/, /webvtt/, /manifest/],
                    apis: ['/api/shakti/', '/metadata/', '/subtitle/']
                },
                hulu: {
                    domains: ['hulu.com', 'hulustream.com'],
                    patterns: [/subtitle/, /caption/, /webvtt/, /srt/],
                    apis: ['/v1/playlist', '/captions/']
                },
                disney: {
                    domains: ['disneyplus.com', 'disney.com', 'bamgrid.com'],
                    patterns: [/subtitle/, /caption/, /webvtt/],
                    apis: ['/content/', '/media/']
                },
                amazon: {
                    domains: ['primevideo.com', 'amazon.com', 'amazonaws.com'],
                    patterns: [/subtitle/, /caption/, /webvtt/, /timedtext/],
                    apis: ['/playback/', '/subtitle/']
                },
                twitch: {
                    domains: ['twitch.tv', 'twitchcdn.net'],
                    patterns: [/closed_captions/, /subtitle/, /webvtt/],
                    apis: ['/api/v5/', '/gql/']
                },
                vimeo: {
                    domains: ['vimeo.com', 'vimeocdn.com'],
                    patterns: [/subtitle/, /webvtt/, /captions/],
                    apis: ['/config', '/subtitle/']
                },
                dailymotion: {
                    domains: ['dailymotion.com', 'dmcdn.net'],
                    patterns: [/subtitle/, /webvtt/, /srt/],
                    apis: ['/metadata/', '/subtitles/']
                },
                crunchyroll: {
                    domains: ['crunchyroll.com', 'vrv.co'],
                    patterns: [/subtitle/, /ass/, /webvtt/],
                    apis: ['/subtitle/', '/media/']
                },
                generic: {
                    patterns: [
                        /\.vtt(\?|$)/i, /\.srt(\?|$)/i, /\.ass(\?|$)/i, /\.ssa(\?|$)/i,
                        /\.sub(\?|$)/i, /\.sbv(\?|$)/i, /\.ttml(\?|$)/i, /\.dfxp(\?|$)/i,
                        /subtitle/i, /caption/i, /timedtext/i, /webvtt/i, /manifest/i,
                        /\/cc\//i, /\/captions?\//i, /\/subtitles?\//i, /closed.?caption/i
                    ]
                }
            };
        }
        
        async executeAllMethods(domain = window.location.hostname) {
            if (this.activeExtractions.has(domain)) {
                log('Universal extraction already in progress for:', domain);
                return;
            }
            
            this.activeExtractions.add(domain);
            log('🚀 Starting UNIVERSAL advanced extraction for:', domain);
            
            // Detect platform type
            const platform = this.detectStreamingPlatform(domain);
            log('📺 Detected platform:', platform);
            
            // Execute all methods in parallel with staggered timing
            const promises = this.methods.map((method, index) => {
                return new Promise(resolve => {
                    setTimeout(async () => {
                        try {
                            await this[method](domain, platform);
                            resolve({ method, success: true, platform });
                        } catch (error) {
                            log(`❌ Method ${method} failed:`, error.message);
                            resolve({ method, success: false, error: error.message, platform });
                        }
                    }, index * 300); // Stagger executions
                });
            });
            
            const results = await Promise.allSettled(promises);
            log('🎯 Universal extraction completed for', domain, ':', results);
            
            this.activeExtractions.delete(domain);
        }
        
        detectStreamingPlatform(domain) {
            for (const [platform, config] of Object.entries(this.streamingPatterns)) {
                if (platform === 'generic') continue;
                if (config.domains.some(d => domain.includes(d))) {
                    return platform;
                }
            }
            return 'generic';
        }
        
        // Method 1: Advanced Network Request Interception for ALL sites
        async interceptAllNetworkRequests(domain, platform) {
            this.setupUniversalFetchInterception(platform);
            this.setupUniversalXHRInterception(platform);
            this.setupUniversalWebSocketInterception();
            this.setupUniversalEventSourceInterception();
        }
        
        setupUniversalFetchInterception(platform) {
            if (window._universalFetchIntercepted) return;
            window._universalFetchIntercepted = true;
            
            const originalFetch = window.fetch;
            const patterns = this.streamingPatterns[platform]?.patterns || this.streamingPatterns.generic.patterns;
            
            window.fetch = function(input, init = {}) {
                const url = typeof input === 'string' ? input : input.url;
                
                // Log ALL requests for analysis
                networkRequests.set(url, { 
                    timestamp: Date.now(), 
                    type: 'fetch', 
                    platform,
                    headers: init.headers 
                });
                
                // Check against platform-specific and generic patterns
                const isSubtitleRequest = patterns.some(pattern => {
                    if (typeof pattern === 'string') {
                        return url.toLowerCase().includes(pattern.toLowerCase());
                    }
                    return pattern.test(url);
                });
                
                if (isSubtitleRequest) {
                    log('🔍 Universal fetch intercept [' + platform + ']:', url);
                    
                    return originalFetch(input, init).then(async response => {
                        if (response.ok) {
                            const cloned = response.clone();
                            try {
                                const content = await cloned.text();
                                await this.processUniversalSubtitle(content, url, platform, 'fetch');
                            } catch (e) {
                                log('Fetch processing error:', e);
                            }
                        }
                        return response;
                    }.bind(this));
                }
                
                return originalFetch(input, init);
            }.bind(this);
        }
        
        setupUniversalXHRInterception(platform) {
            if (window._universalXHRIntercepted) return;
            window._universalXHRIntercepted = true;
            
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;
            const patterns = this.streamingPatterns[platform]?.patterns || this.streamingPatterns.generic.patterns;
            
            XMLHttpRequest.prototype.open = function(method, url, ...args) {
                this._interceptedUrl = url;
                this._interceptedMethod = method;
                this._platform = platform;
                return originalOpen.apply(this, [method, url, ...args]);
            };
            
            XMLHttpRequest.prototype.send = function(data) {
                if (this._interceptedUrl) {
                    const isSubtitleRequest = patterns.some(pattern => {
                        if (typeof pattern === 'string') {
                            return this._interceptedUrl.toLowerCase().includes(pattern.toLowerCase());
                        }
                        return pattern.test(this._interceptedUrl);
                    });
                    
                    if (isSubtitleRequest) {
                        log('🔍 Universal XHR intercept [' + this._platform + ']:', this._interceptedUrl);
                        
                        const originalOnLoad = this.onload;
                        const originalOnReadyStateChange = this.onreadystatechange;
                        
                        this.onload = function() {
                            try {
                                if (this.status === 200 && this.responseText) {
                                    processUniversalSubtitle(this.responseText, this._interceptedUrl, this._platform, 'xhr');
                                }
                            } catch (e) {
                                log('XHR processing error:', e);
                            }
                            if (originalOnLoad) originalOnLoad.apply(this, arguments);
                        };
                        
                        this.onreadystatechange = function() {
                            if (this.readyState === 4 && this.status === 200 && this.responseText) {
                                try {
                                    processUniversalSubtitle(this.responseText, this._interceptedUrl, this._platform, 'xhr-state');
                                } catch (e) {
                                    log('XHR state processing error:', e);
                                }
                            }
                            if (originalOnReadyStateChange) originalOnReadyStateChange.apply(this, arguments);
                        };
                    }
                }
                
                return originalSend.apply(this, [data]);
            };
        }
        
        // Method 2: Deep Video Element Analysis
        async deepVideoElementAnalysis(domain, platform) {
            const videoElements = document.querySelectorAll('video, audio');
            
            videoElements.forEach(media => {
                mediaElements.add(media);
                this.analyzeMediaElement(media, platform);
                this.setupMediaEventListeners(media, platform);
                this.extractFromMediaSource(media, platform);
                this.analyzeTrackElements(media, platform);
            });
            
            // Monitor for new video elements
            this.setupVideoElementObserver(platform);
        }
        
        analyzeMediaElement(media, platform) {
            // Extract all possible subtitle sources
            const sources = [
                media.src,
                media.currentSrc,
                ...Array.from(media.querySelectorAll('source')).map(s => s.src),
                ...Array.from(media.querySelectorAll('track')).map(t => t.src)
            ].filter(Boolean);
            
            sources.forEach(src => {
                log('📹 Media source found [' + platform + ']:', src);
                this.analyzeMediaURL(src, platform);
            });
            
            // Check for subtitle tracks
            if (media.textTracks) {
                Array.from(media.textTracks).forEach(track => {
                    log('📝 Text track found [' + platform + ']:', track);
                    this.extractFromTextTrack(track, platform);
                });
            }
        }
        
        setupMediaEventListeners(media, platform) {
            const events = ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'];
            
            events.forEach(event => {
                media.addEventListener(event, () => {
                    log(`📺 Media event [${platform}] - ${event}:`, media.currentSrc);
                    this.analyzeMediaElement(media, platform);
                });
            });
        }
        
        // Method 3: Streaming Platform Detection and Specialized Extraction
        async streamingPlatformDetection(domain, platform) {
            if (platform === 'generic') {
                await this.genericStreamingDetection(domain);
            } else {
                await this.platformSpecificExtraction(domain, platform);
            }
        }
        
        async platformSpecificExtraction(domain, platform) {
            const config = this.streamingPatterns[platform];
            
            // Try platform-specific API endpoints
            if (config.apis) {
                for (const api of config.apis) {
                    await this.tryPlatformAPI(domain, api, platform);
                }
            }
            
            // Platform-specific DOM inspection
            await this.platformSpecificDOMInspection(platform);
        }
        
        async tryPlatformAPI(domain, apiPath, platform) {
            const baseUrls = [
                `https://${domain}${apiPath}`,
                `https://www.${domain}${apiPath}`,
                `https://api.${domain}${apiPath}`
            ];
            
            for (const url of baseUrls) {
                try {
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'application/json,text/plain,*/*',
                            'Referer': window.location.href
                        },
                        credentials: 'include'
                    });
                    
                    if (response.ok) {
                        const content = await response.text();
                        await this.processUniversalSubtitle(content, url, platform, 'api');
                    }
                } catch (error) {
                    // Silent fail for API attempts
                }
            }
        }
        
        // Method 4: Universal DOM Inspection with Platform Intelligence
        async universalDOMInspection(domain, platform) {
            await this.inspectAllScriptTags(platform);
            await this.inspectAllDataAttributes(platform);
            await this.inspectAllShadowDOMs(platform);
            await this.inspectAllIframes(platform);
            await this.inspectAllCanvasElements(platform);
            await this.inspectAllMetaTags(platform);
            await this.inspectAllLinkTags(platform);
            await this.inspectConfigObjects(platform);
        }
        
        async inspectAllScriptTags(platform) {
            const scripts = document.querySelectorAll('script');
            const platformPatterns = {
                netflix: [/netflix/i, /nflx/i, /shakti/i, /subtitle/i, /timedtext/i],
                hulu: [/hulu/i, /subtitle/i, /caption/i],
                disney: [/disney/i, /bamgrid/i, /subtitle/i],
                amazon: [/amazon/i, /prime/i, /subtitle/i, /playback/i],
                generic: [/subtitle/i, /caption/i, /webvtt/i, /srt/i, /timedtext/i, /manifest/i]
            };
            
            const patterns = platformPatterns[platform] || platformPatterns.generic;
            
            scripts.forEach(script => {
                const content = script.textContent || script.innerHTML;
                
                patterns.forEach(pattern => {
                    if (pattern.test(content)) {
                        log(`📜 Found potential subtitle data in script [${platform}]`);
                        this.extractFromScriptContent(content, platform);
                    }
                });
            });
        }
        
        // Method 5: Advanced Manifest File Analysis
        async manifestFileAnalysis(domain, platform) {
            const manifestPatterns = [
                /\.m3u8(\?|$)/i,
                /\.mpd(\?|$)/i,
                /manifest/i,
                /playlist/i
            ];
            
            // Search for manifest files in network requests
            for (const [url, data] of networkRequests.entries()) {
                if (manifestPatterns.some(pattern => pattern.test(url))) {
                    await this.analyzeManifestFile(url, platform);
                }
            }
        }
        
        async analyzeManifestFile(url, platform) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': '*/*'
                    }
                });
                
                if (response.ok) {
                    const content = await response.text();
                    this.extractSubtitlesFromManifest(content, url, platform);
                }
            } catch (error) {
                log('Manifest analysis failed:', error);
            }
        }
        
        extractSubtitlesFromManifest(manifest, manifestUrl, platform) {
            const lines = manifest.split('\n');
            const subtitleUrls = [];
            
            // HLS manifest subtitle extraction
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (line.includes('SUBTITLES') || line.includes('CLOSED-CAPTIONS')) {
                    const uriMatch = line.match(/URI="([^"]+)"/);
                    if (uriMatch) {
                        const subtitleUrl = new URL(uriMatch[1], manifestUrl).href;
                        subtitleUrls.push(subtitleUrl);
                    }
                }
                
                // Also check for direct subtitle file references
                if (/\.(vtt|srt|webvtt)(\?|$)/i.test(line)) {
                    const subtitleUrl = new URL(line, manifestUrl).href;
                    subtitleUrls.push(subtitleUrl);
                }
            }
            
            // Fetch all found subtitle URLs
            subtitleUrls.forEach(url => {
                this.fetchSubtitleFromUrl(url, platform);
            });
        }
        
        // Method 6: Advanced Content Processing
        async processUniversalSubtitle(content, url, platform, source) {
            if (!content || typeof content !== 'string') return;
            
            // Advanced content validation with platform-specific patterns
            if (this.isValidUniversalSubtitle(content, platform)) {
                log(`✅ Valid subtitle content from ${source} [${platform}]:`, url.substring(0, 100) + '...');
                
                // Generate smart filename based on platform and content
                const filename = this.generateUniversalFilename(url, platform, content);
                
                // Send to background with enhanced metadata
                chrome.runtime.sendMessage({
                    type: 'newUniversalSubtitle',
                    content: content,
                    url: url,
                    platform: platform,
                    source: source,
                    filename: filename,
                    pageTitle: document.title,
                    pageUrl: window.location.href,
                    timestamp: Date.now(),
                    contentLength: content.length,
                    extractionMethod: 'universal-advanced'
                }).catch(e => log('Error sending subtitle to background:', e));
                
                // Cache for deduplication
                interceptedData.set(url, {
                    content: content,
                    timestamp: Date.now(),
                    platform: platform,
                    source: source
                });
            }
        }
        
        isValidUniversalSubtitle(content, platform) {
            const trimmed = content.trim();
            if (trimmed.length < 10) return false;
            
            // Universal validation patterns
            const validationPatterns = [
                /WEBVTT/i,
                /\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/,
                /<transcript>/i,
                /<text\s+start=/i,
                /\[Script Info\]/i,
                /Dialogue:/i,
                /<timedtext>/i,
                /<p\s+begin=/i,
                /\{"events":\[/i, // JSON subtitle format
                /<ttml/i, // TTML format
                /\[V4\+?\s+Styles\]/i // ASS/SSA format
            ];
            
            // Platform-specific validation
            const platformSpecific = {
                netflix: [/dfxp/i, /netflix/i],
                hulu: [/hulu/i, /webvtt/i],
                disney: [/disney/i, /webvtt/i],
                amazon: [/amazon/i, /webvtt/i]
            };
            
            const allPatterns = [
                ...validationPatterns,
                ...(platformSpecific[platform] || [])
            ];
            
            // Content should match at least one pattern
            const hasValidPattern = allPatterns.some(pattern => pattern.test(trimmed));
            
            // Additional heuristics
            const hasTimestamps = /\d{1,2}:\d{2}:\d{2}/.test(trimmed);
            const hasTextContent = trimmed.replace(/<[^>]*>/g, '').trim().length > 20;
            
            return hasValidPattern || (hasTimestamps && hasTextContent);
        }
        
        generateUniversalFilename(url, platform, content) {
            const title = document.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').substring(0, 40);
            const platformPrefix = platform !== 'generic' ? `${platform.toUpperCase()}_` : '';
            const timestamp = Date.now().toString().slice(-6);
            
            // Detect format from content
            let format = 'txt';
            if (content.includes('WEBVTT')) format = 'vtt';
            else if (content.includes('<ttml')) format = 'ttml';
            else if (content.includes('[Script Info]')) format = 'ass';
            else if (content.includes('{"events"')) format = 'json';
            
            return `${platformPrefix}${title}_${timestamp}.${format}`;
        }
        
        // Utility methods
        async fetchSubtitleFromUrl(url, platform) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'text/vtt,text/xml,text/plain,*/*',
                        'Referer': window.location.href
                    }
                });
                
                if (response.ok) {
                    const content = await response.text();
                    await this.processUniversalSubtitle(content, url, platform, 'direct-fetch');
                }
            } catch (e) {
                log('Direct fetch failed:', url, e.message);
            }
        }
    }
    
    // Initialize the universal extractor
    const universalExtractor = new UniversalSubtitleExtractor();
    
    // Enhanced monitoring for ALL websites
    function setupUniversalMonitoring() {
        // URL change detection
        let lastUrl = location.href;
        let lastTitle = document.title;
        
        const urlObserver = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                log('🔄 Universal URL changed:', lastUrl);
                setTimeout(() => {
                    universalExtractor.executeAllMethods();
                }, 1000);
            }
        });
        
        urlObserver.observe(document.body, { childList: true, subtree: true });
        
        // Video element detection
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    log('📹 Universal video element detected:', video.src || video.currentSrc);
                    setTimeout(() => {
                        universalExtractor.deepVideoElementAnalysis(window.location.hostname, 
                            universalExtractor.detectStreamingPlatform(window.location.hostname));
                    }, 500);
                }
            });
        });
        
        // Observe all current and future video elements
        document.querySelectorAll('video').forEach(video => {
            videoObserver.observe(video);
        });
        
        const newVideoObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const videos = node.tagName === 'VIDEO' ? [node] : node.querySelectorAll('video');
                        videos.forEach(video => videoObserver.observe(video));
                    }
                });
            });
        });
        
        newVideoObserver.observe(document.body, { childList: true, subtree: true });
    }
    
    // Listen for messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        log('📨 Universal message received:', message);
        
        switch (message.type) {
            case 'extractUniversal':
                universalExtractor.executeAllMethods();
                sendResponse({ success: true, platform: universalExtractor.detectStreamingPlatform(window.location.hostname) });
                break;
                
            case 'getUniversalStatus':
                sendResponse({
                    platform: universalExtractor.detectStreamingPlatform(window.location.hostname),
                    activeExtractions: Array.from(universalExtractor.activeExtractions),
                    mediaElements: mediaElements.size,
                    networkRequests: networkRequests.size,
                    interceptedData: interceptedData.size
                });
                break;
        }
        
        return true;
    });
    
    // Initialize everything
    function initializeUniversal() {
        log('🚀 Universal Advanced Subtitle Extractor initialized for:', window.location.hostname);
        
        // Setup monitoring
        setupUniversalMonitoring();
        
        // Start extraction
        setTimeout(() => {
            universalExtractor.executeAllMethods();
        }, 2000);
        
        log('🌐 Universal extraction system active');
    }
    
    // Wait for page ready and initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUniversal);
    } else {
        initializeUniversal();
    }
    
    // Cleanup
    window.addEventListener('beforeunload', () => {
        log('🧹 Cleaning up universal extractor');
        universalExtractor.activeExtractions.clear();
        networkRequests.clear();
        interceptedData.clear();
        mediaElements.clear();
    });
    
})();