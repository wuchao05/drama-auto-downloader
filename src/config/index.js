import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export const config = {
  // 主项目API
  mainProjectApi: process.env.MAIN_PROJECT_API || 'https://www.cxyy.top/api',

  // 常读后台
  changduBaseUrl: process.env.CHANGDU_BASE_URL || 'https://www.changdupingtai.com',

  // 调度配置
  cronSchedule: process.env.CRON_SCHEDULE || '*/30 * * * *', // 默认每30分钟
  batchSize: parseInt(process.env.BATCH_SIZE) || 6,

  // 浏览器配置
  browser: {
    headless: process.env.HEADLESS === 'true',
    slowMo: parseInt(process.env.SLOW_MO) || 100,
    userDataDir: process.env.BROWSER_USER_DATA_DIR || './browser-data',
    executablePath: process.env.BROWSER_EXECUTABLE_PATH || '',
  },

  // 下载中心专用请求头配置（与changdu-web项目保持一致）
  // downloadCenterHeaders: {
  //   appid: '40012555',
  //   apptype: '7',
  //   distributorid: '1842865091654731',
  //   Aduserid: '380892546610362', // 固定值
  //   Rootaduserid: '380892546610362', // 固定值
  //   Cookie:
  //     'passport_csrf_token=e4cee96ee2d47f041c28c5edae539ee1; passport_csrf_token_default=e4cee96ee2d47f041c28c5edae539ee1; is_staff_user=false; s_v_web_id=verify_mk3bqgnr_m1BdVQtY_arVx_4rwZ_9Ewp_lEmGHEHICRL3; n_mh=MPHRKGEs6Mdv8j9-lYQ_xItbJLeVCy02zT61y_-m6jI; sid_guard=31a1c5085b143864dd0c933027306eff%7C1767751522%7C5184000%7CSun%2C+08-Mar-2026+02%3A05%3A22+GMT; uid_tt=b5e008d28875d83fa3d174a3079dbcd7; uid_tt_ss=b5e008d28875d83fa3d174a3079dbcd7; sid_tt=31a1c5085b143864dd0c933027306eff; sessionid=31a1c5085b143864dd0c933027306eff; sessionid_ss=31a1c5085b143864dd0c933027306eff; session_tlb_tag=sttt%7C3%7CMaHFCFsUOGTdDJMwJzBu___________0_VKoYJur77X3WR8WCEkyyr-L3lJBsnhT_L597i8SCxk%3D; sid_ucp_v1=1.0.0-KDlmYjA1ZTc5ZTY2NWQxYzkyMTI4MmE0MTkyMGQ0NzAyYjBmNWRkMjYKFgi66cCnt81WEOL-9soGGKYMOAFA6gcaAmxmIiAzMWExYzUwODViMTQzODY0ZGQwYzkzMzAyNzMwNmVmZg; ssid_ucp_v1=1.0.0-KDlmYjA1ZTc5ZTY2NWQxYzkyMTI4MmE0MTkyMGQ0NzAyYjBmNWRkMjYKFgi66cCnt81WEOL-9soGGKYMOAFA6gcaAmxmIiAzMWExYzUwODViMTQzODY0ZGQwYzkzMzAyNzMwNmVmZg; loginType=0; adUserId=380892546610362; rootAdUserId=380892546610362; isUg=false; gfkadpd=4842%2C34653; allocateStatus=1; distributorId=0; isOaLinkedMpSecondLevel=false; isH5RevisitAppSecondLevel=false; isOaLinkedMpThirdLevel=false; isH5RevisitAppThirdLevel=false; enableQuickApp=true; enableWechatH5=false; enableWechatApp=false; enableDouYinMp=false; enableDouYinBookMp=false; enableDouYinFreeSeriesMp=false; enableDouYinVipStoryMp=false; tt_scid=rgK6Jf5jMAn8ggxWLkU-wDQAYFAmaOI2e8PbstQjr90e4UVBDab3.qgaKrpwgCc0f382',
  // },
  downloadCenterHeaders: {
    appid: '40011605',
    apptype: '7',
    distributorid: '1853736552241288',
    Aduserid: '1788276400733033', // 固定值
    Rootaduserid: '1853736552241304', // 固定值
    Cookie:
      'passport_csrf_token=9b6cad9b3155146a6a7d8118078ece15; passport_csrf_token_default=9b6cad9b3155146a6a7d8118078ece15; s_v_web_id=verify_mkavoz2i_lfTF8KKN_qlJY_4fmk_Bt7y_PNYkNQlaZKY0; n_mh=r6lptjBK7fwchm5wbX0n7fziWppDW5nX-eYOWMC2YtM; is_staff_user=false; sid_guard=9d6951e5cf59a66b0da060e4390c7478%7C1771220882%7C5184000%7CFri%2C+17-Apr-2026+05%3A48%3A02+GMT; uid_tt=88b2214defc6edef9da3083e3557d207; uid_tt_ss=88b2214defc6edef9da3083e3557d207; sid_tt=9d6951e5cf59a66b0da060e4390c7478; sessionid=9d6951e5cf59a66b0da060e4390c7478; sessionid_ss=9d6951e5cf59a66b0da060e4390c7478; session_tlb_tag=sttt%7C7%7CnWlR5c9ZpmsNoGDkOQx0eP________-peVPi7LrBZg9S7nOlU-5P8aIgRbKjGWZgCmUxbomzn-g%3D; sid_ucp_v1=1.0.0-KGZhYTBhZWY0OTAwNzc0OGE4M2I0YzI2MmY4YmQ3OGI4ZGM4YTljNWQKFwjp9oDd2M2WAxCS38rMBhimDDgBQOoHGgJsZiIgOWQ2OTUxZTVjZjU5YTY2YjBkYTA2MGU0MzkwYzc0Nzg; ssid_ucp_v1=1.0.0-KGZhYTBhZWY0OTAwNzc0OGE4M2I0YzI2MmY4YmQ3OGI4ZGM4YTljNWQKFwjp9oDd2M2WAxCS38rMBhimDDgBQOoHGgJsZiIgOWQ2OTUxZTVjZjU5YTY2YjBkYTA2MGU0MzkwYzc0Nzg; gfkadpd=4842,34653; tt_scid=Cc4sgP7fPMdzcVm0qjxi0sC7EgdwfVaYJIpJ2.L4cFM2-SrC4ulcpyxPpHWPSN8ga61c',
  },

  // 日志
  logLevel: process.env.LOG_LEVEL || 'info',
};
