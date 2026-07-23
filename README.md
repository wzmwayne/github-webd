# WebD Cloud

基于 GitHub Pages + GitHub Actions 的自托管文件网盘。

## 文件结构

```
仓库根目录/
├── index.html              # 文件浏览
├── download.html           # 下载（测速 + 分块并行 + SHA256 校验）
├── update.html             # 上传（拖拽 + 20MB 分块 + PAT 加密）
├── config.js               # 配置文件（需修改）
├── test_file.dat           # 代理测速文件
├── .github/
│   ├── workflows/
│   │   └── index.yml       # 索引构建（手动 / 定时 07:00）
│   └── scripts/
│       └── generate-index.js
└── webd/                   # 文件存放目录
    └── .gitkeep
```

## 部署步骤

### 1. 创建仓库

Fork 此仓库（`forkme` 分支）或手动复制文件到你的仓库。

### 2. 修改配置

编辑 `config.js`，将 owner 和 repo 改为你的信息：

```js
const CONFIG = {
    owner: '你的GitHub用户名',
    repo: '你的仓库名',
    branch: 'main',
    webdPrefix: 'webd',      // webd/ 目录
    chunkThreshold: 20 * 1024 * 1024,  // 20MB 分块
    // nodes: [...]  // 可增删 gh-proxy 节点
};
```

### 3. 启用 GitHub Pages

Settings → Pages → Source: **Deploy from branch**, Branch: `main`, folder: `/`（根目录）。可选配置自定义域名。

### 4. 初始化

推送仓库后，手动触发 Actions 工作流 `index.yml`（或等次日 07:00 定时触发），生成 `index.json`。

### 5. 上传文件

访问 `https://你的域名/update.html`，输入 GitHub Personal Access Token（需要 `repo` 权限），选择文件上传。

- 超过 20MB 自动分块
- 支持多级目录（在路径输入框中指定）
- PAT 使用 AES-GCM 加密存储在浏览器 localStorage

### 6. 下载文件

访问 `index.html` 浏览目录，点击文件进入下载页：
- 内置 67 个 gh-proxy 节点，可测速选择最快节点
- 普通文件流式下载 + SHA256 校验
- 分块文件 5 线程并行下载 → 拼接 → 校验 → 自动保存

## 索引生成

GitHub Actions 工作流每日 07:00（北京时间）自动扫描 `webd/` 目录，检测分块组、计算 SHA256、处理冲突，生成 `index.json`。也可在 Actions 页面手动触发。

上传完成后 `update.html` 自动触发工作流重新生成索引。

## License

MIT
