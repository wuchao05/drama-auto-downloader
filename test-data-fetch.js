// 测试数据获取功能（需要主项目在运行）
import { fetchPendingDramaIds } from './src/services/dataFetcher.js'
import { logger } from './src/utils/logger.js'

async function testDataFetch() {
  console.log('开始测试数据获取功能...\n')

  try {
    const dramaIds = await fetchPendingDramaIds()

    console.log('\n测试结果：')
    console.log('='.repeat(60))
    console.log(`获取到 ${dramaIds.length} 个待处理短剧`)

    if (dramaIds.length > 0) {
      console.log('\n短剧ID列表：')
      dramaIds.forEach((id, index) => {
        console.log(`  ${index + 1}. ${id}`)
      })
    } else {
      console.log('\n当前没有需要处理的短剧')
    }

    console.log('='.repeat(60))
    console.log('\n✓ 数据获取功能正常\n')
  } catch (error) {
    console.error('\n✗ 数据获取失败:', error.message)
    console.error('\n请确保：')
    console.error('  1. 主项目服务可以访问（https://cxyy.top）')
    console.error('  2. .env 文件配置正确')
    console.error('  3. 网络连接正常')
    console.error('  4. 已经登录常读后台（服务需要Cookie认证）\n')
    process.exit(1)
  }
}

testDataFetch()
