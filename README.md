# 短剧自动下载服务

自动化下载短剧的独立服务，使用 Puppeteer 控制浏览器自动执行批量下载操作。

## 功能特性

- 🤖 自动获取今天、明天、后天的短剧列表
- 🔍 智能筛选出没有下载任务或下载失败的短剧
- 🌐 使用有头浏览器（可见操作过程）
- ⏰ 定时轮询执行（默认每30分钟）
- 📦 每次批量处理6个短剧
- 🔐 自动保存登录状态
- 📝 完整的日志记录

## 工作流程

```
定时触发（每30分钟）
    ↓
从常读平台获取今天/明天/后天的剧集列表
（筛选条件：审核通过 + 集数≥40）
    ↓
从下载中心获取已有的下载任务列表
    ↓
对比筛选（没有下载任务 或 状态=失败）
    ↓
取前6个短剧ID
    ↓
依次打开短剧详情页
    ↓
点击"批量下载"按钮
    ↓
点击弹窗"确认"按钮
    ↓
记录日志，等待下次执行
```

## 前置要求

- Node.js >= 18
- 主项目服务运行在 `https://cxyy.top/api`
- 常读后台账号（需要登录权限）

> **Windows 用户**：请查看 [Windows 运行指南](./README-WINDOWS.md)

## 安装

```bash
# 进入项目目录
cd drama-auto-downloader

# 安装依赖
pnpm install

# 安装Chrome浏览器（Puppeteer需要）
npx puppeteer browsers install chrome
```

## 配置

1. 复制环境变量文件（已自动创建）：

```bash
cp .env.example .env
```

2. 根据需要修改 `.env` 文件：

```env
# 主项目API地址（用于获取剧集数据）
MAIN_PROJECT_API=https://www.cxyy.top/api

# 常读后台地址
CHANGDU_BASE_URL=https://www.changdupingtai.com

# 调度配置
CRON_SCHEDULE=*/30 * * * *  # 每30分钟执行一次
BATCH_SIZE=6                 # 每次处理的剧集数量

# 浏览器配置
HEADLESS=false              # 是否使用无头模式（false=显示浏览器）
SLOW_MO=100                 # 操作延迟（毫秒）

# 下载中心专用配置（与changdu-web项目保持一致）
# 用于下载中心API的认证，不依赖浏览器cookie
APPID=40012555
APPTYPE=7
DISTRIBUTORID=1842865091654731
DEFAULT_COOKIE=你的下载中心专用Cookie

# 日志级别
LOG_LEVEL=info
```

### 配置说明

#### 数据源说明

本服务**直接从常读平台API获取剧集数据**，不依赖飞书表。工作流程：

1. 从常读平台获取今天/明天/后天要发布的所有剧集
2. 从下载中心获取已有的下载任务
3. 对比筛选出需要处理的剧集
4. 自动执行下载操作

#### 下载中心专用配置

下载中心API使用专用的请求头配置，不依赖浏览器cookie。这与changdu-web项目保持一致。

**重要配置项：**

- `APPID`、`APPTYPE`、`DISTRIBUTORID`：API认证所需的应用标识
- `DEFAULT_COOKIE`：下载中心专用的Cookie，需要从changdu-web项目的`.env`文件中复制相同的值

**如何获取 DEFAULT_COOKIE：**

1. 找到changdu-web项目的`.env`文件
2. 复制`DEFAULT_COOKIE`的值
3. 粘贴到本项目的`.env`文件中

这样可以确保下载中心API的认证独立于浏览器自动化流程，提高稳定性。

### Cron 时间表达式说明

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ 星期几 (0-7, 0和7都表示周日)
│ │ │ └─── 月份 (1-12)
│ │ └───── 日期 (1-31)
│ └─────── 小时 (0-23)
└───────── 分钟 (0-59)
```

常用示例：

- `*/30 * * * *` - 每30分钟执行一次
- `0 */1 * * *` - 每1小时执行一次
- `0 9,12,15,18 * * *` - 每天9点、12点、15点、18点执行

## 测试

在正式启动服务前，可以先测试浏览器是否能正常工作：

```bash
pnpm run test:browser
```

如果看到浏览器打开百度首页，并在3秒后自动关闭，说明环境配置正确。

## 使用

### 1. 确保主项目正在运行

```bash
# 在主项目目录
cd ../changdu-web
npm run dev:full
```

### 2. 启动自动下载服务

```bash
# 方式1：使用启动脚本（推荐）
./start.sh

# 方式2：直接启动
pnpm start
```

### 3. 首次使用 - 登录

首次运行时，浏览器会自动打开常读后台登录页，请手动完成登录。

登录成功后，服务会自动保存登录状态（保存在 `browser-data/` 目录），下次启动时无需再次登录。

### 4. 观察运行

服务启动后：

- 会立即执行一次任务
- 然后按照配置的时间间隔定时执行
- 浏览器窗口会自动操作，可以看到整个过程
- 日志会实时输出到控制台和文件

## 日志

日志文件位于 `logs/` 目录：

- `combined.log` - 所有日志
- `error.log` - 只包含错误日志

## 停止服务

按 `Ctrl + C` 即可优雅退出。

## 项目结构

```
drama-auto-downloader/
├── src/
│   ├── config/
│   │   └── index.js              # 配置管理
│   ├── services/
│   │   ├── dataFetcher.js        # 数据获取
│   │   └── browserAutomation.js  # 浏览器自动化
│   ├── utils/
│   │   └── logger.js             # 日志工具
│   ├── scheduler.js              # 调度器
│   └── index.js                  # 入口文件
├── logs/                         # 日志目录
├── browser-data/                 # 浏览器数据（登录状态）
├── .env                          # 环境变量
├── package.json
└── README.md
```

## 常见问题

### Q: 浏览器找不到"批量下载"按钮？

A: 可能是页面加载慢，可以增加 `SLOW_MO` 的值（如改为 200 或 300）

### Q: 如何切换主体（散柔/牵龙）？

A: 修改 `.env` 文件中的 `CURRENT_SUBJECT`：

- `CURRENT_SUBJECT=sanrou` - 使用散柔主体
- `CURRENT_SUBJECT=qianlong` - 使用牵龙主体

### Q: 如何调整处理频率？

A: 修改 `.env` 文件中的 `CRON_SCHEDULE`，例如：

- 每15分钟：`*/15 * * * *`
- 每1小时：`0 */1 * * *`
- 每天上午9点：`0 9 * * *`

### Q: Cookie过期怎么办？

A: 删除 `browser-data/` 目录，重新启动服务，会提示重新登录。

```bash
rm -rf browser-data/
npm start
```

### Q: 想在服务器上运行？

A: 修改 `.env` 设置为无头模式：

```env
HEADLESS=true
```

但首次需要在本地有头模式下登录并保存登录状态，然后把 `browser-data/` 目录复制到服务器。

## 技术栈

- **Puppeteer** - 浏览器自动化
- **node-cron** - 定时任务
- **axios** - HTTP请求
- **winston** - 日志记录
- **dayjs** - 时间处理

## 注意事项

⚠️ **重要提醒**：

1. 本服务会自动操作浏览器，请确保运行时不要手动操作同一个浏览器窗口
2. 首次使用需要手动登录一次
3. 登录状态保存在 `browser-data/` 目录，请妥善保管
4. 日志文件会自动轮转，单个文件最大5MB
5. 批量下载操作会触发常读后台的下载任务，请确保有足够的下载配额

## 快速开始

详细的快速开始指南请查看 [QUICKSTART.md](./QUICKSTART.md)

## 许可证

MIT
