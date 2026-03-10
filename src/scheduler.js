import cron from "node-cron";
import { fetchPendingDramaIds } from "./services/dataFetcher.js";
import { BrowserAutomation } from "./services/browserAutomation.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";

/**
 * 调度器类
 */
export class Scheduler {
  constructor() {
    this.task = null;
    this.isRunning = false;
    this.browserAutomation = null;
  }

  /**
   * 启动调度器
   */
  async start() {
    logger.info("=".repeat(60));
    logger.info("短剧自动下载服务启动");
    logger.info(`调度时间: ${config.cronSchedule}`);
    logger.info(`批次大小: ${config.batchSize} 个短剧`);
    // logger.info(`当前主体: ${config.currentSubject}`)
    logger.info(`浏览器模式: ${config.browser.headless ? "无头" : "有头"}`);
    logger.info("=".repeat(60));

    // 初始化浏览器
    this.browserAutomation = new BrowserAutomation();
    await this.browserAutomation.init();

    // 检查登录状态
    const isLoggedIn = await this.browserAutomation.checkLoginStatus();

    if (!isLoggedIn) {
      logger.warn("需要登录，等待手动登录...");
      await this.browserAutomation.waitForManualLogin();
    }

    // 立即执行一次
    logger.info("立即执行一次任务...");
    await this.executeTask();

    // 设置定时任务
    this.task = cron.schedule(config.cronSchedule, async () => {
      logger.info("定时任务触发");
      await this.executeTask();
    });

    logger.info("调度器已启动，等待定时任务执行...");
  }

  /**
   * 执行任务
   */
  async executeTask() {
    if (this.isRunning) {
      logger.warn("上一次任务还在执行中，跳过本次执行");
      return;
    }

    this.isRunning = true;

    try {
      logger.info("=".repeat(60));
      logger.info("开始执行自动下载任务");
      logger.info(`执行时间: ${new Date().toLocaleString("zh-CN")}`);
      logger.info("=".repeat(60));

      // 1. 获取待处理的短剧ID
      const dramaIds = await fetchPendingDramaIds();

      if (dramaIds.length === 0) {
        logger.info("没有需要处理的短剧，本次任务结束");
        return;
      }

      // 2. 执行浏览器自动化下载
      await this.browserAutomation.processDramas(dramaIds);

      logger.info("=".repeat(60));
      logger.info("任务执行完成");
      logger.info("=".repeat(60));
    } catch (error) {
      logger.error(`任务执行失败: ${error.message}`);
      logger.error(error.stack);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 停止调度器
   */
  async stop() {
    logger.info("正在停止调度器...");

    if (this.task) {
      this.task.stop();
      logger.info("定时任务已停止");
    }

    if (this.browserAutomation) {
      await this.browserAutomation.close();
    }

    logger.info("调度器已停止");
  }
}
