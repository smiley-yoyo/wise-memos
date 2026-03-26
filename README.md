# Wise Memos

一个简洁美观的 Chrome 扩展，用于快速编写 Markdown 备忘录并发送到 Memos 实例，同时支持 AI 总结网页内容。

## ✨ 功能特性

### 📝 快捷备忘
- 快速编写 Markdown 格式的备忘录
- 支持常见 Markdown 标记快捷插入（粗体、斜体、标题、列表、代码块等）
- 支持键盘快捷键：`Ctrl+B` 粗体、`Ctrl+I` 斜体、`Ctrl+Enter` 发送
- 可选择备忘可见性（私有/仅登录用户/公开）

### 📚 历史记录
- 查看最近 10 条备忘录
- 实时刷新功能

### 🤖 AI 助手
- 一键总结当前浏览的网页内容
- 支持自定义问题询问 AI
- AI 回复可直接保存为备忘录
- 兼容 OpenAI API 格式（支持各种兼容的 AI 服务）

## 📦 安装方法

### 开发者模式安装

1. 下载或克隆此仓库到本地
2. 打开 Chrome 浏览器，进入 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 `wise-memos` 文件夹

## ⚙️ 配置说明

点击扩展界面右上角的设置图标进行配置。

### Memos 配置
- **实例地址**：你的 Memos 服务地址，如 `https://memos.example.com`
- **API Key**：在 Memos 设置中生成的 Access Token

### AI 配置（可选）
- **Base URL**：AI API 地址，如 `https://api.openai.com/v1`
- **模型名称**：如 `gpt-4o-mini`、`gpt-4o`、`claude-3-sonnet` 等
- **API Key**：你的 AI 服务 API Key

## 🔧 获取 Memos Access Token

1. 登录你的 Memos 实例
2. 进入「设置」→「我的帐号」
3. 在「Access Tokens」部分创建新的 Token
4. 复制生成的 Token 到扩展设置中

## 🎨 界面预览

扩展采用现代简洁的设计风格：
- 三个主要标签页：编写、历史、AI助手
- Markdown 工具栏快捷操作
- 深色/浅色主题自适应（跟随系统）

## 📄 技术栈

- Chrome Extension Manifest V3
- 原生 JavaScript（无框架依赖）
- CSS Variables 主题系统
- Memos API v1
- OpenAI Compatible API

## 🔒 隐私说明

- 所有设置数据存储在本地浏览器中
- 备忘内容直接发送到你配置的 Memos 实例
- AI 功能仅在你主动使用时才会请求 AI 服务
- 页面内容读取仅在点击「总结当前页面」时触发

## 📝 License

MIT License
