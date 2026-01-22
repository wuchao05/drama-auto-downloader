import puppeteer from "puppeteer";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

/**
 * 延迟函数（替代已废弃的 page.waitForTimeout）
 * @param {number} ms - 延迟毫秒数
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 浏览器自动化类
 */
export class BrowserAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  /**
   * 初始化浏览器
   */
  async init() {
    logger.info("正在启动浏览器...");

    this.browser = await puppeteer.launch({
      headless: config.browser.headless,
      slowMo: config.browser.slowMo,
      userDataDir: config.browser.userDataDir,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--window-size=1280,800",
      ],
      defaultViewport: {
        width: 1280,
        height: 800,
      },
    });

    const pages = await this.browser.pages();
    this.page = pages[0] || (await this.browser.newPage());

    // 设置user agent，模拟真实浏览器
    await this.page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    logger.info("浏览器启动成功");
  }

  /**
   * 检查登录状态
   */
  async checkLoginStatus() {
    try {
      await this.page.goto(`${config.changduBaseUrl}/sale/short-play/list`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      await delay(2000);

      const currentUrl = this.page.url();
      const isLoginPage =
        currentUrl.includes("/login") || currentUrl.includes("/auth");

      if (isLoginPage) {
        logger.warn("未登录，请在浏览器中完成登录");
        return false;
      }

      logger.info("已登录常读后台");
      return true;
    } catch (error) {
      logger.error(`检查登录状态失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取Cookie
   */
  async getCookies() {
    if (!this.page) return [];
    return await this.page.cookies();
  }

  /**
   * 获取Cookie字符串（用于API调用）
   */
  async getCookieString() {
    const cookies = await this.getCookies();
    return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  }

  /**
   * 等待手动登录
   */
  async waitForManualLogin() {
    logger.info("请在打开的浏览器中完成登录...");
    logger.info("等待中...");

    await this.page.goto(`${config.changduBaseUrl}/login`, {
      waitUntil: "networkidle2",
    });

    // 等待导航到非登录页（说明登录成功）
    await this.page.waitForFunction(
      () => {
        return (
          !window.location.href.includes("/login") &&
          !window.location.href.includes("/auth")
        );
      },
      { timeout: 300000 }, // 5分钟超时
    );

    logger.info("登录成功！");
  }

  /**
   * 批量下载单个短剧
   * @param {string} dramaId - 短剧ID
   */
  async downloadDrama(dramaId) {
    try {
      logger.info(`开始处理短剧 ID: ${dramaId}`);

      // 1. 打开短剧详情页
      const dramaUrl = `${config.changduBaseUrl}/sale/short-play/list/detail?id=${dramaId}`;
      await this.page.goto(dramaUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      logger.info(`已打开短剧详情页: ${dramaUrl}`);

      // 等待页面加载（10秒）
      logger.info("等待页面完全加载...");
      await delay(10000);

      // 2. 查找并点击"批量下载"按钮
      logger.info('查找"批量下载"按钮...');

      // 使用 page.evaluate 查找并点击按钮
      const buttonClicked = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const downloadButton = buttons.find((btn) =>
          btn.textContent.includes("批量下载"),
        );

        if (downloadButton) {
          downloadButton.click();
          return true;
        }
        return false;
      });

      if (!buttonClicked) {
        throw new Error('未找到"批量下载"按钮');
      }

      logger.info('已点击"批量下载"按钮');

      // 等待弹窗出现（3秒）
      logger.info("等待弹窗加载...");
      await delay(3000);

      // 3. 在弹窗中查找并点击"确认"按钮
      logger.info('查找弹窗中的"确认"按钮...');

      // 使用 page.evaluate 查找并点击确认按钮
      const confirmClicked = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const confirmButton = buttons.find((btn) =>
          btn.textContent.includes("确认"),
        );

        if (confirmButton) {
          confirmButton.click();
          return true;
        }
        return false;
      });

      if (!confirmClicked) {
        throw new Error('未找到弹窗中的"确认"按钮');
      }

      logger.info('已点击"确认"按钮');

      // 等待请求完成
      await delay(2000);

      logger.info(`短剧 ${dramaId} 下载任务提交成功`);
      return true;
    } catch (error) {
      logger.error(`处理短剧 ${dramaId} 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 批量处理多个短剧
   * @param {string[]} dramaIds - 短剧ID数组
   */
  async processDramas(dramaIds) {
    if (!dramaIds || dramaIds.length === 0) {
      logger.info("没有需要处理的短剧");
      return;
    }

    logger.info(`开始批量处理 ${dramaIds.length} 个短剧`);

    const results = [];

    for (let i = 0; i < dramaIds.length; i++) {
      const dramaId = dramaIds[i];
      logger.info(`[${i + 1}/${dramaIds.length}] 处理短剧 ${dramaId}`);

      const success = await this.downloadDrama(dramaId);
      results.push({ dramaId, success });

      // 每个剧集之间间隔一段时间，避免请求过快
      if (i < dramaIds.length - 1) {
        const waitTime = 3000 + Math.random() * 2000; // 3-5秒随机间隔
        logger.info(`等待 ${Math.round(waitTime / 1000)} 秒后处理下一个...`);
        await delay(waitTime);
      }
    }

    // 统计结果
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    logger.info(`批量处理完成: 成功 ${successCount} 个, 失败 ${failCount} 个`);

    return results;
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.info("浏览器已关闭");
    }
  }
}
