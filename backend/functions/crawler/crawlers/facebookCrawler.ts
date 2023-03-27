import { safeParseInt } from '../../libs/commomUtils'
import { sendMessage } from '../../libs/sqsClient'
import { createBrowser } from '../../libs/util-puppeteer'
import { FB_COOKIES } from '../cookies'
import { findGroupById } from '../helper'
import { CrawledPost } from '../models'
import { crawl } from './fb-crawler'

const postQueueUrl = process.env.POST_QUEUE_URL || ''

export default class FacebookCrawler {
  crawlPosts = async (props: {
    userId: string
    data: Record<string, string>
  }): Promise<string> => {
    console.log('crawlPosts', props)

    const { userId, data } = props
    const { groupId, limit = '10' } = data

    const group = findGroupById(groupId)
    if (!group) throw Error(`Invalid groupId: ${groupId}`)

    // start to scraping FB posts with Puppeteer
    const browser = await createBrowser()
    const page = await browser.newPage()
    await page.setCookie(...FB_COOKIES)

    const posts: CrawledPost[] = await crawl(page, {
      userId,
      groupId: group.groupId,
      groupName: group.groupName,
      crawlLimit: safeParseInt(limit),
    })
    console.log('number of posts:', posts.length)

    // send messages to Post Queue.
    await Promise.all(
      posts.map(post => {
        sendMessage({
          queueUrl: postQueueUrl,
          messageBody: JSON.stringify(post),
        })
      })
    )

    await browser.close()
    return JSON.stringify({ message: `crawled posts: ${posts.length}` })
  }
}
