const listContainer = document.getElementById('subtitlesList');
const refreshBtn = document.getElementById('refreshBtn');
const clearBtn = document.getElementById('clearBtn');
const emptyState = document.getElementById('emptyState');
const subtitleCount = document.getElementById('subtitleCount');
const lastUpdate = document.getElementById('lastUpdate');

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

// Auto-refresh every 30 seconds to catch new subtitles
setInterval(refreshList, 30000);