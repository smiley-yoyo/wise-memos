// ============================================================
// Wise Memos - Chrome Extension
// ============================================================

// Storage Keys
const STORAGE_KEYS = {
  MEMOS_URL: 'memosUrl',
  MEMOS_API_KEY: 'memosApiKey',
  AI_BASE_URL: 'aiBaseUrl',
  AI_MODEL: 'aiModel',
  AI_API_KEY: 'aiApiKey'
};

// ============================================================
// Utility Functions
// ============================================================

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// Load settings from storage
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(Object.values(STORAGE_KEYS), (result) => {
      resolve(result);
    });
  });
}

// Save settings to storage
async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => {
      resolve();
    });
  });
}

// Format date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`;
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)} 天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

// Visibility label
function getVisibilityLabel(visibility) {
  const labels = {
    'PRIVATE': '🔒 私有',
    'PROTECTED': '🔐 仅登录用户',
    'PUBLIC': '🌐 公开'
  };
  return labels[visibility] || visibility;
}

// ============================================================
// Memos API
// ============================================================

async function createMemo(content, visibility = 'PRIVATE') {
  const settings = await loadSettings();
  
  if (!settings.memosUrl || !settings.memosApiKey) {
    throw new Error('请先配置 Memos 实例地址和 API Key');
  }
  
  const url = `${settings.memosUrl.replace(/\/$/, '')}/api/v1/memos`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.memosApiKey}`
    },
    body: JSON.stringify({
      content,
      visibility
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`发送失败: ${response.status} - ${error}`);
  }
  
  return await response.json();
}

async function listMemos(pageSize = 10) {
  const settings = await loadSettings();
  
  if (!settings.memosUrl || !settings.memosApiKey) {
    throw new Error('请先配置 Memos 实例地址和 API Key');
  }
  
  const url = `${settings.memosUrl.replace(/\/$/, '')}/api/v1/memos?pageSize=${pageSize}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${settings.memosApiKey}`
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`获取失败: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.memos || [];
}

// ============================================================
// AI API (OpenAI Compatible)
// ============================================================

async function askAI(prompt, systemPrompt = '') {
  const settings = await loadSettings();
  
  if (!settings.aiBaseUrl || !settings.aiApiKey || !settings.aiModel) {
    throw new Error('请先配置 AI 模型设置');
  }
  
  const url = `${settings.aiBaseUrl.replace(/\/$/, '')}/chat/completions`;
  
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.aiApiKey}`
    },
    body: JSON.stringify({
      model: settings.aiModel,
      messages,
      max_tokens: 2000,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI 请求失败: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// Get current page content
async function getCurrentPageContent() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs[0]) {
        reject(new Error('无法获取当前标签页'));
        return;
      }
      
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            // Get page title
            const title = document.title;
            
            // Get main content
            const article = document.querySelector('article');
            const main = document.querySelector('main');
            const body = document.body;
            
            const contentElement = article || main || body;
            
            // Remove script and style content
            const clone = contentElement.cloneNode(true);
            clone.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove());
            
            const text = clone.innerText
              .replace(/\s+/g, ' ')
              .trim()
              .substring(0, 10000); // Limit content length
            
            return {
              title,
              url: window.location.href,
              content: text
            };
          }
        });
        
        resolve(results[0].result);
      } catch (error) {
        reject(new Error('无法获取页面内容，请确保页面已加载完成'));
      }
    });
  });
}

// ============================================================
// Markdown Toolbar Functions
// ============================================================

const markdownActions = {
  bold: { prefix: '**', suffix: '**', placeholder: '粗体文本' },
  italic: { prefix: '*', suffix: '*', placeholder: '斜体文本' },
  strikethrough: { prefix: '~~', suffix: '~~', placeholder: '删除线文本' },
  h1: { prefix: '# ', suffix: '', placeholder: '一级标题', lineStart: true },
  h2: { prefix: '## ', suffix: '', placeholder: '二级标题', lineStart: true },
  h3: { prefix: '### ', suffix: '', placeholder: '三级标题', lineStart: true },
  ul: { prefix: '- ', suffix: '', placeholder: '列表项', lineStart: true },
  ol: { prefix: '1. ', suffix: '', placeholder: '列表项', lineStart: true },
  task: { prefix: '- [ ] ', suffix: '', placeholder: '任务项', lineStart: true },
  code: { prefix: '`', suffix: '`', placeholder: '代码' },
  codeblock: { prefix: '```\n', suffix: '\n```', placeholder: '代码块', multiline: true },
  quote: { prefix: '> ', suffix: '', placeholder: '引用内容', lineStart: true },
  link: { prefix: '[', suffix: '](url)', placeholder: '链接文本' },
  image: { prefix: '![', suffix: '](url)', placeholder: '图片描述' },
  hr: { prefix: '\n---\n', suffix: '', placeholder: '' }
};

function applyMarkdown(textarea, action) {
  const config = markdownActions[action];
  if (!config) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end);
  
  let newText, newCursorStart, newCursorEnd;
  
  if (config.lineStart) {
    // Insert at line start
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const before = text.substring(0, lineStart);
    const after = text.substring(lineStart);
    
    if (selectedText) {
      newText = before + config.prefix + selectedText + config.suffix + after.substring(end - lineStart);
      newCursorStart = lineStart + config.prefix.length;
      newCursorEnd = newCursorStart + selectedText.length;
    } else {
      newText = before + config.prefix + config.placeholder + config.suffix + after;
      newCursorStart = lineStart + config.prefix.length;
      newCursorEnd = newCursorStart + config.placeholder.length;
    }
  } else {
    // Insert at cursor
    const insertText = selectedText || config.placeholder;
    newText = text.substring(0, start) + config.prefix + insertText + config.suffix + text.substring(end);
    newCursorStart = start + config.prefix.length;
    newCursorEnd = newCursorStart + insertText.length;
  }
  
  textarea.value = newText;
  textarea.focus();
  textarea.setSelectionRange(newCursorStart, newCursorEnd);
  
  // Trigger input event for char count
  textarea.dispatchEvent(new Event('input'));
}

// ============================================================
// UI Functions
// ============================================================

// Switch tabs
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-icon').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}Tab`);
  });
  
  // Load history when switching to history tab
  if (tabName === 'history') {
    loadHistory();
  }
}

