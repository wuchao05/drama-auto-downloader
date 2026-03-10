import axios from "axios";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import { config, getDownloadCenterHeaders } from "../config/index.js";
import { logger } from "../utils/logger.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const CHANGDU_SERIES_LIST_PATH =
  "/novelsale/distributor/content/series/list/v1/";
const CHANGDU_SERIES_PAGE_SIZE = 100;
const CHANGDU_SERIES_PAGE_INDEXES = [1, 2];
const FIXED_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36";

/**
 * 全局Cookie存储（从浏览器获取）
 */
let globalCookie = "";

/**
 * 设置全局Cookie
 * @param {string} cookie - Cookie字符串
 */
export function setGlobalCookie(cookie) {
  globalCookie = cookie;
}

/**
 * 获取需要处理的短剧ID列表
 * @returns {Promise<string[]>} 短剧ID数组
 */
export async function fetchPendingDramaIds() {
  try {
    logger.info("开始获取待处理剧集...");

    // 1. 获取今天、明天、后天的剧集列表
    const dramaList = await fetchDramaList();
    logger.info(`获取到 ${dramaList.length} 个剧集`);

    // 2. 获取下载任务列表
    const downloadTasks = await fetchDownloadTasks();
    logger.info(`获取到 ${downloadTasks.length} 个下载任务`);

    // 3. 筛选出没有下载任务或下载失败的剧集
    const pendingDramas = filterPendingDramas(dramaList, downloadTasks);
    logger.info(`筛选出 ${pendingDramas.length} 个待处理剧集`);

    // 打印所有待处理剧集的信息
    if (pendingDramas.length > 0) {
      logger.info("待处理剧集列表（排序前）:");
      pendingDramas.forEach((drama, index) => {
        const publishDate = dayjs(drama.publish_time)
          .tz("Asia/Shanghai")
          .format("YYYY-MM-DD HH:mm");
        logger.info(
          `  ${index + 1}. ${drama.series_name} (发布时间: ${publishDate})`,
        );
      });
    }

    // 4. 按照发布时间排序：今天 > 明天 > 后天
    const sortedDramas = sortDramasByPublishTime(pendingDramas);

    // 5. 只取前N个（配置的批次大小）
    const batchDramas = sortedDramas.slice(0, config.batchSize);
    const dramaIds = batchDramas.map((d) => d.book_id);

    // 打印详细的处理剧集信息
    logger.info(
      `\n本次将处理 ${batchDramas.length} 个剧集（按优先级排序：今天 > 明天 > 后天）:`,
    );
    batchDramas.forEach((drama, index) => {
      const now = dayjs().tz("Asia/Shanghai");
      const today = now.startOf("day");
      const tomorrow = today.add(1, "day");
      const publishTime = dayjs(drama.publish_time).tz("Asia/Shanghai");
      const publishDate = publishTime.startOf("day");

      let dayLabel = "";
      if (publishDate.isSame(today, "day")) {
        dayLabel = "【今天】";
      } else if (publishDate.isSame(tomorrow, "day")) {
        dayLabel = "【明天】";
      } else {
        dayLabel = "【后天】";
      }

      const publishDateStr = publishTime.format("YYYY-MM-DD HH:mm");
      logger.info(
        `  ${index + 1}. ${dayLabel} ${drama.series_name} (ID: ${drama.book_id}, 发布时间: ${publishDateStr})`,
      );
    });

    return dramaIds;
  } catch (error) {
    logger.error(`获取待处理剧集失败: ${error.message}`);
    throw error;
  }
}

/**
 * 获取今天、明天、后天的剧集列表
 */
async function fetchDramaList() {
  const now = dayjs().tz("Asia/Shanghai");
  const today = now.startOf("day");
  const tomorrow = today.add(1, "day");
  const dayAfterTomorrow = today.add(2, "day");

  logger.info(
    `并行请求剧集列表页: ${CHANGDU_SERIES_PAGE_INDEXES.join(", ")}，每页 ${CHANGDU_SERIES_PAGE_SIZE} 条`,
  );
  const pageResults = await Promise.all(
    CHANGDU_SERIES_PAGE_INDEXES.map((pageIndex) => fetchDramaPage(pageIndex)),
  );
  const allResults = pageResults.flat();

  // 去重
  const uniqueDramas = deduplicateDramas(allResults);

  // 过滤：审核通过 + 集数>=40
  const filteredDramas = uniqueDramas.filter((drama) => {
    return drama.dy_audit_status === 3 && drama.episode_amount >= 40;
  });

  // 过滤出今天、明天、后天的剧集
  const targetDramas = filteredDramas.filter((drama) => {
    if (!drama.publish_time) return false;

    const publishTime = dayjs(drama.publish_time).tz("Asia/Shanghai");
    const publishDate = publishTime.startOf("day");

    return (
      publishDate.isSame(today, "day") ||
      publishDate.isSame(tomorrow, "day") ||
      publishDate.isSame(dayAfterTomorrow, "day")
    );
  });

  return targetDramas;
}

