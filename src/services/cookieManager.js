import { logger } from "../utils/logger.js";

/**
 * Cookie 管理器
 * 用于在服务器环境下直接注入 Cookie，避免手动登录
 */
export class CookieManager {
  /**
   * 从 Cookie 字符串解析为 Playwright 格式
   * @param {string} cookieString - Cookie 字符串，格式: "name1=value1; name2=value2"
   * @param {string} domain - Cookie 所属域名
   * @returns {Array} Playwright Cookie 对象数组
   */
  static parseCookieString(cookieString, domain = ".changdupingtai.com") {
    if (!cookieString || cookieString.trim() === "") {
      return [];
    }

    const cookies = [];
    const pairs = cookieString.split(";");

    for (const pair of pairs) {
      const [name, ...valueParts] = pair.trim().split("=");
      const value = valueParts.join("="); // 处理 value 中可能包含 = 的情况

      if (name && value) {
        cookies.push({
          name: name.trim(),
          value: value.trim(),
          domain: domain,
          path: "/",
          httpOnly: false,
          secure: true,
          sameSite: "Lax",
        });
      }
    }

    return cookies;
  }

  /**
   * 将 Cookie 注入到浏览器上下文
   * @param {BrowserContext} context - Playwright 浏览器上下文
   * @param {string} cookieString - Cookie 字符串
   * @param {string} domain - Cookie 所属域名
   */
  static async injectCookies(
    context,
    cookieString,
    domain = ".changdupingtai.com",
  ) {
    try {
      const cookies = this.parseCookieString(cookieString, domain);

      if (cookies.length === 0) {
        logger.warn("没有可注入的 Cookie");
        return false;
      }

      await context.addCookies(cookies);
      logger.info(`成功注入 ${cookies.length} 个 Cookie`);
      return true;
    } catch (error) {
      logger.error(`注入 Cookie 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 从环境变量读取并注入 Cookie
   * @param {BrowserContext} context - Playwright 浏览器上下文
   * @param {string} envCookieString - 环境变量中的 Cookie 字符串
   */
  static async injectFromEnv(context, envCookieString) {
    if (!envCookieString || envCookieString === "你的Cookie字符串") {
      logger.warn("未配置 CHANGDU_COOKIE 环境变量，将需要手动登录");
      return false;
    }

    return await this.injectCookies(context, envCookieString);
  }
}
