# 快速开始指南

## 第一步：安装依赖

```bash
cd /Users/wuchao/Documents/code/guazai/drama-auto-downloader
pnpm install
# 可选：若本机没有 Chrome，再安装 Playwright 内置浏览器
pnpm exec playwright install chromium
```

## 第二步：测试环境

```bash
pnpm run test:browser
```

应该会看到浏览器自动打开百度首页，3秒后自动关闭。

## 第三步：确认主项目可访问

主项目运行在 `https://www.cxyy.top`，确保可以访问：

```bash
curl https://www.cxyy.top
```

如果返回正常响应，说明主项目正在运行。

## 第四步：启动自动下载服务

```bash
# 回到本项目目录
cd /Users/wuchao/Documents/code/guazai/drama-auto-downloader

# 启动服务
./start.sh
# 或者
pnpm start
```

## 第五步：首次登录

浏览器会自动打开常读后台登录页，请手动完成登录：

1. 输入账号密码
2. 完成登录
3. 等待自动跳转

登录成功后，服务会自动保存登录状态，以后启动就不需要再登录了。

## 第六步：观察运行

服务会：
1. 立即执行一次任务
2. 然后每30分钟自动执行一次
3. 每次处理6个短剧
4. 控制台会输出详细日志

## 停止服务

按 `Ctrl + C` 退出

## 常用操作

### 切换主体

编辑 `.env` 文件：

```bash
# 使用散柔主体
CURRENT_SUBJECT=sanrou

# 使用牵龙主体  
CURRENT_SUBJECT=qianlong
```

### 调整频率

编辑 `.env` 文件：

```bash
# 每15分钟
CRON_SCHEDULE=*/15 * * * *

# 每1小时
CRON_SCHEDULE=0 */1 * * *

# 每天上午9点
CRON_SCHEDULE=0 9 * * *
```

### 调整批次大小

编辑 `.env` 文件：

```bash
# 每次处理10个
BATCH_SIZE=10
```

### 查看日志

```bash
# 实时查看所有日志
tail -f logs/combined.log

# 只查看错误日志
tail -f logs/error.log
```

## 故障排除

### 问题1：浏览器找不到

```bash
# 安装 Playwright 内置浏览器
pnpm exec playwright install chromium
```

### 问题2：主项目连接失败

检查主项目是否可以访问：
```bash
curl https://www.cxyy.top
```

### 问题3：登录状态丢失

删除浏览器数据，重新登录：
```bash
rm -rf browser-data/
pnpm start
```

### 问题4：找不到"批量下载"按钮

增加操作延迟，编辑 `.env`：
```bash
SLOW_MO=200
```

## 目录说明

- `src/` - 源代码
- `logs/` - 日志文件
- `browser-data/` - 浏览器数据（包含登录状态，不要删除）
- `.env` - 配置文件（修改此文件来调整参数）
