import { createBrowser } from '../../libs/util-puppeteer'
import { fbLogin } from './fb-crawler'

test.skip('test fb login', async () => {
  const email = 'sophia88101108@gmail.com'
  const pass = ''

  const browser = await createBrowser()
  const page = await browser.newPage()

  await fbLogin(page, { email, pass })
  await browser.close()
})
