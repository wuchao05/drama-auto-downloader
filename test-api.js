// 测试API连接
import axios from 'axios'

const baseUrl = 'https://www.cxyy.top/api'

async function testApis() {
  console.log('测试 API 连接...\n')

  // 1. 测试剧集列表API
  console.log('1. 测试剧集列表API')
  console.log(`URL: ${baseUrl}/novelsale/distributor/content/series/list/v1`)

  try {
    const response = await axios.get(
      `${baseUrl}/novelsale/distributor/content/series/list/v1`,
      {
        params: {
          page_size: 10,
          permission_statuses: '3,4',
          page_index: 0,
          // 不传 drama_list_table_id，直接从常读平台获取所有剧集
        },
        timeout: 10000,
      }
    )

    console.log(`✓ 状态码: ${response.status}`)
    console.log(`✓ 响应类型: ${typeof response.data}`)
    console.log(`✓ 响应是否为对象: ${typeof response.data === 'object'}`)
    console.log(`✓ 响应keys:`, Object.keys(response.data || {}).slice(0, 10))
    console.log(`✓ 响应前500字符:`, String(response.data).substring(0, 500))
    console.log(`✓ 响应code: ${response.data?.code}`)
    console.log(`✓ 响应message: ${response.data?.message}`)
    console.log(`✓ 数据条数: ${response.data?.data?.data?.length || 0}`)

    if (response.data?.data?.data?.[0]) {
      const firstDrama = response.data.data.data[0]
      console.log(`✓ 第一条数据: ${firstDrama.series_name} (ID: ${firstDrama.book_id})`)
    }
  } catch (error) {
    console.log(`✗ 失败: ${error.message}`)
    if (error.response) {
      console.log(`  状态码: ${error.response.status}`)
      console.log(`  响应: ${JSON.stringify(error.response.data, null, 2)}`)
    }
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // 2. 测试下载任务列表API
  console.log('2. 测试下载任务列表API')
  console.log(`URL: ${baseUrl}/node/api/platform/distributor/download_center/task_list`)

  const now = Date.now()
  const startTime = Math.floor((now - 30 * 24 * 60 * 60 * 1000) / 1000)
  const endTime = Math.floor((now + 30 * 24 * 60 * 60 * 1000) / 1000)

  try {
    const response = await axios.get(
      `${baseUrl}/node/api/platform/distributor/download_center/task_list`,
      {
        params: {
          start_time: startTime,
          end_time: endTime,
          page_index: 0,
          page_size: 100,
        },
        timeout: 10000,
      }
    )

    console.log(`✓ 状态码: ${response.status}`)
    console.log(`✓ 响应code: ${response.data?.code}`)
    console.log(`✓ 响应message: ${response.data?.message}`)
    console.log(`✓ 任务数量: ${response.data?.data?.length || 0}`)

    if (response.data?.data?.[0]) {
      const firstTask = response.data.data[0]
      console.log(
        `✓ 第一条任务: ${firstTask.book_name} (状态: ${firstTask.task_status})`
      )
    }
  } catch (error) {
    console.log(`✗ 失败: ${error.message}`)
    if (error.response) {
      console.log(`  状态码: ${error.response.status}`)
      console.log(`  响应: ${JSON.stringify(error.response.data, null, 2)}`)
    }
  }

  console.log('\n' + '='.repeat(60) + '\n')
  console.log('测试完成！')
}

testApis()
