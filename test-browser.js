// 测试浏览器是否能正常启动
import { chromium } from 'playwright'

async function testBrowser() {
  console.log('正在启动浏览器...')

  const browser = await chromium.launch({
    headless: false,
  })

  console.log('✓ 浏览器启动成功')

  const page = await browser.newPage()
  console.log('✓ 创建新页面成功')

  await page.goto('https://www.baidu.com')
  console.log('✓ 页面加载成功')

  await new Promise(resolve => setTimeout(resolve, 3000))

  await browser.close()
  console.log('✓ 浏览器关闭成功')

  console.log('\n所有测试通过！')
}

testBrowser().catch(console.error)
