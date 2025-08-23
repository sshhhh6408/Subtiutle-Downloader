// Advanced YouTube Content Script - Maximum Complexity Subtitle Extraction
// This script uses every possible method to extract YouTube subtitles

(function() {
    'use strict';
    
    let isExtensionActive = true;
    let currentVideoId = null;
    let extractionAttempts = new Map();
    let networkRequests = new Map();
    let playerInstances = new Set();
    let interceptedData = new Map();
    
    const log = (...args) => console.log('[YT-SubtitleCatcher-Advanced]', ...args);
    
    // Complex extraction manager
    class AdvancedYouTubeExtractor {
        constructor() {
            this.methods = [
                'interceptNetworkRequests',
                'deepDOMInspection',
                'playerObjectHijacking',
                'iframeInjection',
                'webWorkerMethod',
                'mutationObserverMethod',
                'performanceAPIMethod',
                'serviceWorkerMethod',
                'cookieBasedMethod',
                'historyAPIMethod',
                'websocketMethod',
                'postMessageMethod',
                'storageEventMethod',
                'clipboardAPIMethod',
                'geolocationSpoofMethod'
            ];
            this.activeExtractions = new Set();
            this.extractionResults = new Map();
        }
        
        async executeAllMethods(videoId) {
            if (this.activeExtractions.has(videoId)) {
                log('Extraction already in progress for:', videoId);
                return;
            }
            
            this.activeExtractions.add(videoId);
            log('Starting advanced extraction for:', videoId);
            
            // Execute all methods in parallel with delays
            const promises = this.methods.map((method, index) => {
                return new Promise(resolve => {
                    setTimeout(async () => {
                        try {
                            await this[method](videoId);
                            resolve({ method, success: true });
                        } catch (error) {
                            log(`Method ${method} failed:`, error.message);
                            resolve({ method, success: false, error: error.message });
                        }
                    }, index * 500); // Stagger executions
                });
            });
            
            const results = await Promise.allSettled(promises);
            log('Advanced extraction completed:', results);
            
            this.activeExtractions.delete(videoId);
        }
        
        // Method 1: Advanced Network Request Interception
        async interceptNetworkRequests(videoId) {
            // Override multiple network APIs
            this.interceptFetch();
            this.interceptXMLHttpRequest();
            this.interceptWebSocket();
            this.interceptEventSource();
            this.interceptNavigator();
            
            // Monitor all network activity
            this.setupPerformanceObserver();
            this.setupResourceTimingAPI();
        }
        
        interceptFetch() {
            if (window._fetchIntercepted) return;
            window._fetchIntercepted = true;
            
            const originalFetch = window.fetch;
            window.fetch = function(input, init = {}) {
                const url = typeof input === 'string' ? input : input.url;
                
                // Log all requests for analysis
                networkRequests.set(url, { timestamp: Date.now(), type: 'fetch' });
                
                if (url.includes('timedtext') || url.includes('caption') || url.includes('transcript')) {
                    log('🔍 Advanced fetch intercept:', url);
                    
                    return originalFetch(input, init).then(async response => {
                        if (response.ok) {
                            const cloned = response.clone();
                            try {
                                const content = await cloned.text();
                                await this.processExtractedContent(content, url, 'fetch');
                            } catch (e) {
                                log('Fetch processing error:', e);
                            }
                        }
                        return response;
                    });
                }
                
                return originalFetch(input, init);
            }.bind(this);
        }
        
        interceptXMLHttpRequest() {
            if (window._xhrIntercepted) return;
            window._xhrIntercepted = true;
            
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;
            
            XMLHttpRequest.prototype.open = function(method, url, ...args) {
                this._interceptedUrl = url;
                this._interceptedMethod = method;
                return originalOpen.apply(this, [method, url, ...args]);
            };
            
            XMLHttpRequest.prototype.send = function(data) {
                if (this._interceptedUrl && (
                    this._interceptedUrl.includes('timedtext') ||
                    this._interceptedUrl.includes('caption') ||
                    this._interceptedUrl.includes('get_video_info') ||
                    this._interceptedUrl.includes('player_response')
                )) {
                    log('🔍 Advanced XHR intercept:', this._interceptedUrl);
                    
                    const originalOnLoad = this.onload;
                    const originalOnReadyStateChange = this.onreadystatechange;
                    
                    this.onload = function() {
                        try {
                            if (this.status === 200 && this.responseText) {
                                processExtractedContent(this.responseText, this._interceptedUrl, 'xhr');
                            }
                        } catch (e) {
                            log('XHR processing error:', e);
                        }
                        if (originalOnLoad) originalOnLoad.apply(this, arguments);
                    };
                    
                    this.onreadystatechange = function() {
                        if (this.readyState === 4 && this.status === 200 && this.responseText) {
                            try {
                                processExtractedContent(this.responseText, this._interceptedUrl, 'xhr-state');
                            } catch (e) {
                                log('XHR state processing error:', e);
                            }
                        }
                        if (originalOnReadyStateChange) originalOnReadyStateChange.apply(this, arguments);
                    };
                }
                
                return originalSend.apply(this, [data]);
            };
        }
        
        // Method 2: Deep DOM Inspection with Multiple Strategies
        async deepDOMInspection(videoId) {
            const inspectionMethods = [
                () => this.inspectScriptTags(),
                () => this.inspectDataAttributes(),
                () => this.inspectShadowDOM(),
                () => this.inspectIframes(),
                () => this.inspectCanvasElements(),
                () => this.inspectVideoElements(),
                () => this.inspectMetaTags(),
                () => this.inspectLinkTags(),
                () => this.inspectComments(),
                () => this.inspectEventListeners()
            ];
            
            for (const method of inspectionMethods) {
                try {
                    await method();
                } catch (e) {
                    log('DOM inspection method failed:', e);
                }
            }
        }
        
        inspectScriptTags() {
            const scripts = document.querySelectorAll('script');
            scripts.forEach(script => {
                const content = script.textContent || script.innerHTML;
                
                // Look for player responses, configs, and data
                const patterns = [
                    /ytInitialPlayerResponse\s*[=:]\s*({.+?});?/g,
                    /ytcfg\.set\s*\(\s*({.+?})\s*\)/g,
                    /window\["ytInitialData"\]\s*=\s*({.+?});/g,
                    /"captions?":\s*({.+?})/g,
                    /"timedtext":\s*"([^"]+)"/g,
                    /baseUrl['"]\s*:\s*['"]([^'"]*timedtext[^'"]*)['"]/g
                ];
                
                patterns.forEach(pattern => {
                    const matches = content.match(pattern);
                    if (matches) {
                        matches.forEach(match => {
                            this.processScriptMatch(match, script.src || 'inline');
                        });
                    }
                });
            });
        }
        
        inspectShadowDOM() {
            // Recursively inspect shadow DOM
            const inspectShadow = (element) => {
                if (element.shadowRoot) {
                    log('Found shadow DOM, inspecting...');
                    const shadowScripts = element.shadowRoot.querySelectorAll('script');
                    shadowScripts.forEach(script => {
                        this.analyzeScriptContent(script.textContent);
                    });
                    
                    // Recurse into shadow children
                    element.shadowRoot.querySelectorAll('*').forEach(inspectShadow);
                }
                
                // Check for closed shadow roots (advanced technique)
                try {
                    const descriptor = Object.getOwnPropertyDescriptor(element, 'shadowRoot');
                    if (descriptor && descriptor.value) {
                        log('Found closed shadow root');
                        this.inspectClosedShadowRoot(element);
                    }
                } catch (e) {
                    // Silent fail
                }
            };
            
            document.querySelectorAll('*').forEach(inspectShadow);
        }
        
        // Method 3: Player Object Hijacking
        async playerObjectHijacking(videoId) {
            // Hijack YouTube player objects
            this.hijackYTPlayer();
            this.hijackHTML5Player();
            this.hijackVideoElement();
            this.hijackMediaSource();
            
            // Monitor global variables
            this.monitorGlobalVariables();
            this.interceptGlobalFunctions();
        }
        
        hijackYTPlayer() {
            // Hook into YouTube player instances
            const originalYTPlayer = window.YT?.Player;
            if (originalYTPlayer) {
                window.YT.Player = function(...args) {
                    const player = new originalYTPlayer(...args);
                    playerInstances.add(player);
                    
                    // Hook player methods
                    const originalGetVideoData = player.getVideoData;
                    player.getVideoData = function() {
                        const data = originalGetVideoData.call(this);
                        log('Player video data:', data);
                        return data;
                    };
                    
                    return player;
                };
            }
        }
        
        // Method 4: Iframe Injection for Bypass
        async iframeInjection(videoId) {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${location.origin}`;
            
            iframe.onload = () => {
                try {
                    // Try to access iframe content
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    this.extractFromIframeDocument(iframeDoc, videoId);
                } catch (e) {
                    log('Iframe access blocked, trying postMessage:', e.message);
                    this.setupIframePostMessage(iframe, videoId);
                }
            };
            
            document.body.appendChild(iframe);
            
            // Clean up after 30 seconds
            setTimeout(() => {
                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
            }, 30000);
        }
        
        // Method 5: Web Worker for Background Processing
        async webWorkerMethod(videoId) {
            if (window.Worker) {
                const workerCode = `
                    self.onmessage = function(e) {
                        const { videoId, method } = e.data;
                        
                        // Fetch subtitles in worker context
                        const urls = [
                            'https://www.youtube.com/api/timedtext?v=' + videoId + '&lang=en&fmt=vtt',
                            'https://video.google.com/timedtext?v=' + videoId + '&lang=en&fmt=vtt'
                        ];
                        
                        Promise.all(urls.map(url => 
                            fetch(url).then(r => r.ok ? r.text() : null)
                        )).then(results => {
                            results.forEach((content, index) => {
                                if (content) {
                                    self.postMessage({
                                        type: 'subtitle',
                                        content: content,
                                        url: urls[index],
                                        videoId: videoId
                                    });
                                }
                            });
                        }).catch(err => {
                            self.postMessage({
                                type: 'error',
                                error: err.message
                            });
                        });
                    };
                `;
                
                const blob = new Blob([workerCode], { type: 'application/javascript' });
                const worker = new Worker(URL.createObjectURL(blob));
                
                worker.onmessage = (e) => {
                    if (e.data.type === 'subtitle') {
                        this.processExtractedContent(e.data.content, e.data.url, 'worker');
                    }
                };
                
                worker.postMessage({ videoId, method: 'webWorker' });
                
                // Clean up worker
                setTimeout(() => worker.terminate(), 15000);
            }
        }
        
        // Method 6: Mutation Observer for Dynamic Content
        async mutationObserverMethod(videoId) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    // Check added nodes for subtitle data
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.scanElementForSubtitles(node);
                        }
                    });
                    
                    // Check attribute changes
                    if (mutation.type === 'attributes') {
                        this.checkAttributeForSubtitles(mutation.target, mutation.attributeName);
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeOldValue: true
            });
            
            // Observe for 60 seconds
            setTimeout(() => observer.disconnect(), 60000);
        }
        
        // Method 7: Performance API Monitoring
        async performanceAPIMethod(videoId) {
            if (window.PerformanceObserver) {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.name.includes('timedtext') || entry.name.includes('caption')) {
                            log('Performance API detected subtitle request:', entry.name);
                            this.fetchSubtitleFromUrl(entry.name);
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['resource', 'navigation', 'measure'] });
                
                setTimeout(() => observer.disconnect(), 30000);
            }
            
            // Also monitor existing performance entries
            const entries = performance.getEntriesByType('resource');
            entries.forEach(entry => {
                if (entry.name.includes('timedtext') || entry.name.includes('caption')) {
                    this.fetchSubtitleFromUrl(entry.name);
                }
            });
        }
        
        // Method 8: Service Worker Communication
        async serviceWorkerMethod(videoId) {
            if ('serviceWorker' in navigator) {
                try {
                    // Try to communicate with existing service workers
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    registrations.forEach(reg => {
                        if (reg.active) {
                            reg.active.postMessage({
                                type: 'extractSubtitles',
                                videoId: videoId
                            });
                        }
                    });
                } catch (e) {
                    log('Service Worker communication failed:', e);
                }
            }
        }
        
        // Method 9: Cookie-based Method
        async cookieBasedMethod(videoId) {
            // Analyze cookies for session data
            const cookies = document.cookie.split(';');
            cookies.forEach(cookie => {
                const [name, value] = cookie.trim().split('=');
                if (name && value && (name.includes('session') || name.includes('auth'))) {
                    this.useCookieForExtraction(name, value, videoId);
                }
            });
        }
        
        // Method 10: History API Monitoring
        async historyAPIMethod(videoId) {
            // Monitor history changes
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = function(...args) {
                log('History pushState:', args);
                setTimeout(() => getCurrentVideoId(), 1000);
                return originalPushState.apply(this, args);
            };
            
            history.replaceState = function(...args) {
                log('History replaceState:', args);
                setTimeout(() => getCurrentVideoId(), 1000);
                return originalReplaceState.apply(this, args);
            };
        }
        
        // Advanced processing method
        async processExtractedContent(content, url, source) {
            if (!content || typeof content !== 'string') return;
            
            // Advanced content validation
            if (this.isValidSubtitleContent(content)) {
                log(`✅ Valid subtitle content from ${source}:`, url.substring(0, 100) + '...');
                
                // Send to background with enhanced metadata
                chrome.runtime.sendMessage({
                    type: 'newYouTubeSubtitle',
                    content: content,
                    url: url,
                    videoId: currentVideoId,
                    pageTitle: document.title,
                    pageUrl: window.location.href,
                    source: source,
                    timestamp: Date.now(),
                    contentLength: content.length,
                    extractionMethod: 'advanced'
                }).catch(e => log('Error sending subtitle to background:', e));
                
                // Cache for deduplication
                interceptedData.set(url, {
                    content: content,
                    timestamp: Date.now(),
                    source: source
                });
            }
        }
        
        isValidSubtitleContent(content) {
            const trimmed = content.trim();
            if (trimmed.length < 10) return false;
            
            // Multiple validation patterns
            const validationPatterns = [
                /WEBVTT/i,
                /\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/,
                /<transcript>/i,
                /<text start=/i,
                /\[Script Info\]/i,
                /Dialogue:/i,
                /<timedtext>/i,
                /<p begin=/i
            ];
            
            // Content should match at least one pattern
            const hasValidPattern = validationPatterns.some(pattern => pattern.test(trimmed));
            
            // Additional heuristics
            const hasTimestamps = /\d{1,2}:\d{2}:\d{2}/.test(trimmed);
            const hasTextContent = trimmed.replace(/<[^>]*>/g, '').trim().length > 20;
            
            return hasValidPattern || (hasTimestamps && hasTextContent);
        }
        
        // Utility methods for complex operations
        async fetchSubtitleFromUrl(url) {
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
                    await this.processExtractedContent(content, url, 'direct-fetch');
                }
            } catch (e) {
                log('Direct fetch failed:', url, e.message);
            }
        }
        
        scanElementForSubtitles(element) {
            // Scan element and children for subtitle data
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_ALL,
                null,
                false
            );
            
            let node;
            while (node = walker.nextNode()) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    if (this.isValidSubtitleContent(text)) {
                        this.processExtractedContent(text, 'dom-text-node', 'dom-scan');
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check various attributes
                    ['data-caption', 'data-subtitle', 'data-text', 'data-content'].forEach(attr => {
                        const value = node.getAttribute(attr);
                        if (value && this.isValidSubtitleContent(value)) {
                            this.processExtractedContent(value, `dom-attribute-${attr}`, 'dom-scan');
                        }
                    });
                }
            }
        }
    }
    
    // Initialize the advanced extractor
    const advancedExtractor = new AdvancedYouTubeExtractor();
    
    // Enhanced video ID detection with multiple methods
    function getCurrentVideoId() {
        const methods = [
            () => new URLSearchParams(window.location.search).get('v'),
            () => window.location.pathname.match(/\/watch\/([^\/\?]+)/)?.[1],
            () => document.querySelector('[data-video-id]')?.getAttribute('data-video-id'),
            () => document.querySelector('meta[property="og:url"]')?.content?.match(/v=([^&]+)/)?.[1],
            () => window.ytInitialData?.contents?.videoDetails?.videoId,
            () => window.ytInitialPlayerResponse?.videoDetails?.videoId
        ];
        
        for (const method of methods) {
            try {
                const videoId = method();
                if (videoId && videoId !== currentVideoId) {
                    currentVideoId = videoId;
                    log('🎯 Video ID detected:', videoId);
                    
                    // Start advanced extraction
                    setTimeout(() => {
                        advancedExtractor.executeAllMethods(videoId);
                    }, 2000);
                    
                    return videoId;
                }
            } catch (e) {
                // Silent fail, try next method
            }
        }
        
        return currentVideoId;
    }
    
    // Enhanced navigation monitoring
    function setupAdvancedMonitoring() {
        // Multiple monitoring strategies
        let lastUrl = location.href;
        let lastTitle = document.title;
        
        // MutationObserver for title changes
        const titleObserver = new MutationObserver(() => {
            if (document.title !== lastTitle) {
                lastTitle = document.title;
                setTimeout(() => getCurrentVideoId(), 1000);
            }
        });
        
        const titleElement = document.querySelector('title');
        if (titleElement) {
            titleObserver.observe(titleElement, { childList: true });
        }
        
        // URL change detection
        const urlObserver = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                log('🔄 URL changed:', lastUrl);
                setTimeout(() => getCurrentVideoId(), 1000);
            }
        });
        
        urlObserver.observe(document.body, { childList: true, subtree: true });
        
        // Intersection Observer for video elements
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    const src = video.src || video.currentSrc;
                    if (src && src.includes('youtube')) {
                        log('📹 Video element detected:', src);
                        setTimeout(() => getCurrentVideoId(), 500);
                    }
                }
            });
        });
        
        // Observe all video elements
        document.querySelectorAll('video').forEach(video => {
            videoObserver.observe(video);
        });
        
        // Listen for new video elements
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
    
    // Global error handler to catch any missed exceptions
    window.addEventListener('error', (event) => {
        if (event.filename && event.filename.includes('youtube')) {
            log('🔍 YouTube error intercepted:', event.message);
        }
    });
    
    // Listen for messages from background/popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        log('📨 Message received:', message);
        
        switch (message.type) {
            case 'extractCurrentVideo':
                const videoId = getCurrentVideoId();
                if (videoId) {
                    advancedExtractor.executeAllMethods(videoId);
                    sendResponse({ success: true, videoId });
                } else {
                    sendResponse({ success: false, error: 'No video detected' });
                }
                break;
                
            case 'forceExtraction':
                if (message.videoId) {
                    advancedExtractor.executeAllMethods(message.videoId);
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: 'No video ID provided' });
                }
                break;
                
            case 'getExtractorStatus':
                sendResponse({
                    currentVideoId,
                    activeExtractions: Array.from(advancedExtractor.activeExtractions),
                    playerInstances: playerInstances.size,
                    networkRequests: networkRequests.size,
                    interceptedData: interceptedData.size
                });
                break;
        }
        
        return true;
    });
    
    // Initialize everything
    function initialize() {
        log('🚀 Advanced YouTube Subtitle Extractor initialized');
        
        // Setup all monitoring
        setupAdvancedMonitoring();
        
        // Initial video detection
        getCurrentVideoId();
        
        // Start network interception
        advancedExtractor.interceptNetworkRequests();
        
        log('🔧 All advanced systems active');
    }
    
    // Wait for page ready and initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Cleanup function
    window.addEventListener('beforeunload', () => {
        log('🧹 Cleaning up advanced extractor');
        advancedExtractor.activeExtractions.clear();
        networkRequests.clear();
        interceptedData.clear();
    });
    
})();