/**
 * 获取单页剧集数据
 * 直接从常读平台API获取剧集列表，不依赖飞书表
 */
async function fetchDramaPage(pageIndex) {
  const requestUrl = await buildChangduSeriesRequestUrl(pageIndex);

  logger.info(`请求剧集列表: 第${pageIndex}页`);

  try {
    const headers = await buildChangduSeriesHeaders();
    logger.info(`请求URL: ${requestUrl}`);
    logger.info(
      `剧集列表请求头: ${JSON.stringify(headers, null, 2)}`,
    );

    const response = await axios.get(requestUrl, {
      headers,
      timeout: 30000,
    });

    logger.info(`API响应状态: ${response.status}`);
    logger.info(
      `响应code: ${response.data?.code}, message: ${response.data?.message}`,
    );

    if (
      typeof response.data === "string" &&
      response.data.trim().length === 0
    ) {
      throw new Error(
        "常读内部接口返回空响应，请检查 Cookie 是否有效，或确认当前主体是否有权限访问该接口",
      );
    }

    if (response.data.code !== 0) {
      throw new Error(
        `获取剧集列表失败: ${response.data.message || "未知错误"}`,
      );
    }

    const dramaData = response.data.data?.data || [];
    logger.info(`第${pageIndex}页获取到 ${dramaData.length} 个剧集`);

    return dramaData;
  } catch (error) {
    logger.error(`请求失败: ${error.message}`);
    if (error.response) {
      logger.error(`响应状态: ${error.response.status}`);
      logger.error(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`获取剧集列表失败: ${error.message}`);
  }
}

/**
 * 构建常读剧集列表请求头
 */
async function buildChangduSeriesHeaders() {
  const {
    appid,
    apptype,
    distributorid,
    aduserid,
    Aduserid,
    Cookie,
  } = await getDownloadCenterHeaders();
  const resolvedCookie = Cookie || "";
  const resolvedAdUserId = aduserid || Aduserid || "";

  if (resolvedCookie) {
    logger.info(`使用配置中的常读后台Cookie (长度: ${resolvedCookie.length})`);
  } else {
    logger.warn("常读后台Cookie为空，剧集列表请求可能失败");
  }

  return {
    Cookie: resolvedCookie,
    aduserid: String(resolvedAdUserId),
    "agw-js-conv": "str",
    appid: String(appid),
    apptype: String(apptype),
    distributorid: String(distributorid),
    "user-agent": FIXED_USER_AGENT,
    Accept: "application/json, text/plain, */*",
  };
}

/**
 * 构建常读剧集列表查询参数
 */
function buildChangduSeriesQuery(pageIndex) {
  return [
    ["permission_statuses", "3,4"],
    ["sort_type", "1"],
    ["sort_field", "3"],
    ["aweme_user_new_version", "false"],
    ["page_index", String(pageIndex)],
    ["page_size", String(CHANGDU_SERIES_PAGE_SIZE)],
  ];
}

/**
 * 构建与主项目一致的常读剧集列表请求URL
 */
async function buildChangduSeriesRequestUrl(pageIndex) {
  const params = Object.fromEntries(buildChangduSeriesQuery(pageIndex));
  const { requestPath, encodedABogus } = await generateChangduABogus(params);
  const separator = requestPath.includes("?") ? "&" : "?";

  return `${config.changduBaseUrl}${requestPath}${separator}a_bogus=${encodedABogus}`;
}

/**
 * 调用服务端接口生成与主项目一致的 a_bogus 结果
 */
async function generateChangduABogus(params) {
  const url = `${config.changduBaseUrl}${CHANGDU_SERIES_LIST_PATH}`;

  try {
    const response = await axios.post(
      `${config.mainProjectApi}/novelsale/a-bogus`,
      {
        method: "GET",
        url,
        params,
      },
      {
        headers: await buildABogusHeaders(),
        timeout: 30000,
      },
    );

    if (response.data?.code !== 0) {
      throw new Error(response.data?.message || "a_bogus 服务返回失败");
    }

    const requestPath = response.data?.data?.request_path || "";
    const encodedABogus = response.data?.data?.encoded_a_bogus || "";

    if (!requestPath || !encodedABogus) {
      throw new Error("a_bogus 生成结果不完整");
    }

    return {
      requestPath,
      encodedABogus,
    };
  } catch (error) {
    throw new Error(`生成 a_bogus 失败: ${error.message}`);
  }
}

/**
 * 构建 a_bogus 服务请求头
 */
async function buildABogusHeaders() {
  const {
    appid,
    distributorid,
    aduserid,
    Aduserid,
  } = await getDownloadCenterHeaders();
  const resolvedAdUserId = aduserid || Aduserid || "";

  return {
    appid: String(appid),
    aduserid: String(resolvedAdUserId),
    distributorid: String(distributorid),
    "Content-Type": "application/json",
  };
}

/**
 * 获取下载任务列表
 * 注意：此接口使用下载中心专用的headers，不依赖浏览器cookie
 */
async function fetchDownloadTasks() {
  const now = dayjs().tz("Asia/Shanghai");
  const startTime = Math.floor(now.subtract(30, "day").valueOf() / 1000);
  const endTime = Math.floor(now.add(30, "day").valueOf() / 1000);

  const url = `${config.changduBaseUrl}/node/api/platform/distributor/download_center/task_list`;

  logger.info(`请求下载任务列表: ${url}`);
    logger.info("使用下载中心专用headers");

  try {
    // 使用下载中心专用的请求头配置
    const headers = {
      ...(await getDownloadCenterHeaders()),
    };

    // 打印Cookie长度用于调试
    if (headers.Cookie) {
      logger.info(`使用下载中心专用Cookie (长度: ${headers.Cookie.length})`);
    } else {
      logger.warn("下载中心专用Cookie未配置，请检查环境变量DEFAULT_COOKIE");
    }

    const response = await axios.get(url, {
      params: {
        start_time: startTime,
        end_time: endTime,
        page_index: 0,
        page_size: 20000,
      },
      headers,
      timeout: 30000,
    });

    logger.info(`下载任务API响应状态: ${response.status}`);
    logger.info(`响应code: ${response.data?.code}`);

    if (response.data.code !== 0) {
      throw new Error(
        `获取下载任务列表失败: ${response.data.message || "未知错误"}`,
      );
    }

    const tasks = response.data.data || [];
    logger.info(`获取到 ${tasks.length} 个下载任务`);

    return tasks;
  } catch (error) {
    logger.error(`请求下载任务失败: ${error.message}`);
    if (error.response) {
      logger.error(`响应状态: ${error.response.status}`);
      logger.error(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`获取下载任务列表失败: ${error.message}`);
  }
}

/**
 * 去重剧集（根据book_id）
 */
function deduplicateDramas(dramas) {
  const seen = new Set();
  return dramas.filter((drama) => {
    if (seen.has(drama.book_id)) {
      return false;
    }
    seen.add(drama.book_id);
    return true;
  });
}

/**
 * 按发布时间排序剧集：今天 > 明天 > 后天
 * 同一天内按照发布时间升序排列
 */
function sortDramasByPublishTime(dramas) {
  const now = dayjs().tz("Asia/Shanghai");
  const today = now.startOf("day");
  const tomorrow = today.add(1, "day");
  const dayAfterTomorrow = today.add(2, "day");

  return dramas.slice().sort((a, b) => {
    const aPublishTime = dayjs(a.publish_time).tz("Asia/Shanghai");
    const bPublishTime = dayjs(b.publish_time).tz("Asia/Shanghai");
    const aPublishDate = aPublishTime.startOf("day");
    const bPublishDate = bPublishTime.startOf("day");

    // 判断是今天、明天还是后天
    const aIsToday = aPublishDate.isSame(today, "day");
    const aIsTomorrow = aPublishDate.isSame(tomorrow, "day");
    const bIsToday = bPublishDate.isSame(today, "day");
    const bIsTomorrow = bPublishDate.isSame(tomorrow, "day");

    // 优先级：今天 > 明天 > 后天
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    if (aIsTomorrow && !bIsTomorrow && !bIsToday) return -1;
    if (!aIsTomorrow && bIsTomorrow && !aIsToday) return 1;

    // 同一天内，按照发布时间升序
    return aPublishTime.valueOf() - bPublishTime.valueOf();
  });
}

/**
 * 筛选出待处理的剧集
 * 条件：没有下载任务 或 下载任务状态为失败(3)
 */
function filterPendingDramas(dramaList, downloadTasks) {
  // 创建剧名到下载任务的映射
  const taskMap = new Map();
  downloadTasks.forEach((task) => {
    const name = task.book_name?.trim();
    if (name) {
      const existing = taskMap.get(name);

      // 如果有多个任务，优先级：成功(2) > 处理中(1) > 失败(3) > 待处理(0)
      // 只要有一个成功或处理中的任务，就不需要重新下载
      if (!existing) {
        taskMap.set(name, task);
      } else {
        // 如果新任务是成功(2)或处理中(1)，替换现有任务
        if (task.task_status === 2 || task.task_status === 1) {
          taskMap.set(name, task);
        }
        // 如果现有任务是失败(3)或待处理(0)，但新任务状态更好，也替换
        else if (
          (existing.task_status === 3 || existing.task_status === 0) &&
          task.task_status > existing.task_status
        ) {
          taskMap.set(name, task);
        }
      }
    }
  });

  // 筛选剧集
  return dramaList.filter((drama) => {
    const name = drama.series_name?.trim();
    if (!name) return false;

    const task = taskMap.get(name);

    // 没有下载任务，或者任务状态为失败(3)或待处理(0)
    // 如果任务状态是成功(2)或处理中(1)，则不需要重新下载
    if (!task || task.task_status === 3 || task.task_status === 0) {
      return true;
    }

    return false;
  });
}
