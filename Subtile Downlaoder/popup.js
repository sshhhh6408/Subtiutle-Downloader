const listContainer = document.getElementById('subtitlesList');
const refreshBtn = document.getElementById('refreshBtn');
const clearBtn = document.getElementById('clearBtn');
const emptyState = document.getElementById('emptyState');
const subtitleCount = document.getElementById('subtitleCount');
const lastUpdate = document.getElementById('lastUpdate');

// YouTube extraction elements
const extractCurrentBtn = document.getElementById('extractCurrentBtn');
const extractUrlBtn = document.getElementById('extractUrlBtn');
const youtubeUrlInput = document.getElementById('youtubeUrlInput');
const extractionStatus = document.getElementById('extractionStatus');

// Universal extraction elements
const extractUniversalBtn = document.getElementById('extractUniversalBtn');
const platformInfo = document.getElementById('platformInfo');
const universalStatus = document.getElementById('universalStatus');

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

function renderList(subtitles) {
  listContainer.innerHTML = '';
  
  if (!subtitles || subtitles.length === 0) {
    emptyState.style.display = 'block';
    subtitleCount.textContent = '0 subtitles';
    lastUpdate.textContent = 'Just now';
    return;
  }
  
  emptyState.style.display = 'none';
  subtitleCount.textContent = `${subtitles.length} subtitle${subtitles.length !== 1 ? 's' : ''}`;
  lastUpdate.textContent = formatTime(Math.max(...subtitles.map(s => s.timestamp || 0)));
  
  // Sort by timestamp (newest first)
  const sortedSubs = subtitles.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  
  sortedSubs.forEach((file, index) => {
    const li = document.createElement('li');
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'subtitle-name';
    nameDiv.textContent = file.name;
    if (file.source) {
      nameDiv.setAttribute('data-source', file.source);
    }
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'subtitle-info';
    
    let infoText = '';
    if (file.size) {
      infoText += formatFileSize(file.size);
    }
    if (file.timestamp) {
      if (infoText) infoText += ' • ';
      infoText += formatTime(file.timestamp);
    }
    infoDiv.textContent = infoText;
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'subtitle-actions';
    
    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn btn-success';
    dlBtn.innerHTML = '⬇️ Download';
    dlBtn.title = 'Download this subtitle file';
    
    dlBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      dlBtn.disabled = true;
      dlBtn.innerHTML = '⏳ Downloading...';
      
      try {
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { type: 'downloadSubtitle', file },
            resolve
          );
        });
        
        if (response?.success) {
          dlBtn.innerHTML = '✅ Downloaded';
          setTimeout(() => {
            dlBtn.innerHTML = '⬇️ Download';
            dlBtn.disabled = false;
          }, 2000);
        } else {
          throw new Error(response?.error || 'Download failed');
        }
      } catch (error) {
        console.error('Download error:', error);
        dlBtn.innerHTML = '❌ Failed';
        dlBtn.className = 'btn btn-danger';
        setTimeout(() => {
          dlBtn.innerHTML = '⬇️ Download';
          dlBtn.className = 'btn btn-success';
          dlBtn.disabled = false;
        }, 3000);
      }
    });
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-secondary';
    copyBtn.innerHTML = '📋 Copy';
    copyBtn.title = 'Copy subtitle content to clipboard';
    
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const content = atob(file.data);
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(content);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = content;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        
        copyBtn.innerHTML = '✅ Copied';
        setTimeout(() => {
          copyBtn.innerHTML = '📋 Copy';
        }, 2000);
      } catch (error) {
        console.error('Copy error:', error);
        copyBtn.innerHTML = '❌ Failed';
        setTimeout(() => {
          copyBtn.innerHTML = '📋 Copy';
        }, 2000);
      }
    });
    
    actionsDiv.appendChild(dlBtn);
    actionsDiv.appendChild(copyBtn);
    
    li.appendChild(nameDiv);
    if (infoText) li.appendChild(infoDiv);
    li.appendChild(actionsDiv);
    
    listContainer.appendChild(li);
  });
}

async function refreshList() {
  try {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '🔄 Refreshing...';
    
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'getSubtitles' }, resolve);
    });
    
    if (response?.subtitles) {
      renderList(response.subtitles);
    } else {
      throw new Error(response?.error || 'Failed to get subtitles');
    }
  } catch (error) {
    console.error('Refresh error:', error);
    emptyState.innerHTML = `
      <div class="empty-icon">⚠️</div>
      <h3>Failed to load subtitles</h3>
      <p>${error.message}</p>
    `;
    emptyState.style.display = 'block';
  } finally {
    refreshBtn.innerHTML = '🔄 Refresh';
    refreshBtn.disabled = false;
  }
}

