import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

export const config = {
  // 主项目API
  mainProjectApi: process.env.MAIN_PROJECT_API || "https://www.cxyy.top/api",

  // 常读后台
  changduBaseUrl:
    process.env.CHANGDU_BASE_URL || "https://www.changdupingtai.com",

  // 调度配置
  cronSchedule: process.env.CRON_SCHEDULE || "*/30 * * * *", // 默认每30分钟
  batchSize: parseInt(process.env.BATCH_SIZE) || 6,

  // 浏览器配置
  browser: {
    headless: process.env.HEADLESS === "true",
    slowMo: parseInt(process.env.SLOW_MO) || 100,
    userDataDir: "./browser-data",
  },

  // 下载中心专用请求头配置（与changdu-web项目保持一致）
  downloadCenterHeaders: {
    appid: "40012555",
    apptype: "7",
    distributorid: "1842865091654731",
    Aduserid: "380892546610362", // 固定值
    Rootaduserid: "380892546610362", // 固定值
    Cookie:
      "passport_csrf_token=e4cee96ee2d47f041c28c5edae539ee1; passport_csrf_token_default=e4cee96ee2d47f041c28c5edae539ee1; is_staff_user=false; s_v_web_id=verify_mk3bqgnr_m1BdVQtY_arVx_4rwZ_9Ewp_lEmGHEHICRL3; n_mh=MPHRKGEs6Mdv8j9-lYQ_xItbJLeVCy02zT61y_-m6jI; sid_guard=31a1c5085b143864dd0c933027306eff%7C1767751522%7C5184000%7CSun%2C+08-Mar-2026+02%3A05%3A22+GMT; uid_tt=b5e008d28875d83fa3d174a3079dbcd7; uid_tt_ss=b5e008d28875d83fa3d174a3079dbcd7; sid_tt=31a1c5085b143864dd0c933027306eff; sessionid=31a1c5085b143864dd0c933027306eff; sessionid_ss=31a1c5085b143864dd0c933027306eff; session_tlb_tag=sttt%7C3%7CMaHFCFsUOGTdDJMwJzBu___________0_VKoYJur77X3WR8WCEkyyr-L3lJBsnhT_L597i8SCxk%3D; sid_ucp_v1=1.0.0-KDlmYjA1ZTc5ZTY2NWQxYzkyMTI4MmE0MTkyMGQ0NzAyYjBmNWRkMjYKFgi66cCnt81WEOL-9soGGKYMOAFA6gcaAmxmIiAzMWExYzUwODViMTQzODY0ZGQwYzkzMzAyNzMwNmVmZg; ssid_ucp_v1=1.0.0-KDlmYjA1ZTc5ZTY2NWQxYzkyMTI4MmE0MTkyMGQ0NzAyYjBmNWRkMjYKFgi66cCnt81WEOL-9soGGKYMOAFA6gcaAmxmIiAzMWExYzUwODViMTQzODY0ZGQwYzkzMzAyNzMwNmVmZg; loginType=0; adUserId=380892546610362; rootAdUserId=380892546610362; isUg=false; gfkadpd=4842%2C34653; allocateStatus=1; distributorId=0; isOaLinkedMpSecondLevel=false; isH5RevisitAppSecondLevel=false; isOaLinkedMpThirdLevel=false; isH5RevisitAppThirdLevel=false; enableQuickApp=true; enableWechatH5=false; enableWechatApp=false; enableDouYinMp=false; enableDouYinBookMp=false; enableDouYinFreeSeriesMp=false; enableDouYinVipStoryMp=false; tt_scid=rgK6Jf5jMAn8ggxWLkU-wDQAYFAmaOI2e8PbstQjr90e4UVBDab3.qgaKrpwgCc0f382",
  },

  // 日志
  logLevel: process.env.LOG_LEVEL || "info",
};
