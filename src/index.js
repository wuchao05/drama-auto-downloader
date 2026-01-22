import { Scheduler } from './scheduler.js'
import { logger } from './utils/logger.js'

// 创建调度器实例
const scheduler = new Scheduler()

// 启动服务
async function main() {
  try {
    await scheduler.start()
  } catch (error) {
    logger.error(`服务启动失败: ${error.message}`)
    process.exit(1)
  }
}

// 优雅退出
process.on('SIGINT', async () => {
  logger.info('收到退出信号，正在关闭服务...')
  await scheduler.stop()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('收到终止信号，正在关闭服务...')
  await scheduler.stop()
  process.exit(0)
})

// 启动
main()
