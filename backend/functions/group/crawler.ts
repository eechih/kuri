import { Protocol } from 'devtools-protocol'
import moment from 'moment'
import { scrollPageToBottom } from 'puppeteer-autoscroll-down'
import { Browser, HTTPResponse, Page } from 'puppeteer-core'
import { sleep } from '../libs/commomUtils'
import { sendMessage } from '../libs/sqsClient'
import { createBrowser } from '../libs/util-puppeteer'
import { FB_COOKIES } from './cookies'

interface FBPost {
  groupId: string
  postId: string
  message?: string
  wwwURL?: string
  photoImages?: string[]
  creationTime?: string // ISO 8601
}

const POSTS_PER_REQUEST = 3

const postQueueUrl = process.env.POST_QUEUE_URL || ''

export default class Crawler {
  private userId: string
  private groupId: string
  private posts: FBPost[]
  private browser: Browser
  private page: Page
  private cookies: Protocol.Network.CookieParam[]

  constructor(userId: string, groupId: string, browser: Browser, page: Page) {
    this.userId = userId
    this.groupId = groupId
    this.posts = []
    this.browser = browser
    this.page = page
  }

  static create = async (props: { userId: string; groupId: string }) => {
    const browser = await createBrowser()
    const page = await browser.newPage()
    await page.setCookie(...FB_COOKIES)
    return new Crawler(props.userId, props.groupId, browser, page)
  }

  login = async (props: { email: string; pass: string }) => {
    await this.page.goto(
      'https://www.facebook.com/login/device-based/regular/login/?login_attempt=1&next=https%3A%2F%2Fwww.facebook.com%2Fgroups%2Fapplema69'
    )

    const loginbutton = await this.page.waitForSelector('#loginbutton')
    await this.page.type('#email', props.email)
    await this.page.type('#pass', props.pass)
    await this.page.screenshot({ path: '.out/fb_1.png' })
    await loginbutton?.click()

    await this.page.waitForSelector('text/Sophia 好物分享')
    await this.page.screenshot({ path: '.out/fb_2.png' })

    this.cookies = await this.page.cookies()
    console.log('cookies', this.cookies)
    console.log(this.page.url())
  }

  crawl = async (props: { crawlLimit?: number }) => {
    console.log('Start crawl', props)
    const { crawlLimit = 3 } = props

    this.page.on('response', this.handleResponse)

    const url = `https://www.facebook.com/groups/${this.groupId}?sorting_setting=CHRONOLOGICAL`
    await this.page.goto(url)
    await this.page.waitForSelector(`text/新貼文`)

    const scrollTimes = Math.ceil(crawlLimit / POSTS_PER_REQUEST)

    for (let i = 1; i <= scrollTimes; i++) {
      console.log('scrollPageToBottom', `${i}/${scrollTimes}`)
      await scrollPageToBottom(this.page, { size: 1500 * POSTS_PER_REQUEST })
      await sleep(2000)
    }
    console.log('Crawl finish.')
  }

  close = async () => {
    await this.browser.close()
  }

  private handleResponse = async (response: HTTPResponse) => {
    try {
      if (!response.url().startsWith('https://www.facebook.com/api/graphql/'))
        return
      const responseBody = await response.text()
      const queryResults = responseBody.split(/\r?\n/)
      for (let i = 0; i < queryResults.length; i++) {
        const post = this.parsePost(queryResults[i])
        if (post) {
          this.posts.push(post)
          await this.sendPost(post)
        }
      }
    } catch (err) {
      console.error('Failed to handle response.', err)
    }
  }

  private parsePost = (queryResult: string): FBPost | null => {
    try {
      const json = JSON.parse(queryResult)
      const node = this.takeOutPostNode(json)
      if (node) {
        const story = node?.comet_sections?.content?.story
        const photoImages: string[] = story?.attachments.flatMap(
          (attachment: any) => {
            if (attachment?.styles?.attachment?.all_subattachments?.nodes) {
              return attachment.styles.attachment.all_subattachments.nodes.map(
                (node: any) => node?.media?.image?.uri
              )
            } else if (
              attachment?.styles?.attachment?.media?.photo_image?.uri
            ) {
              return [attachment.styles.attachment.media.photo_image.uri]
            } else {
              return []
            }
          }
        )
        const creationTime: number =
          story?.comet_sections?.context_layout?.story?.comet_sections?.metadata?.find(
            (md: any) => {
              return (
                md.__typename === 'CometFeedStoryMinimizedTimestampStrategy'
              )
            }
          )?.story?.creation_time

        return {
          postId: node?.post_id,
          groupId: this.groupId,
          message: story?.message?.text,
          wwwURL: story?.wwwURL,
          photoImages: photoImages,
          creationTime: moment.unix(creationTime).utcOffset(8).format(),
        }
      }
    } catch (err) {
      console.error('Failed to parse post.', err)
    }
    return null
  }

  private takeOutPostNode = (json: any): any | null => {
    if (json?.data?.node?.__typename === 'Group') {
      if (
        json?.data?.node?.group_feed?.edges?.length > 0 &&
        json?.data?.node?.group_feed?.edges[0]?.node?.__typename === 'Story'
      ) {
        return json.data.node.group_feed.edges[0].node
      }
    } else if (json?.data?.node?.__typename === 'Story') {
      return json.data.node
    }
    return null
  }

  private sendPost = async (post: FBPost) => {
    await sendMessage({
      queueUrl: postQueueUrl,
      messageBody: JSON.stringify({ ...post, userId: this.userId }),
      messageAttributes: {
        userId: { DataType: 'String', StringValue: this.userId },
      },
    })
  }
}