// Listen for new subtitle notifications
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'newSubtitle') {
    console.log('New subtitle detected:', message.name);
    refreshList();
    
    // Show visual feedback for new subtitle
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: linear-gradient(45deg, #06d6a0, #118ab2);
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = `🆕 ${message.name}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
});

// Event listeners
refreshBtn.addEventListener('click', refreshList);

clearBtn.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to clear all captured subtitles?')) {
    return;
  }
  
  try {
    clearBtn.disabled = true;
    clearBtn.innerHTML = '🗑️ Clearing...';
    
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'clearSubtitles' }, resolve);
    });
    
    if (response?.success) {
      await refreshList();
    } else {
      throw new Error(response?.error || 'Failed to clear subtitles');
    }
  } catch (error) {
    console.error('Clear error:', error);
    alert('Failed to clear subtitles: ' + error.message);
  } finally {
    clearBtn.innerHTML = '🗑️ Clear All';
    clearBtn.disabled = false;
  }
});

// Initialize
refreshList();

// YouTube extraction functionality
function showExtractionStatus(message, type = 'loading') {
  extractionStatus.style.display = 'block';
  extractionStatus.className = `extraction-status ${type}`;
  extractionStatus.textContent = message;
  
  if (type !== 'loading') {
    setTimeout(() => {
      extractionStatus.style.display = 'none';
    }, 5000);
  }
}

function extractVideoIdFromUrl(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

async function extractFromCurrentTab() {
  try {
    extractCurrentBtn.disabled = true;
    extractCurrentBtn.innerHTML = '⏳ Extracting...';
    showExtractionStatus('🔍 Detecting YouTube video in current tab...', 'loading');
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('youtube.com')) {
      throw new Error('Current tab is not a YouTube video page');
    }
    
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'extractCurrentTab' }, resolve);
    });
    
    if (response?.success) {
      showExtractionStatus(`✅ Successfully started extraction for video: ${response.videoId}`, 'success');
      setTimeout(() => refreshList(), 2000);
    } else {
      throw new Error(response?.error || 'Failed to extract from current tab');
    }
  } catch (error) {
    console.error('Current tab extraction error:', error);
    showExtractionStatus(`❌ ${error.message}`, 'error');
  } finally {
    extractCurrentBtn.innerHTML = '🎯 Extract Current Video';
    extractCurrentBtn.disabled = false;
  }
}

async function extractFromUrl() {
  try {
    const url = youtubeUrlInput.value.trim();
    if (!url) {
      throw new Error('Please enter a YouTube URL or video ID');
    }
    
    const videoId = extractVideoIdFromUrl(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL or video ID');
    }
    
    extractUrlBtn.disabled = true;
    extractUrlBtn.innerHTML = '⏳ Extracting...';
    showExtractionStatus(`🔍 Starting advanced extraction for video: ${videoId}...`, 'loading');
    
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ 
        type: 'extractYouTubeVideo', 
        videoId: videoId,
        tabInfo: { title: `YouTube Video ${videoId}`, url: `https://www.youtube.com/watch?v=${videoId}` }
      }, resolve);
    });
    
    if (response?.success) {
      showExtractionStatus(`✅ Advanced extraction initiated for ${videoId}. Check back in a few moments.`, 'success');
      youtubeUrlInput.value = '';
      setTimeout(() => refreshList(), 3000);
    } else {
      throw new Error(response?.error || 'Failed to extract subtitles');
    }
  } catch (error) {
    console.error('URL extraction error:', error);
    showExtractionStatus(`❌ ${error.message}`, 'error');
  } finally {
    extractUrlBtn.innerHTML = '🔗 Extract';
    extractUrlBtn.disabled = false;
  }
}

// Enhanced message listener for YouTube extraction updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'newSubtitle') {
    console.log('New subtitle detected:', message.name);
    refreshList();
    
    // Show enhanced notification for YouTube subtitles
    const isYouTube = message.source === 'YouTube';
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: ${isYouTube ? 'linear-gradient(45deg, #ff0000, #cc0000)' : 'linear-gradient(45deg, #06d6a0, #118ab2)'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      z-index: 1000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>${isYouTube ? '🎬' : '🆕'}</span>
        <div>
          <div style="font-weight: 700;">${isYouTube ? 'YouTube Subtitle' : 'New Subtitle'}</div>
          <div style="font-size: 11px; opacity: 0.9;">${message.name}</div>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, isYouTube ? 5000 : 3000);
  }
});

