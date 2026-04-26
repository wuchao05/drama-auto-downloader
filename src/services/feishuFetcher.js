import axios from "axios";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

const FEISHU_BASE_URL = "https://open.feishu.cn/open-apis";
const STATUS_FIELD = "当前状态";
const DRAMA_ID_FIELD = "短剧ID";
const PENDING_STATUS = "待提交";
const DOWNLOADING_STATUS = "待下载";

function hasFeishuConfig() {
  return Boolean(
    config.feishu.appId && config.feishu.appSecret && config.feishu.appToken,
  );
}

async function fetchTenantAccessToken() {
  if (!hasFeishuConfig()) {
    throw new Error(
      "飞书配置不完整，请配置 FEISHU_APP_ID、FEISHU_APP_SECRET、FEISHU_APP_TOKEN",
    );
  }

  const response = await axios.post(
    `${FEISHU_BASE_URL}/auth/v3/tenant_access_token/internal`,
    {
      app_id: config.feishu.appId,
      app_secret: config.feishu.appSecret,
    },
    {
      timeout: 30000,
    },
  );

  if (response.data?.code !== 0) {
    throw new Error(response.data?.msg || "获取 tenant_access_token 失败");
  }

  const token = response.data?.tenant_access_token;
  if (!token) {
    throw new Error("飞书 token 响应中缺少 tenant_access_token");
  }

  return token;
}

function normalizeDramaId(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeDramaId(item)).join("").trim();
  }

  if (value && typeof value === "object") {
    for (const key of ["text", "name", "value", "link", "url"]) {
      const normalized = normalizeDramaId(value[key]);
      if (normalized) {
        return normalized;
      }
    }

    return "";
  }

  return String(value || "").trim();
}

function isValidDramaId(dramaId) {
  return Boolean(dramaId && dramaId !== "[object Object]");
}

async function searchPendingRecordsInTable(tenantAccessToken, tableId) {
  const records = [];
  let pageToken = "";

  do {
    const response = await axios.post(
      `${FEISHU_BASE_URL}/bitable/v1/apps/${config.feishu.appToken}/tables/${tableId}/records/search`,
      {
        filter: {
          conjunction: "and",
          conditions: [
            {
              field_name: STATUS_FIELD,
              operator: "is",
              value: [PENDING_STATUS],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${tenantAccessToken}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        params: {
          page_size: 100,
          ...(pageToken ? { page_token: pageToken } : {}),
        },
        timeout: 30000,
      },
    );

    if (response.data?.code !== 0) {
      throw new Error(response.data?.msg || "查询飞书状态表失败");
    }

    const data = response.data?.data || {};
    records.push(...(data.items || []));
    pageToken = data.has_more ? data.page_token || "" : "";
  } while (pageToken);

  return records;
}

export async function fetchFeishuPendingDramas() {
  if (!hasFeishuConfig()) {
    logger.warn("飞书配置不完整，跳过飞书待提交任务查询");
    return [];
  }

  const tenantAccessToken = await fetchTenantAccessToken();
  const pendingDramas = [];

  logger.info("开始查询飞书状态表中的待提交短剧");

  for (const tableId of config.feishu.statusTableIds) {
    try {
      const records = await searchPendingRecordsInTable(tenantAccessToken, tableId);
      logger.info(`飞书状态表 ${tableId} 查询到 ${records.length} 条待提交记录`);

      for (const record of records) {
        const dramaId = normalizeDramaId(record.fields?.[DRAMA_ID_FIELD]);

        if (!isValidDramaId(dramaId)) {
          logger.warn(
            `飞书记录短剧ID无效，跳过: table=${tableId}, record=${record.record_id}, raw=${JSON.stringify(record.fields?.[DRAMA_ID_FIELD])}`,
          );
          continue;
        }

        pendingDramas.push({
          dramaId,
          tableId,
          recordId: record.record_id,
          tenantAccessToken,
        });
      }
    } catch (error) {
      logger.error(`查询飞书状态表失败: table=${tableId}, error=${error.message}`);
    }
  }

  logger.info(`飞书待提交短剧合计 ${pendingDramas.length} 个`);

  return pendingDramas;
}

export async function markFeishuDramaAsDownloading(task) {
  if (!task?.tenantAccessToken || !task.tableId || !task.recordId) {
    throw new Error("飞书任务缺少更新所需信息");
  }

  const response = await axios.put(
    `${FEISHU_BASE_URL}/bitable/v1/apps/${config.feishu.appToken}/tables/${task.tableId}/records/${task.recordId}`,
    {
      fields: {
        [STATUS_FIELD]: DOWNLOADING_STATUS,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${task.tenantAccessToken}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      timeout: 30000,
    },
  );

  if (response.data?.code !== 0) {
    throw new Error(response.data?.msg || "更新飞书状态失败");
  }
}
