# WebD Cloud

基于 GitHub Pages 与 GitHub Actions 的自托管文件网盘。

## 功能

- 文件浏览：树形目录导航，文件列表表格展示
- 文件分享：复制 gh-proxy 加速分享链接
- 分块下载：大文件自动拼接，SHA256 完整性校验
- 代理测速：内置 67 个 gh-proxy 节点，20 线程并发测速
- 文件上传：拖拽 / 点击上传，超过 90MB 自动分块
- 自动索引：GitHub Actions 监听 webd/ 目录变更，自动计算 SHA256 并生成 index.json

## 文件结构

```
仓库根目录/
├── index.html              # 文件浏览页面
├── update.html             # 文件上传页面
├── config.js               # 配置文件
├── index.json              # 自动生成的文件索引
├── test_file.dat           # 代理测速测试文件
├── .github/
│   ├── workflows/
│   │   └── index.yml       # 索引构建工作流
│   └── scripts/
│       └── generate-index.js  # 索引生成脚本
└── webd/                   # 文件存储目录
```

## 配置

编辑 `config.js`，修改以下参数：

```javascript
const CONFIG = {
    owner: '你的GitHub用户名',
    repo: '你的仓库名',
    branch: 'main',
    webdPrefix: 'webd',
    chunkThreshold: 90 * 1024 * 1024,  // 分块阈值 90MB
    // ...
};
```

## 部署

1. Fork 或创建此仓库
2. 修改 `config.js` 中的 owner 和 repo
3. 启用 GitHub Pages（Source: Deploy from branch `main`, root `/`）
4. 将文件放入 `webd/` 目录，推送后 Actions 自动生成索引

## 上传文件

访问 `update.html`，输入 GitHub Personal Access Token（需 repo 权限），拖拽或选择文件上传。超过 90MB 的文件自动分块。

## 加速节点

项目内置了 gh-proxy 节点列表，在文件浏览页面可测速并选择最快节点。下载和链接均使用选中节点加速。

## License

MIT