// Load and display history
async function loadHistory() {
  const historyList = document.getElementById('historyList');
  
  // Show loading
  historyList.innerHTML = `
    <div class="loading-placeholder">
      <span class="spinner"></span>
      <span>加载中...</span>
    </div>
  `;
  
  try {
    const memos = await listMemos(10);
    
    if (memos.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <p>暂无备忘记录</p>
        </div>
      `;
      return;
    }
    
    historyList.innerHTML = memos.map(memo => {
      const memoId = memo.name ? memo.name.replace('memos/', '') : memo.uid;
      return `
      <div class="memo-card">
        <div class="memo-content">${escapeHtml(memo.content)}</div>
        <div class="memo-meta">
          <span class="memo-time">${formatDate(memo.createTime)}</span>
          <div class="memo-actions">
            <span class="memo-visibility">${getVisibilityLabel(memo.visibility)}</span>
            <a href="#" class="memo-link" data-memo-id="${memoId}" title="打开笔记">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>
      </div>
    `}).join('');
    
    // Add click handlers for memo links
    historyList.querySelectorAll('.memo-link').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const memoId = link.dataset.memoId;
        const settings = await loadSettings();
        const baseUrl = settings.memosUrl.replace(/\/$/, '');
        chrome.tabs.create({ url: `${baseUrl}/memos/${memoId}` });
      });
    });
  } catch (error) {
    historyList.innerHTML = `
      <div class="config-warning">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>${escapeHtml(error.message)}</p>
        <button class="btn btn-primary" onclick="document.getElementById('settingsBtn').click()">前往设置</button>
      </div>
    `;
  }
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================
// Settings Modal
// ============================================================

function openSettings() {
  document.getElementById('settingsModal').classList.add('show');
  loadSettingsToForm();
}

function closeSettings() {
  document.getElementById('settingsModal').classList.remove('show');
}

async function loadSettingsToForm() {
  const settings = await loadSettings();
  
  document.getElementById('memosUrl').value = settings.memosUrl || '';
  document.getElementById('memosApiKey').value = settings.memosApiKey || '';
  document.getElementById('aiBaseUrl').value = settings.aiBaseUrl || '';
  document.getElementById('aiModel').value = settings.aiModel || '';
  document.getElementById('aiApiKey').value = settings.aiApiKey || '';
}

async function saveSettingsFromForm() {
  const settings = {
    [STORAGE_KEYS.MEMOS_URL]: document.getElementById('memosUrl').value.trim(),
    [STORAGE_KEYS.MEMOS_API_KEY]: document.getElementById('memosApiKey').value.trim(),
    [STORAGE_KEYS.AI_BASE_URL]: document.getElementById('aiBaseUrl').value.trim(),
    [STORAGE_KEYS.AI_MODEL]: document.getElementById('aiModel').value.trim(),
    [STORAGE_KEYS.AI_API_KEY]: document.getElementById('aiApiKey').value.trim()
  };
  
  await saveSettings(settings);
  showToast('设置已保存', 'success');
  closeSettings();
}

// ============================================================
// Event Handlers
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const memoContent = document.getElementById('memoContent');
  const charCount = document.getElementById('charCount');
  const visibility = document.getElementById('visibility');
  const sendBtn = document.getElementById('sendBtn');
  const clearBtn = document.getElementById('clearBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const summarizePageBtn = document.getElementById('summarizePageBtn');
  const askAiBtn = document.getElementById('askAiBtn');
  const aiQuestion = document.getElementById('aiQuestion');
  const aiResponse = document.getElementById('aiResponse');
  const saveAiResponseBtn = document.getElementById('saveAiResponseBtn');
  
  // Tab switching
  document.querySelectorAll('.tab-icon').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  
  // Character count
  memoContent.addEventListener('input', () => {
    charCount.textContent = memoContent.value.length;
  });
  
  // Markdown toolbar
  document.querySelectorAll('.tool-btn[data-md]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyMarkdown(memoContent, btn.dataset.md);
    });
  });
  
  // Keyboard shortcuts
  memoContent.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyMarkdown(memoContent, 'bold');
          break;
        case 'i':
          e.preventDefault();
          applyMarkdown(memoContent, 'italic');
          break;
        case 'enter':
          e.preventDefault();
          sendBtn.click();
          break;
      }
    }
  });
  
  // Clear button
  clearBtn.addEventListener('click', () => {
    memoContent.value = '';
    charCount.textContent = '0';
    memoContent.focus();
  });
  
  // Send button
  sendBtn.addEventListener('click', async () => {
    const content = memoContent.value.trim();
    
    if (!content) {
      showToast('请输入备忘内容', 'warning');
      return;
    }
    
    const btnText = sendBtn.querySelector('.btn-text');
    const btnLoading = sendBtn.querySelector('.btn-loading');
    
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    sendBtn.disabled = true;
    
    try {
      await createMemo(content, visibility.value);
      showToast('备忘已发送', 'success');
      memoContent.value = '';
      charCount.textContent = '0';
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      sendBtn.disabled = false;
    }
  });
  
  // Settings
  settingsBtn.addEventListener('click', openSettings);
  closeSettingsBtn.addEventListener('click', closeSettings);
  saveSettingsBtn.addEventListener('click', saveSettingsFromForm);
  
  // Close modal on outside click
  document.getElementById('settingsModal').addEventListener('click', (e) => {
    if (e.target.id === 'settingsModal') {
      closeSettings();
    }
  });
  
  // Refresh history
  refreshBtn.addEventListener('click', loadHistory);
  
  // Summarize page
  summarizePageBtn.addEventListener('click', async () => {
    summarizePageBtn.disabled = true;
    const originalHtml = summarizePageBtn.innerHTML;
    summarizePageBtn.innerHTML = '<span class="spinner"></span> 处理中...';
    
    try {
      const pageContent = await getCurrentPageContent();
      
      const prompt = `请总结以下网页内容，用简洁的中文概括主要信息：

标题: ${pageContent.title}
URL: ${pageContent.url}

内容:
${pageContent.content}`;
      
      const systemPrompt = '你是一个专业的内容总结助手。请用简洁、准确的语言总结用户提供的网页内容，提取关键信息和主要观点。';
      
      const response = await askAI(prompt, systemPrompt);
      aiResponse.innerHTML = escapeHtml(response);
      saveAiResponseBtn.style.display = 'block';
      
      showToast('总结完成', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      summarizePageBtn.innerHTML = originalHtml;
      summarizePageBtn.disabled = false;
    }
  });
  
  // Ask AI
  askAiBtn.addEventListener('click', async () => {
    const question = aiQuestion.value.trim();
    
    if (!question) {
      showToast('请输入问题', 'warning');
      return;
    }
    
    const btnText = askAiBtn.querySelector('.btn-text');
    const btnLoading = askAiBtn.querySelector('.btn-loading');
    
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    askAiBtn.disabled = true;
    
    try {
      const response = await askAI(question);
      aiResponse.innerHTML = escapeHtml(response);
      saveAiResponseBtn.style.display = 'block';
      
      showToast('AI 回复已生成', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      askAiBtn.disabled = false;
    }
  });
  
  // Save AI response as memo
  saveAiResponseBtn.addEventListener('click', async () => {
    const response = aiResponse.textContent;
    
    if (!response || response === 'AI的回复将显示在这里') {
      showToast('没有可保存的内容', 'warning');
      return;
    }
    
    saveAiResponseBtn.disabled = true;
    saveAiResponseBtn.textContent = '保存中...';
    
    try {
      await createMemo(response, 'PRIVATE');
      showToast('已保存为备忘', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      saveAiResponseBtn.disabled = false;
      saveAiResponseBtn.textContent = '保存为备忘';
    }
  });
});
