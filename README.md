# WebD Cloud

基于 GitHub Pages + GitHub Actions 的自托管文件网盘。

## 文件结构

```
仓库根目录/
├── index.html              # 文件浏览（目录导航 + 双源索引）
├── download.html           # 下载（测速 + 分块并行 + SHA256 校验）
├── update.html             # 上传（拖拽 + 20MB 分块 + PAT 加密）
├── config.js               # 配置文件
├── index.json              # 自动生成的文件索引
├── test_file.dat           # 代理测速文件
├── .github/
│   ├── workflows/
│   │   └── index.yml       # 索引构建（手动 / 定时 07:00）
│   └── scripts/
│       └── generate-index.js
└── webd/                   # 文件存放目录
```

## 快速开始

Fork [`forkme`](https://github.com/wzmwayne/github-webd/tree/forkme) 分支，该分支不包含任何数据文件和索引，开箱即用。

1. 修改 `config.js` 中的 `owner` 和 `repo`
2. 启用 GitHub Pages（Branch: `main`, folder: `/`）
3. 推送后手动触发 Actions 工作流 `index.yml` 生成索引
4. 访问 `update.html`，输入 PAT 上传文件

## 功能

| 功能 | 说明 |
|------|------|
| 文件浏览 | 目录导航 + 上级返回，双源索引（Pages CDN / GitHub raw 自动比对） |
| 文件上传 | 拖拽上传，>20MB 自动分块，单线程稳定上传，PAT 加密存储 |
| 文件下载 | gh-proxy 节点 20 线程测速，分块文件 5 线程并行下载 + SHA256 校验 |
| 索引构建 | GitHub Actions 自动扫描 webd/，检测分块组，计算 SHA256，处理冲突 |

## License

MIT
