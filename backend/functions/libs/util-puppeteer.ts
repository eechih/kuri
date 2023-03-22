import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

const createBrowser = async () => {
  const isAWS = __dirname === '/var/task'
  if (isAWS)
    return await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        '/opt/nodejs/node_modules/@sparticuz/chromium/bin'
      ), // reference: https://github.com/Sparticuz/chromium/issues/24#issuecomment-1334580490
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })
  else
    return await puppeteer.launch({
      executablePath:
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: false,
    })
}

export { createBrowser }
