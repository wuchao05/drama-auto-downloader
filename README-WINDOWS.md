# Windows 运行指南

本文档介绍如何在 Windows 系统上运行短剧自动下载服务。

## 系统要求

- Windows 10 或 Windows 11
- Node.js >= 18
- Chrome 浏览器

## 安装步骤

### 1. 安装 Node.js

如果还没有安装 Node.js，请访问：
- https://nodejs.org/
- 下载并安装 LTS 版本（推荐 18.x 或更高版本）

### 2. 安装 pnpm（可选，推荐）

在 PowerShell 或 CMD 中运行：

```powershell
npm install -g pnpm
```

### 3. 克隆/下载项目

将项目文件夹放到你的工作目录，例如：
```
C:\Projects\drama-auto-downloader
```

### 4. 安装依赖

在项目目录中打开 PowerShell 或 CMD：

```powershell
# 进入项目目录
cd C:\Projects\drama-auto-downloader

# 安装依赖
pnpm install

# 安装 Chrome 浏览器（Puppeteer 需要）
npx puppeteer browsers install chrome
```

## 配置

### 1. 复制环境变量文件

```powershell
copy .env.example .env
```

### 2. 编辑 .env 文件

用记事本或 VS Code 打开 `.env` 文件，修改配置：

```env
# 主项目API地址
MAIN_PROJECT_API=https://cxyy.top/api

# 常读后台地址
CHANGDU_BASE_URL=https://www.changdupingtai.com

# 调度配置
CRON_SCHEDULE=*/30 * * * *
BATCH_SIZE=6

# 浏览器配置
HEADLESS=false
SLOW_MO=100

# 下载中心专用配置
# 默认会自动从 https://cxyy.top/api/public/download-center/default 拉取
# 只有远程接口不可用时，才回退到下面这些本地兜底字段
APPID=
APPTYPE=7
DISTRIBUTORID=
ADUSERID=
ROOT_ADUSERID=
DEFAULT_COOKIE=

# 日志级别
LOG_LEVEL=info
```

## 运行

### 方法1：使用批处理脚本（推荐）

双击运行：
```
start.bat
```

或在 CMD 中：
```cmd
start.bat
```

### 方法2：使用 PowerShell 脚本

右键点击 `start.ps1`，选择"使用 PowerShell 运行"

或在 PowerShell 中：
```powershell
.\start.ps1
```

**注意**：首次运行可能需要设置执行策略：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 方法3：直接使用命令

在 PowerShell 或 CMD 中：
```powershell
pnpm start
```

或：
```powershell
npm start
```

## 常见问题

### 1. Chrome 浏览器路径问题

如果 Puppeteer 找不到 Chrome，可以手动指定路径。

修改 `src/services/browserAutomation.js` 的 `init()` 方法：

```javascript
this.browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: config.browser.headless,
  // ... 其他配置
})
```

### 2. 路径问题

Windows 使用反斜杠（`\`）作为路径分隔符，但代码中使用的是正斜杠（`/`），这在 Node.js 中是通用的，不需要修改。

### 3. PowerShell 执行策略错误

如果遇到"无法加载，因为在此系统上禁止运行脚本"：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4. 端口占用

如果主项目（changdu-web）使用的端口被占用：

```powershell
# 查看端口占用
netstat -ano | findstr :3000

# 结束进程
taskkill /PID <进程ID> /F
```

### 5. 防火墙问题

Windows 防火墙可能会阻止 Chrome 连接，首次运行时选择"允许访问"。

## 无头模式

### 开发调试（有头模式）

```env
HEADLESS=false
```

可以看到浏览器操作过程，方便调试。

### 生产运行（无头模式）

```env
HEADLESS=true
```

节省资源，适合服务器长期运行。

## 开机自启动（可选）

### 方法1：使用任务计划程序

1. 打开"任务计划程序"（Task Scheduler）
2. 创建基本任务
3. 触发器：系统启动时
4. 操作：启动程序
5. 程序路径：`C:\Projects\drama-auto-downloader\start.bat`

### 方法2：使用 PM2

```powershell
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start src\index.js --name drama-downloader

# 设置开机自启
pm2 startup
pm2 save
```

## 服务管理（使用 PM2）

```powershell
# 查看状态
pm2 status

# 查看日志
pm2 logs drama-downloader

# 重启服务
pm2 restart drama-downloader

# 停止服务
pm2 stop drama-downloader

# 删除服务
pm2 delete drama-downloader
```

## 故障排查

### 查看日志

Windows 日志路径：
```
%USERPROFILE%\.pm2\logs\
```

或直接在控制台查看实时日志。

### 常见错误

1. **Node 版本过低**
   ```powershell
   node --version
   # 应该 >= 18
   ```

2. **依赖安装失败**
   ```powershell
   # 清除缓存重试
   pnpm store prune
   pnpm install
   ```

3. **Chrome 启动失败**
   ```powershell
   # 重新安装 Chrome
   npx puppeteer browsers install chrome --force
   ```

## 性能优化

### 1. 关闭不必要的 Chrome 进程

```powershell
taskkill /F /IM chrome.exe
```

### 2. 清理浏览器数据

删除 `browser-data` 文件夹：
```powershell
rmdir /s /q browser-data
```

### 3. 监控资源占用

打开任务管理器（Ctrl+Shift+Esc）查看：
- Node.js 进程
- Chrome 进程

## 技术支持

如遇到问题，请查看：
- 主 README.md
- 日志输出
- Issues（如果是开源项目）
