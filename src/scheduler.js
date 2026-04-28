import cron from "node-cron";
import { fetchPendingDramaIds } from "./services/dataFetcher.js";
import {
  fetchFeishuPendingDramas,
  markFeishuDramaAsDownloading,
} from "./services/feishuFetcher.js";
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

      // 1. 优先获取用户飞书状态表中的待提交短剧
      const feishuTasks = await this.fetchPriorityFeishuTasks();
      const { selectedFeishuTasks, feishuDramaIds } = this.selectFeishuTasks(feishuTasks);
      const remainingBatchSize = config.batchSize - feishuDramaIds.length;

      if (selectedFeishuTasks.length > 0) {
        logger.info(`本轮优先处理飞书待提交短剧 ${selectedFeishuTasks.length} 个`);
      }

      // 2. 飞书任务不足批次上限时，使用原常读流程补足剩余额度
      const normalDramaIds =
        remainingBatchSize > 0
          ? await fetchPendingDramaIds({
              limit: remainingBatchSize,
              excludeIds: feishuDramaIds,
            })
          : [];

      const dramaIds = [...feishuDramaIds, ...normalDramaIds];

      if (dramaIds.length === 0) {
        logger.info("没有需要处理的短剧，本次任务结束");
        return;
      }

      // 3. 执行浏览器自动化下载
      const results = await this.browserAutomation.processDramas(dramaIds);

      // 4. 飞书来源任务提交成功后，更新状态为待下载
      await this.updateCompletedFeishuTasks(selectedFeishuTasks, results);

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

  async fetchPriorityFeishuTasks() {
    try {
      return await fetchFeishuPendingDramas();
    } catch (error) {
      logger.error(`获取飞书待提交短剧失败，将继续执行常读正常流程: ${error.message}`);
      return [];
    }
  }

  selectFeishuTasks(feishuTasks) {
    const selectedDramaIdSet = new Set();
    const feishuDramaIds = [];

    for (const task of feishuTasks) {
      const dramaId = String(task.dramaId);
      if (selectedDramaIdSet.has(dramaId)) {
        continue;
      }

      selectedDramaIdSet.add(dramaId);
      feishuDramaIds.push(task.dramaId);

      if (feishuDramaIds.length >= config.batchSize) {
        break;
      }
    }

    const selectedFeishuTasks = feishuTasks.filter((task) =>
      selectedDramaIdSet.has(String(task.dramaId)),
    );

    return { selectedFeishuTasks, feishuDramaIds };
  }

  async updateCompletedFeishuTasks(feishuTasks, results) {
    if (!feishuTasks.length || !results?.length) {
      return;
    }

    const successfulDramaIds = new Set(
      results
        .filter((result) => result.success)
        .map((result) => String(result.dramaId)),
    );

    for (const task of feishuTasks) {
      if (!successfulDramaIds.has(String(task.dramaId))) {
        logger.warn(`飞书短剧 ${task.dramaId} 未提交成功，保持待提交状态`);
        continue;
      }

      try {
        await markFeishuDramaAsDownloading(task);
        logger.info(`飞书记录已更新为待下载: dramaId=${task.dramaId}, record=${task.recordId}`);
      } catch (error) {
        logger.error(
          `更新飞书记录状态失败: dramaId=${task.dramaId}, record=${task.recordId}, error=${error.message}`,
        );
      }
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
