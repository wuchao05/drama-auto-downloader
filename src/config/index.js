import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export const config = {
  // 主项目API
  mainProjectApi: process.env.MAIN_PROJECT_API || 'https://www.cxyy.top/api',

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

  // 下载中心专用请求头配置（与changdu-web项目保持一致）
  downloadCenterHeaders: {
    appid: process.env.APPID || '40012555',
    apptype: process.env.APPTYPE || '7',
    distributorid: process.env.DISTRIBUTORID || '1853806262085748',
    Aduserid: process.env.ADUSERID || '1118645892943332',
    Cookie: process.env.DEFAULT_COOKIE || '',
  },

  // 日志
  logLevel: process.env.LOG_LEVEL || 'info',
};
