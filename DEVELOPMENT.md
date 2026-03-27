# 开发指南

## 📦 本地打包

项目提供了打包脚本，用于将扩展打包为可发布的 zip 文件。

```bash
# 使用 manifest.json 中的当前版本
./scripts/package.sh

# 指定版本号（会自动更新 manifest.json）
./scripts/package.sh 1.1.0
```

打包后的文件位于 `dist/wise-memos-v{version}.zip`。

## 🚀 发布新版本

### 方式一：GitHub 自动发布（推荐）

1. 更新 `manifest.json` 中的版本号：
   ```json
   {
     "version": "1.1.0"
   }
   ```

2. 提交更改并创建 tag：
   ```bash
   git add .
   git commit -m "Release v1.1.0"
   git tag v1.1.0
   git push origin main --tags
   ```

3. GitHub Actions 会自动：
   - 验证 tag 版本与 manifest.json 一致
   - 打包扩展为 zip 文件
   - 创建 GitHub Release 并附带 changelog

### 方式二：手动发布

1. 本地打包：
   ```bash
   ./scripts/package.sh 1.1.0
   ```

2. 在 GitHub 上手动创建 Release，上传 `dist/wise-memos-v1.1.0.zip`

## 📁 项目结构

```
wise-memos/
├── manifest.json      # 扩展清单
├── popup.html         # 弹出页面
├── popup.js           # 主逻辑
├── styles.css         # 样式（支持深色主题）
├── icons/             # 图标资源
│   ├── icon48.png
│   └── icon128.png
├── scripts/
│   └── package.sh     # 打包脚本
└── .github/
    └── workflows/
        └── release.yml  # 自动发布工作流
```

## 🔧 开发调试

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择项目根目录

修改代码后，点击扩展卡片上的刷新按钮即可重新加载。
