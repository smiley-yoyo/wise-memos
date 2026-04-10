// ============================================================
// Wise Memos - Chrome Extension
// ============================================================

// Storage Keys
const STORAGE_KEYS = {
  MEMOS_URL: 'memosUrl',
  MEMOS_API_KEY: 'memosApiKey',
  AI_BASE_URL: 'aiBaseUrl',
  AI_MODEL: 'aiModel',
  AI_API_KEY: 'aiApiKey',
  LANGUAGE: 'language'
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

// Show toast with i18n key
function showToastI18n(key, type = 'info') {
  showToast(i18n.t(key), type);
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

// Format date - now delegated to i18n
function formatDate(dateStr) {
  return i18n.formatDate(dateStr);
}

// Visibility label - now delegated to i18n
function getVisibilityLabel(visibility) {
  return i18n.getVisibilityLabel(visibility);
}

// ============================================================
// Memos API
// ============================================================

async function createMemo(content, visibility = 'PRIVATE') {
  const settings = await loadSettings();
  
  if (!settings.memosUrl || !settings.memosApiKey) {
    throw new Error(i18n.t('configureMemosFirst'));
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
    throw new Error(`${i18n.t('sendFailed')}: ${response.status} - ${error}`);
  }
  
  return await response.json();
}

async function listMemos(pageSize = 10) {
  const settings = await loadSettings();
  
  if (!settings.memosUrl || !settings.memosApiKey) {
    throw new Error(i18n.t('configureMemosFirst'));
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
    throw new Error(`${i18n.t('fetchFailed')}: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.memos || [];
}

// ============================================================
// AI API (OpenAI Compatible)
// ============================================================

// Current AI request abort controller
let currentAiController = null;

async function askAI(prompt, systemPrompt = '') {
  const settings = await loadSettings();
  
  if (!settings.aiBaseUrl || !settings.aiApiKey || !settings.aiModel) {
    throw new Error(i18n.t('configureAiFirst'));
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
    throw new Error(`${i18n.t('aiRequestFailed')}: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// Streaming AI request with typewriter effect
async function askAIStream(prompt, systemPrompt = '', onChunk, onComplete) {
  const settings = await loadSettings();
  
  if (!settings.aiBaseUrl || !settings.aiApiKey || !settings.aiModel) {
    throw new Error(i18n.t('configureAiFirst'));
  }
  
  // Abort previous request if exists
  if (currentAiController) {
    currentAiController.abort();
  }
  currentAiController = new AbortController();
  
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
      temperature: 0.7,
      stream: true
    }),
    signal: currentAiController.signal
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${i18n.t('aiRequestFailed')}: ${response.status} - ${error}`);
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete(fullContent);
            return fullContent;
          }
          
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              onChunk(fullContent);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      onComplete(fullContent);
      return fullContent;
    }
    throw error;
  } finally {
    currentAiController = null;
  }
  
  onComplete(fullContent);
  return fullContent;
}

// Abort current AI request
function abortAiRequest() {
  if (currentAiController) {
    currentAiController.abort();
    currentAiController = null;
  }
}

// Get current page content
async function getCurrentPageContent() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs[0]) {
        reject(new Error(i18n.t('cannotGetTab')));
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
        reject(new Error(i18n.t('cannotGetPageContent')));
      }
    });
  });
}

// ============================================================
// Markdown Toolbar Functions
// ============================================================

// Markdown actions with i18n placeholders - will be initialized after i18n loads
function getMarkdownActions() {
  return {
    bold: { prefix: '**', suffix: '**', placeholder: i18n.t('mdBold') },
    italic: { prefix: '*', suffix: '*', placeholder: i18n.t('mdItalic') },
    strikethrough: { prefix: '~~', suffix: '~~', placeholder: i18n.t('mdStrikethrough') },
    h1: { prefix: '# ', suffix: '', placeholder: i18n.t('mdH1'), lineStart: true },
    h2: { prefix: '## ', suffix: '', placeholder: i18n.t('mdH2'), lineStart: true },
    h3: { prefix: '### ', suffix: '', placeholder: i18n.t('mdH3'), lineStart: true },
    ul: { prefix: '- ', suffix: '', placeholder: i18n.t('mdList'), lineStart: true },
    ol: { prefix: '1. ', suffix: '', placeholder: i18n.t('mdList'), lineStart: true },
    task: { prefix: '- [ ] ', suffix: '', placeholder: i18n.t('mdTask'), lineStart: true },
    code: { prefix: '`', suffix: '`', placeholder: i18n.t('mdCode') },
    codeblock: { prefix: '```\n', suffix: '\n```', placeholder: i18n.t('mdCodeBlock'), multiline: true },
    quote: { prefix: '> ', suffix: '', placeholder: i18n.t('mdQuote'), lineStart: true },
    link: { prefix: '[', suffix: '](url)', placeholder: i18n.t('mdLink') },
    image: { prefix: '![', suffix: '](url)', placeholder: i18n.t('mdImage') },
    hr: { prefix: '\n---\n', suffix: '', placeholder: '' }
  };
}

function applyMarkdown(textarea, action) {
  const markdownActions = getMarkdownActions();
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
      <span>${i18n.t('loading')}</span>
    </div>
  `;
  
  try {
    const memos = await listMemos(10);
    
    if (memos.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <p>${i18n.t('noMemos')}</p>
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
            <a href="#" class="memo-link" data-memo-id="${memoId}" title="${i18n.t('openMemo')}">
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
        <button class="btn btn-primary" onclick="document.getElementById('settingsBtn').click()">${i18n.t('goToSettings')}</button>
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
  
  // Set language selector
  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
    langSelect.value = i18n.currentLang;
  }
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
  showToastI18n('settingsSaved', 'success');
  closeSettings();
}

// ============================================================
// Event Handlers
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize i18n first
  await i18n.loadLanguagePreference();
  i18n.updateUI();
  
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
  const aiResponseActions = document.getElementById('aiResponseActions');
  const saveAiResponseBtn = document.getElementById('saveAiResponseBtn');
  const regenerateBtn = document.getElementById('regenerateBtn');
  const languageSelect = document.getElementById('languageSelect');
  
  // Language selector change handler
  languageSelect.addEventListener('change', () => {
    i18n.setLanguage(languageSelect.value);
  });
  
  // Track last AI request for regeneration
  let lastAiRequest = null;
  
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
      showToastI18n('enterContent', 'warning');
      return;
    }
    
    const btnText = sendBtn.querySelector('.btn-text');
    const btnLoading = sendBtn.querySelector('.btn-loading');
    
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    sendBtn.disabled = true;
    
    try {
      await createMemo(content, visibility.value);
      showToastI18n('memoSent', 'success');
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
  
  // Track if AI is currently streaming
  let isStreaming = false;
  
  // Helper to update response with typewriter effect
  function updateAiResponse(content, pageContent, isFinal = false) {
    let displayContent = content;
    if (isFinal && pageContent) {
      displayContent = `${content}\n\n---\n📎 ${i18n.t('source')}: [${pageContent.title}](${pageContent.url})`;
    }
    aiResponse.innerHTML = escapeHtml(displayContent);
    // Auto scroll to bottom
    aiResponse.scrollTop = aiResponse.scrollHeight;
  }
  
  // Summarize page
  summarizePageBtn.addEventListener('click', async () => {
    summarizePageBtn.disabled = true;
    summarizePageBtn.classList.add('loading');
    isStreaming = true;
    regenerateBtn.disabled = false; // Allow interruption
    saveAiResponseBtn.disabled = true;
    
    try {
      const pageContent = await getCurrentPageContent();
      
      const isEnglish = i18n.currentLang === 'en';
      const prompt = isEnglish 
        ? `Please summarize the following web page content concisely:

Title: ${pageContent.title}
URL: ${pageContent.url}

Content:
${pageContent.content}`
        : `请总结以下网页内容，用简洁的中文概括主要信息：

标题: ${pageContent.title}
URL: ${pageContent.url}

内容:
${pageContent.content}`;
      
      const systemPrompt = isEnglish
        ? 'You are a professional content summarization assistant. Please summarize the web page content provided by the user in a concise and accurate manner, extracting key information and main points.'
        : '你是一个专业的内容总结助手。请用简洁、准确的语言总结用户提供的网页内容，提取关键信息和主要观点。';
      
      // Save request for regeneration
      lastAiRequest = { prompt, systemPrompt, pageContent };
      
      await askAIStream(
        prompt,
        systemPrompt,
        (content) => updateAiResponse(content, null),
        (finalContent) => {
          updateAiResponse(finalContent, pageContent, true);
          saveAiResponseBtn.disabled = false;
          isStreaming = false;
        }
      );
      
      showToastI18n('summaryComplete', 'success');
    } catch (error) {
      if (error.name !== 'AbortError') {
        showToast(error.message, 'error');
      }
      isStreaming = false;
    } finally {
      summarizePageBtn.classList.remove('loading');
      summarizePageBtn.disabled = false;
    }
  });
  
  // Extract todos
  const todoExtractBtn = document.getElementById('todoExtractBtn');
  todoExtractBtn.addEventListener('click', async () => {
    todoExtractBtn.disabled = true;
    todoExtractBtn.classList.add('loading');
    isStreaming = true;
    regenerateBtn.disabled = false;
    saveAiResponseBtn.disabled = true;
    
    try {
      const pageContent = await getCurrentPageContent();
      
      const isEnglish = i18n.currentLang === 'en';
      const prompt = isEnglish
        ? `Based on the following web page content, extract and organize a to-do list. If there are no obvious to-do items, infer possible tasks or action items based on the content's theme and key points:

Title: ${pageContent.title}
URL: ${pageContent.url}

Content:
${pageContent.content}`
        : `请根据以下网页内容，提取并整理出待办事项列表。如果内容中没有明显的待办事项，请根据内容的主题和要点，推断出可能需要完成的任务或行动项：

标题: ${pageContent.title}
URL: ${pageContent.url}

内容:
${pageContent.content}`;
      
      const systemPrompt = isEnglish
        ? 'You are a professional task organization assistant. Please extract to-do items from the content provided by the user, using Markdown task list format (- [ ] task content). Each task should be concise, clear, and actionable. If there are no explicit to-do items in the content, infer possible action items based on the content.'
        : '你是一个专业的任务整理助手。请从用户提供的内容中提取待办事项，使用 Markdown 任务列表格式（- [ ] 任务内容）。每个任务应该简洁明确、可执行。如果内容中没有明确的待办事项，请根据内容推断可能需要的行动项。';
      
      // Save request for regeneration
      lastAiRequest = { prompt, systemPrompt, pageContent };
      
      await askAIStream(
        prompt,
        systemPrompt,
        (content) => updateAiResponse(content, null),
        (finalContent) => {
          updateAiResponse(finalContent, pageContent, true);
          saveAiResponseBtn.disabled = false;
          isStreaming = false;
        }
      );
      
      showToastI18n('todosExtracted', 'success');
    } catch (error) {
      if (error.name !== 'AbortError') {
        showToast(error.message, 'error');
      }
      isStreaming = false;
    } finally {
      todoExtractBtn.classList.remove('loading');
      todoExtractBtn.disabled = false;
    }
  });
  
  // Custom query toggle
  const customQueryBtn = document.getElementById('customQueryBtn');
  const customQuerySection = document.getElementById('customQuerySection');
  
  customQueryBtn.addEventListener('click', () => {
    const isHidden = customQuerySection.style.display === 'none';
    customQuerySection.style.display = isHidden ? 'block' : 'none';
    customQueryBtn.classList.toggle('active', isHidden);
    if (isHidden) {
      aiQuestion.focus();
    }
  });
  
  // Ask AI (custom query)
  askAiBtn.addEventListener('click', async () => {
    const question = aiQuestion.value.trim();
    
    if (!question) {
      showToastI18n('enterQuestion', 'warning');
      return;
    }
    
    const originalHtml = askAiBtn.innerHTML;
    askAiBtn.innerHTML = '<span class="spinner"></span>';
    askAiBtn.disabled = true;
    isStreaming = true;
    regenerateBtn.disabled = false;
    saveAiResponseBtn.disabled = true;
    
    try {
      const pageContent = await getCurrentPageContent();
      
      const isEnglish = i18n.currentLang === 'en';
      const prompt = isEnglish
        ? `The user has a question about the following web page content. Please answer:

Page Title: ${pageContent.title}
Page URL: ${pageContent.url}

Page Content:
${pageContent.content}

User Question: ${question}`
        : `用户针对以下网页内容提出了问题，请回答：

网页标题: ${pageContent.title}
网页URL: ${pageContent.url}

网页内容:
${pageContent.content}

用户问题: ${question}`;
      
      // Save request for regeneration
      lastAiRequest = { prompt, systemPrompt: '', pageContent };
      
      await askAIStream(
        prompt,
        '',
        (content) => updateAiResponse(content, null),
        (finalContent) => {
          updateAiResponse(finalContent, pageContent, true);
          saveAiResponseBtn.disabled = false;
          isStreaming = false;
        }
      );
      
      showToastI18n('aiResponseGenerated', 'success');
    } catch (error) {
      if (error.name !== 'AbortError') {
        showToast(error.message, 'error');
      }
      isStreaming = false;
    } finally {
      askAiBtn.innerHTML = originalHtml;
      askAiBtn.disabled = false;
    }
  });
  
  // Enter to submit custom query
  aiQuestion.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askAiBtn.click();
    }
  });
  
  // Regenerate response
  regenerateBtn.addEventListener('click', async () => {
    // If currently streaming, abort it
    if (isStreaming) {
      abortAiRequest();
      isStreaming = false;
      showToastI18n('interrupted', 'warning');
      
      // Reset button states
      summarizePageBtn.classList.remove('loading');
      summarizePageBtn.disabled = false;
      todoExtractBtn.classList.remove('loading');
      todoExtractBtn.disabled = false;
      saveAiResponseBtn.disabled = false;
      return;
    }
    
    if (!lastAiRequest) {
      showToastI18n('noRequestToRegenerate', 'warning');
      return;
    }
    
    regenerateBtn.disabled = true;
    regenerateBtn.classList.add('loading');
    isStreaming = true;
    saveAiResponseBtn.disabled = true;
    
    try {
      const { prompt, systemPrompt, pageContent } = lastAiRequest;
      
      await askAIStream(
        prompt,
        systemPrompt,
        (content) => updateAiResponse(content, null),
        (finalContent) => {
          updateAiResponse(finalContent, pageContent, true);
          saveAiResponseBtn.disabled = false;
          isStreaming = false;
        }
      );
      
      showToastI18n('regenerated', 'success');
    } catch (error) {
      if (error.name !== 'AbortError') {
        showToast(error.message, 'error');
      }
      isStreaming = false;
    } finally {
      regenerateBtn.classList.remove('loading');
      regenerateBtn.disabled = false;
    }
  });
  
  // Save AI response as memo
  saveAiResponseBtn.addEventListener('click', async () => {
    const response = aiResponse.textContent;
    
    if (!response || response === i18n.t('aiResponsePlaceholder')) {
      showToastI18n('noContentToSave', 'warning');
      return;
    }
    
    saveAiResponseBtn.disabled = true;
    const originalText = saveAiResponseBtn.querySelector('span[data-i18n="saveMemo"]');
    if (originalText) {
      originalText.textContent = i18n.t('saving');
    }
    
    try {
      await createMemo(response, 'PRIVATE');
      showToastI18n('savedAsMemo', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      saveAiResponseBtn.disabled = false;
      if (originalText) {
        originalText.textContent = i18n.t('saveMemo');
      }
    }
  });
});
