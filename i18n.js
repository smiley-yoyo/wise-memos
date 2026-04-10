// ============================================================
// Internationalization (i18n) Module
// ============================================================

const i18n = {
  // Current language
  currentLang: 'zh',

  // Translations
  translations: {
    zh: {
      // Header
      compose: '编写',
      history: '历史',
      aiAssistant: 'AI助手',
      settings: '设置',

      // Toolbar
      bold: '粗体',
      italic: '斜体',
      strikethrough: '删除线',
      heading1: '一级标题',
      heading2: '二级标题',
      heading3: '三级标题',
      unorderedList: '无序列表',
      orderedList: '有序列表',
      taskList: '任务列表',
      inlineCode: '行内代码',
      codeBlock: '代码块',
      quote: '引用',
      link: '链接',
      image: '图片',
      horizontalRule: '分割线',

      // Editor
      placeholder: '写下你的想法...',
      private: '🔒 私有',
      protected: '🔐 仅登录用户',
      public: '🌐 公开',
      characters: '字符',
      clear: '清空',
      sendMemo: '发送备忘',

      // History
      recentMemos: '最近 10 条备忘',
      refresh: '刷新',
      loading: '加载中...',
      noMemos: '暂无备忘记录',
      openMemo: '打开笔记',
      goToSettings: '前往设置',

      // AI
      pageSummary: '网页总结',
      todoExtract: '待办事项',
      other: '其他',
      aiQuestionPlaceholder: '输入你想问AI的问题...',
      aiResponsePlaceholder: 'AI的回复将显示在这里',
      aiReply: 'AI 回复',
      regenerate: '重新回答',
      saveMemo: '保存备忘',

      // Settings
      settingsTitle: '设置',
      memosConfig: 'Memos 配置',
      instanceUrl: '实例地址',
      apiKey: 'API Key',
      accessToken: '你的 Access Token',
      aiConfig: 'AI 配置 (OpenAI 兼容格式)',
      baseUrl: 'Base URL',
      modelName: '模型名称',
      saveSettings: '保存设置',
      language: '语言',
      languageOption: '中文',

      // Time formats
      justNow: '刚刚',
      minutesAgo: '{n} 分钟前',
      hoursAgo: '{n} 小时前',
      daysAgo: '{n} 天前',

      // Markdown placeholders
      mdBold: '粗体文本',
      mdItalic: '斜体文本',
      mdStrikethrough: '删除线文本',
      mdH1: '一级标题',
      mdH2: '二级标题',
      mdH3: '三级标题',
      mdList: '列表项',
      mdTask: '任务项',
      mdCode: '代码',
      mdCodeBlock: '代码块',
      mdQuote: '引用内容',
      mdLink: '链接文本',
      mdImage: '图片描述',

      // Toasts & Messages
      enterContent: '请输入备忘内容',
      memoSent: '备忘已发送',
      settingsSaved: '设置已保存',
      summaryComplete: '总结完成',
      todosExtracted: '待办事项已提取',
      aiResponseGenerated: 'AI 回复已生成',
      regenerated: '已重新生成',
      interrupted: '已中断',
      savedAsMemo: '已保存为备忘',
      enterQuestion: '请输入问题',
      noContentToSave: '没有可保存的内容',
      noRequestToRegenerate: '没有可重新生成的请求',
      configureMemosFirst: '请先配置 Memos 实例地址和 API Key',
      configureAiFirst: '请先配置 AI 模型设置',
      sendFailed: '发送失败',
      fetchFailed: '获取失败',
      aiRequestFailed: 'AI 请求失败',
      cannotGetTab: '无法获取当前标签页',
      cannotGetPageContent: '无法获取页面内容，请确保页面已加载完成',
      source: '来源',
      saving: '保存中...'
    },
    en: {
      // Header
      compose: 'Compose',
      history: 'History',
      aiAssistant: 'AI Assistant',
      settings: 'Settings',

      // Toolbar
      bold: 'Bold',
      italic: 'Italic',
      strikethrough: 'Strikethrough',
      heading1: 'Heading 1',
      heading2: 'Heading 2',
      heading3: 'Heading 3',
      unorderedList: 'Unordered List',
      orderedList: 'Ordered List',
      taskList: 'Task List',
      inlineCode: 'Inline Code',
      codeBlock: 'Code Block',
      quote: 'Quote',
      link: 'Link',
      image: 'Image',
      horizontalRule: 'Horizontal Rule',

      // Editor
      placeholder: 'Write your thoughts...',
      private: '🔒 Private',
      protected: '🔐 Login Required',
      public: '🌐 Public',
      characters: 'chars',
      clear: 'Clear',
      sendMemo: 'Send Memo',

      // History
      recentMemos: 'Recent 10 Memos',
      refresh: 'Refresh',
      loading: 'Loading...',
      noMemos: 'No memos yet',
      openMemo: 'Open memo',
      goToSettings: 'Go to Settings',

      // AI
      pageSummary: 'Page Summary',
      todoExtract: 'Extract Todos',
      other: 'Other',
      aiQuestionPlaceholder: 'Enter your question for AI...',
      aiResponsePlaceholder: 'AI response will appear here',
      aiReply: 'AI Reply',
      regenerate: 'Regenerate',
      saveMemo: 'Save Memo',

      // Settings
      settingsTitle: 'Settings',
      memosConfig: 'Memos Configuration',
      instanceUrl: 'Instance URL',
      apiKey: 'API Key',
      accessToken: 'Your Access Token',
      aiConfig: 'AI Configuration (OpenAI Compatible)',
      baseUrl: 'Base URL',
      modelName: 'Model Name',
      saveSettings: 'Save Settings',
      language: 'Language',
      languageOption: 'English',

      // Time formats
      justNow: 'Just now',
      minutesAgo: '{n} min ago',
      hoursAgo: '{n} hr ago',
      daysAgo: '{n} days ago',

      // Markdown placeholders
      mdBold: 'bold text',
      mdItalic: 'italic text',
      mdStrikethrough: 'strikethrough text',
      mdH1: 'Heading 1',
      mdH2: 'Heading 2',
      mdH3: 'Heading 3',
      mdList: 'list item',
      mdTask: 'task item',
      mdCode: 'code',
      mdCodeBlock: 'code block',
      mdQuote: 'quote',
      mdLink: 'link text',
      mdImage: 'image description',

      // Toasts & Messages
      enterContent: 'Please enter memo content',
      memoSent: 'Memo sent',
      settingsSaved: 'Settings saved',
      summaryComplete: 'Summary complete',
      todosExtracted: 'Todos extracted',
      aiResponseGenerated: 'AI response generated',
      regenerated: 'Regenerated',
      interrupted: 'Interrupted',
      savedAsMemo: 'Saved as memo',
      enterQuestion: 'Please enter a question',
      noContentToSave: 'No content to save',
      noRequestToRegenerate: 'No request to regenerate',
      configureMemosFirst: 'Please configure Memos instance URL and API Key first',
      configureAiFirst: 'Please configure AI model settings first',
      sendFailed: 'Send failed',
      fetchFailed: 'Fetch failed',
      aiRequestFailed: 'AI request failed',
      cannotGetTab: 'Cannot get current tab',
      cannotGetPageContent: 'Cannot get page content, please ensure the page is fully loaded',
      source: 'Source',
      saving: 'Saving...'
    }
  },

  // Get translation
  t(key, params = {}) {
    const translation = this.translations[this.currentLang]?.[key] || 
                        this.translations['zh'][key] || 
                        key;
    
    // Replace parameters like {n}
    return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  },

  // Set language
  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      this.updateUI();
      this.saveLanguagePreference(lang);
    }
  },

  // Save language preference
  saveLanguagePreference(lang) {
    chrome.storage.sync.set({ language: lang });
  },

  // Load language preference
  async loadLanguagePreference() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['language'], (result) => {
        const lang = result.language || 'zh';
        this.currentLang = lang;
        resolve(lang);
      });
    });
  },

  // Update UI with current language
  updateUI() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    // Update elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    // Update elements with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });

    // Update visibility options
    const visibility = document.getElementById('visibility');
    if (visibility) {
      visibility.options[0].textContent = this.t('private');
      visibility.options[1].textContent = this.t('protected');
      visibility.options[2].textContent = this.t('public');
    }

    // Update language selector
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
      langSelect.value = this.currentLang;
    }

    // Update HTML lang attribute
    document.documentElement.lang = this.currentLang === 'zh' ? 'zh-CN' : 'en';
  },

  // Get visibility label
  getVisibilityLabel(visibility) {
    const labels = {
      'PRIVATE': this.t('private'),
      'PROTECTED': this.t('protected'),
      'PUBLIC': this.t('public')
    };
    return labels[visibility] || visibility;
  },

  // Format date
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
      return this.t('justNow');
    } else if (diff < 3600000) {
      return this.t('minutesAgo', { n: Math.floor(diff / 60000) });
    } else if (diff < 86400000) {
      return this.t('hoursAgo', { n: Math.floor(diff / 3600000) });
    } else if (diff < 604800000) {
      return this.t('daysAgo', { n: Math.floor(diff / 86400000) });
    } else {
      return date.toLocaleDateString(this.currentLang === 'zh' ? 'zh-CN' : 'en-US');
    }
  }
};

// Export for use in popup.js
window.i18n = i18n;
