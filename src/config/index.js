import axios from 'axios';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

let remoteChangduConfigPromise = null;

function readEnvChangduHeaders() {
  return {
    appid: process.env.APPID || '',
    apptype: process.env.APPTYPE || '7',
    distributorid: process.env.DISTRIBUTORID || '',
    Aduserid: process.env.ADUSERID || '',
    Rootaduserid: process.env.ROOT_ADUSERID || '',
    Cookie: process.env.DEFAULT_COOKIE || '',
  };
}

function hasRequiredHeaders(headers) {
  return Boolean(
    headers.appid &&
      headers.distributorid &&
      headers.Aduserid &&
      headers.Cookie,
  );
}

async function fetchRemoteChangduHeaders(mainProjectApi) {
  const response = await axios.get(`${mainProjectApi}/public/download-center/default`, {
    timeout: 30000,
  });

  if (response.data?.code !== 0) {
    throw new Error(response.data?.message || '获取远程配置失败');
  }

  const remote = response.data?.data;

  if (!remote) {
    throw new Error('远程配置中缺少下载中心默认配置');
  }

  return {
    appid: String(remote.appId || ''),
    apptype: String(remote.appType || process.env.APPTYPE || '7'),
    distributorid: String(remote.distributorId || ''),
    Aduserid: String(remote.adUserId || ''),
    Rootaduserid: String(remote.rootAdUserId || remote.adUserId || ''),
    Cookie: String(remote.cookie || ''),
  };
}

export const config = {
  // 主项目API
  mainProjectApi: process.env.MAIN_PROJECT_API || 'https://cxyy.top/api',

  // 常读后台
  changduBaseUrl: process.env.CHANGDU_BASE_URL || 'https://www.changdupingtai.com',

  // 调度配置
  cronSchedule: process.env.CRON_SCHEDULE || '*/10 * * * *', // 默认每10分钟
  batchSize: parseInt(process.env.BATCH_SIZE) || 6,

  // 浏览器配置
  browser: {
    headless: process.env.HEADLESS === 'true',
    slowMo: parseInt(process.env.SLOW_MO) || 100,
    userDataDir: './browser-data',
  },

  // 飞书状态表配置
  feishu: {
    appId: process.env.FEISHU_APP_ID || '',
    appSecret: process.env.FEISHU_APP_SECRET || '',
    appToken: process.env.FEISHU_APP_TOKEN || '',
    statusTableIds: [
      'tblDOyi2Lzs80sv0',
      'tbl2kpgxsb9i9tkC',
      'tblYdtIXzH61XNIk',
      'tbllfhvbuh475X9K',
      'tblg78rCpr7h3IRD',
    ],
  },

  // 下载中心专用请求头配置（与changdu-web项目保持一致）
  downloadCenterHeaders: readEnvChangduHeaders(),

  // 日志
  logLevel: process.env.LOG_LEVEL || 'info',
};

export async function getDownloadCenterHeaders() {
  const envHeaders = readEnvChangduHeaders();

  if (!remoteChangduConfigPromise) {
    remoteChangduConfigPromise = fetchRemoteChangduHeaders(config.mainProjectApi);
  }

  try {
    const remoteHeaders = await remoteChangduConfigPromise;

    return {
      appid: remoteHeaders.appid || envHeaders.appid,
      apptype: remoteHeaders.apptype || envHeaders.apptype,
      distributorid: remoteHeaders.distributorid || envHeaders.distributorid,
      Aduserid: remoteHeaders.Aduserid || envHeaders.Aduserid,
      Rootaduserid: remoteHeaders.Rootaduserid || envHeaders.Rootaduserid,
      Cookie: remoteHeaders.Cookie || envHeaders.Cookie,
    };
  } catch (error) {
    remoteChangduConfigPromise = null;

    if (hasRequiredHeaders(envHeaders)) {
      return envHeaders;
    }

    throw new Error(`获取下载中心请求头配置失败: ${error.message}`);
  }
}
