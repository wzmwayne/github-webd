# WebD Cloud

基于 GitHub Pages 与 GitHub Actions 的自托管文件网盘。

## 功能

- 文件浏览：树形目录导航，文件列表表格展示
- 文件下载：单文件流式下载或分块文件多线程并行下载，SHA256 完整性校验
- 代理测速：内置 67 个 gh-proxy 节点，20 线程并发测速
- 文件上传：拖拽或点击上传，超过 20MB 自动分块，支持多级目录
- 索引构建：GitHub Actions 每日 07:00 或手动触发，自动计算 SHA256 并生成 index.json

## 文件结构

```
仓库根目录/
├── index.html              # 文件浏览（树形 + 表格）
├── download.html           # 文件下载（测速 + 并行下载 + SHA256）
├── update.html             # 文件上传（拖拽 + 分块 + 路径选择）
├── config.js               # 配置文件
├── index.json              # 自动生成的文件索引
├── test_file.dat           # 代理测速测试文件
├── .github/
│   ├── workflows/
│   │   └── index.yml       # 索引构建工作流（仅手动/定时）
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