// Universal extraction functionality
function showUniversalStatus(message, type = 'loading') {
  universalStatus.style.display = 'block';
  universalStatus.className = `extraction-status ${type}`;
  universalStatus.textContent = message;
  
  if (type !== 'loading') {
    setTimeout(() => {
      universalStatus.style.display = 'none';
    }, 5000);
  }
}

async function detectCurrentPlatform() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url) {
      platformInfo.innerHTML = '<span class="platform-name">No active tab</span>';
      return;
    }
    
    const hostname = new URL(tab.url).hostname.toLowerCase();
    
    // Platform detection
    const platforms = {
      'netflix.com': { name: 'Netflix', icon: '🎬', color: '#e50914' },
      'hulu.com': { name: 'Hulu', icon: '📺', color: '#1ce783' },
      'disneyplus.com': { name: 'Disney+', icon: '🏰', color: '#113ccf' },
      'primevideo.com': { name: 'Prime Video', icon: '📦', color: '#00a8e1' },
      'amazon.com': { name: 'Prime Video', icon: '📦', color: '#00a8e1' },
      'twitch.tv': { name: 'Twitch', icon: '🟣', color: '#9146ff' },
      'vimeo.com': { name: 'Vimeo', icon: '🎭', color: '#1ab7ea' },
      'dailymotion.com': { name: 'Dailymotion', icon: '🌊', color: '#00adef' },
      'crunchyroll.com': { name: 'Crunchyroll', icon: '🍥', color: '#f47521' },
      'youtube.com': { name: 'YouTube', icon: '🎬', color: '#ff0000' }
    };
    
    let detectedPlatform = null;
    for (const [domain, info] of Object.entries(platforms)) {
      if (hostname.includes(domain)) {
        detectedPlatform = info;
        break;
      }
    }
    
    if (detectedPlatform) {
      platformInfo.innerHTML = `<span class="platform-name" style="color: ${detectedPlatform.color};">${detectedPlatform.icon} ${detectedPlatform.name} Detected!</span>`;
      platformInfo.classList.add('platform-detected');
    } else {
      platformInfo.innerHTML = '<span class="platform-name">🌐 Generic Video Site</span>';
      platformInfo.classList.remove('platform-detected');
    }
  } catch (error) {
    platformInfo.innerHTML = '<span class="platform-name">❌ Detection failed</span>';
  }
}

async function extractUniversal() {
  try {
    extractUniversalBtn.disabled = true;
    extractUniversalBtn.innerHTML = '⏳ Extracting...';
    showUniversalStatus('🔍 Starting UNIVERSAL extraction with 25+ advanced methods...', 'loading');
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url) {
      throw new Error('No active tab found');
    }
    
    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'extractUniversal' });
    
    if (response?.success) {
      const platform = response.platform || 'Generic';
      showUniversalStatus(`✅ Universal extraction initiated for ${platform}! Using ALL 25 methods simultaneously.`, 'success');
      setTimeout(() => refreshList(), 3000);
    } else {
      throw new Error('Failed to start universal extraction');
    }
  } catch (error) {
    console.error('Universal extraction error:', error);
    showUniversalStatus(`❌ ${error.message}`, 'error');
  } finally {
    extractUniversalBtn.innerHTML = '🔥 Extract from ANY Site';
    extractUniversalBtn.disabled = false;
  }
}

// YouTube extraction event listeners
extractCurrentBtn.addEventListener('click', extractFromCurrentTab);
extractUrlBtn.addEventListener('click', extractFromUrl);
extractUniversalBtn.addEventListener('click', extractUniversal);

// Enter key support for URL input
youtubeUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    extractFromUrl();
  }
});

// Initialize platform detection
detectCurrentPlatform();

// Update platform detection when tab changes
chrome.tabs.onActivated.addListener(() => {
  setTimeout(detectCurrentPlatform, 500);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    setTimeout(detectCurrentPlatform, 500);
  }
});

// Auto-refresh every 30 seconds to catch new subtitles
setInterval(refreshList, 30000);