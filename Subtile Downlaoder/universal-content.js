// Universal Subtitle Catcher Pro - Multi-Platform Subtitle Extraction
// Supports: YouTube, Netflix, Hulu, Disney+, Amazon Prime, Twitch, Vimeo, Dailymotion, and more

(function() {
    'use strict';
    
    const log = (...args) => console.log('[UniversalSubtitleCatcher]', ...args);
    
    // Platform detection
    function detectPlatform() {
        const hostname = window.location.hostname.toLowerCase();
        const url = window.location.href;
        
        const platforms = {
            youtube: {
                name: 'YouTube',
                domains: ['youtube.com', 'youtu.be', 'm.youtube.com'],
                patterns: [
                    /youtube\.com\/watch\?v=([^&\n?#]+)/,
                    /youtu\.be\/([^&\n?#]+)/,
                    /youtube\.com\/embed\/([^&\n?#]+)/
                ]
            },
            netflix: {
                name: 'Netflix',
                domains: ['netflix.com', 'www.netflix.com'],
                patterns: [/netflix\.com\/watch\/(\d+)/]
            },
            hulu: {
                name: 'Hulu',
                domains: ['hulu.com', 'www.hulu.com'],
                patterns: [/hulu\.com\/watch\/([^&\n?#]+)/]
            },
            disneyplus: {
                name: 'Disney+',
                domains: ['disneyplus.com', 'www.disneyplus.com'],
                patterns: [/disneyplus\.com\/video\/([^&\n?#]+)/]
            },
            amazonprime: {
                name: 'Amazon Prime',
                domains: ['amazon.com', 'primevideo.com'],
                patterns: [
                    /amazon\.com\/.*\/dp\/([A-Z0-9]+)/,
                    /primevideo\.com\/detail\/([^&\n?#]+)/
                ]
            },
            twitch: {
                name: 'Twitch',
                domains: ['twitch.tv', 'www.twitch.tv'],
                patterns: [/twitch\.tv\/videos\/(\d+)/]
            },
            vimeo: {
                name: 'Vimeo',
                domains: ['vimeo.com', 'www.vimeo.com'],
                patterns: [/vimeo\.com\/(\d+)/]
            },
            dailymotion: {
                name: 'Dailymotion',
                domains: ['dailymotion.com', 'www.dailymotion.com'],
                patterns: [/dailymotion\.com\/video\/([^&\n?#]+)/]
            }
        };
        
        for (const [key, platform] of Object.entries(platforms)) {
            if (platform.domains.some(domain => hostname.includes(domain))) {
                for (const pattern of platform.patterns) {
                    const match = url.match(pattern);
                    if (match) {
                        return {
                            key,
                            name: platform.name,
                            id: match[1],
                            url: url
                        };
                    }
                }
            }
        }
        
        return null;
    }
    
    // Network interception for subtitle detection
    function setupNetworkInterception() {
        if (!window._fetchIntercepted) {
            window._fetchIntercepted = true;
            const originalFetch = window.fetch;
            
            window.fetch = async function(input, init = {}) {
                const url = typeof input === 'string' ? input : input.url;
                
                // Check for subtitle-related requests
                if (isSubtitleRequest(url)) {
                    log(`🔍 Intercepted subtitle request: ${url}`);
                    
                    try {
                        const response = await originalFetch(input, init);
                        if (response.ok) {
                            const cloned = response.clone();
                            const content = await cloned.text();
                            
                            if (content && isValidSubtitleContent(content)) {
                                await processSubtitleContent(content, url);
                            }
                        }
                    } catch (error) {
                        log('Error intercepting subtitle request:', error);
                    }
                }
                
                return originalFetch(input, init);
            };
        }
    }
    
    function isSubtitleRequest(url) {
        const subtitleKeywords = [
            'subtitle', 'caption', 'transcript', 'timedtext', 'vtt', 'srt', 'srv1', 'srv2', 'srv3', 'ttml',
            'webvtt', 'sub', 'ass', 'ssa', 'stl', 'smi', 'sami', 'rt', 'txt', 'xml', 'json'
        ];
        
        return subtitleKeywords.some(keyword => 
            url.toLowerCase().includes(keyword)
        );
    }
    
    function isValidSubtitleContent(content) {
        if (!content || typeof content !== 'string') return false;
        
        const subtitlePatterns = [
            /^\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/m, // SRT format
            /^WEBVTT/m, // VTT format
            /<transcript>/i, // XML transcript
            /<timedtext/i, // YouTube timedtext
            /"start":\s*\d+\.?\d*/m, // JSON format
            /<p\s+begin=/i, // TTML format
            /<subtitle/i, // Generic subtitle XML
            /^\d+\s*\n\d{2}:\d{2}:\d{2}[,.]\d{3}/m // Alternative SRT
        ];
        
        return subtitlePatterns.some(pattern => pattern.test(content));
    }
    
    async function processSubtitleContent(content, url) {
        const platform = currentPlatform?.name || 'Unknown';
        const videoId = currentPlatform?.id || 'unknown';
        
        log(`Processing subtitle content from ${platform}:`, {
            url,
            contentLength: content.length,
            videoId
        });
        
        // Send to background script for processing
        chrome.runtime.sendMessage({
            type: 'newSubtitle',
            data: {
                content,
                url,
                platform,
                videoId,
                timestamp: Date.now()
            }
        });
    }
    
    // DOM observation for subtitle elements
    function setupDOMObservation() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        scanForSubtitleElements(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    function scanForSubtitleElements(element) {
        const subtitleSelectors = [
            '[data-subtitle]',
            '[data-caption]',
            '[data-transcript]',
            '.subtitle',
            '.caption',
            '.transcript',
            '[class*="subtitle"]',
            '[class*="caption"]',
            '[class*="transcript"]',
            'track[src]',
            'video track',
            'audio track'
        ];
        
        subtitleSelectors.forEach(selector => {
            const elements = element.querySelectorAll ? element.querySelectorAll(selector) : [];
            elements.forEach(el => {
                extractFromElement(el);
            });
        });
    }
    
    function extractFromElement(element) {
        const data = {
            text: element.textContent || element.innerText,
            src: element.src || element.getAttribute('src'),
            data: element.dataset,
            attributes: {}
        };
        
        for (let attr of element.attributes) {
            data.attributes[attr.name] = attr.value;
        }
        
        if (data.text || data.src) {
            log('Found subtitle element:', data);
            processSubtitleContent(data.text || data.src, window.location.href);
        }
    }
    
    // YouTube specific extraction (enhanced)
    async function extractYouTubeSubtitles(videoId) {
        log('Extracting YouTube subtitles for:', videoId);
        
        const languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'th', 'vi', 'tr'];
        const formats = ['vtt', 'srv3', 'ttml', 'srv1', 'srv2'];
        
        for (const lang of languages) {
            for (const fmt of formats) {
                const urls = [
                    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=${fmt}`,
                    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=${fmt}&tlang=${lang}`,
                    `https://video.google.com/timedtext?v=${videoId}&lang=${lang}&fmt=${fmt}`
                ];
                
                for (const url of urls) {
                    try {
                        const response = await fetch(url, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                'Referer': `https://www.youtube.com/watch?v=${videoId}`
                            }
                        });
                        
                        if (response.ok) {
                            const content = await response.text();
                            if (content && isValidSubtitleContent(content)) {
                                await processSubtitleContent(content, url);
                            }
                        }
                    } catch (error) {
                        // Silent fail for each attempt
                    }
                }
            }
        }
        
        // Try auto-generated captions
        const autoUrls = [
            `https://www.youtube.com/api/timedtext?v=${videoId}&kind=asr&lang=en&fmt=vtt`,
            `https://www.youtube.com/api/timedtext?v=${videoId}&kind=asr&lang=en&fmt=srv3`,
            `https://youtubei.googleapis.com/youtubei/v1/player/timedtext?v=${videoId}&kind=asr&fmt=json3`
        ];
        
        for (const url of autoUrls) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'X-YouTube-Client-Name': '1',
                        'X-YouTube-Client-Version': '2.20231201.01.00'
                    }
                });
                
                if (response.ok) {
                    const content = await response.text();
                    if (content && isValidSubtitleContent(content)) {
                        await processSubtitleContent(content, url);
                    }
                }
            } catch (error) {
                // Silent fail
            }
        }
    }
    
    // Generic platform extraction
    async function extractGenericPlatformSubtitles(videoId, platform) {
        log(`Extracting ${platform} subtitles for:`, videoId);
        
        // Try common API endpoints
        const apiEndpoints = [
            `/api/videos/${videoId}/captions`,
            `/api/videos/${videoId}/subtitles`,
            `/api/content/${videoId}/captions`,
            `/api/${videoId}/captions`,
            `/api/captions/${videoId}`
        ];
        
        for (const endpoint of apiEndpoints) {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    const data = await response.json();
                    if (data.captions || data.subtitles) {
                        await processSubtitleContent(JSON.stringify(data), response.url);
                    }
                }
            } catch (error) {
                // Silent fail
            }
        }
        
        // Scan DOM for subtitle elements
        const subtitleSelectors = [
            '[data-testid="subtitle"]',
            '[data-testid="caption"]',
            '.subtitle',
            '.caption',
            '[class*="subtitle"]',
            '[class*="caption"]',
            '[class*="transcript"]',
            'track[src]',
            'video track',
            'audio track'
        ];
        
        subtitleSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const text = element.textContent || element.innerText;
                const src = element.src || element.getAttribute('src');
                
                if (text || src) {
                    processSubtitleContent(text || src, window.location.href);
                }
            });
        });
    }
    
    // Main initialization
    let currentPlatform = detectPlatform();
    
    if (currentPlatform) {
        log(`Detected platform: ${currentPlatform.name} with ID: ${currentPlatform.id}`);
        
        setupNetworkInterception();
        setupDOMObservation();
        
        // Start extraction based on platform
        if (currentPlatform.key === 'youtube') {
            extractYouTubeSubtitles(currentPlatform.id);
        } else {
            extractGenericPlatformSubtitles(currentPlatform.id, currentPlatform.key);
        }
    } else {
        log('No supported platform detected');
    }
    
    // Message listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'extractSubtitles') {
            if (currentPlatform) {
                if (currentPlatform.key === 'youtube') {
                    extractYouTubeSubtitles(currentPlatform.id);
                } else {
                    extractGenericPlatformSubtitles(currentPlatform.id, currentPlatform.key);
                }
            }
            sendResponse({ success: true });
        }
    });
    
    log('🚀 Universal Subtitle Catcher Pro initialized successfully');
    
})();