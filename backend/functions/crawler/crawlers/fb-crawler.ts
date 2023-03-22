import moment from 'moment'
import { scrollPageToBottom } from 'puppeteer-autoscroll-down'
import { Page } from 'puppeteer-core'
import { take } from 'ramda'
import { Post } from '../models'

export const fbLogin = async (
  page: Page,
  props: { email: string; pass: string }
) => {
  await page.goto(
    'https://www.facebook.com/login/device-based/regular/login/?login_attempt=1&next=https%3A%2F%2Fwww.facebook.com%2Fgroups%2Fapplema69'
  )

  const loginbutton = await page.waitForSelector('#loginbutton')
  await page.type('#email', props.email)
  await page.type('#pass', props.pass)
  // await page.screenshot({ path: '.out/fb_1.png' })
  await loginbutton?.click()

  await page.waitForSelector('text/Sophia 好物分享')
  // await page.screenshot({ path: '.out/fb_2.png' })

  const cookies = await page.cookies()
  console.log('cookies', cookies)
  console.log(page.url())
}

async function sleep(ms = 0) {
  return new Promise(r => setTimeout(r, ms))
}

const extractPost = (props: {
  userId: string
  groupId: string
  groupName: string
  json: any
}): Post | undefined => {
  console.log('extractPost', props)
  const { userId, groupId, groupName, json } = props
  let node
  if (json?.data?.node?.__typename === 'Group') {
    if (
      json?.data?.node?.group_feed?.edges?.length > 0 &&
      json?.data?.node?.group_feed?.edges[0]?.node?.__typename === 'Story'
    ) {
      node = json.data.node.group_feed.edges[0].node
    }
  } else if (json?.data?.node?.__typename === 'Story') {
    node = json.data.node
  }

  if (!node) return

  const story = node?.comet_sections?.content?.story

  const photoImages: string[] = story?.attachments.flatMap(
    (attachment: any) => {
      if (attachment?.styles?.attachment?.all_subattachments?.nodes) {
        return attachment.styles.attachment.all_subattachments.nodes.map(
          (node: any) => node?.media?.image?.uri
        )
      } else if (attachment?.styles?.attachment?.media?.photo_image?.uri) {
        return [attachment.styles.attachment.media.photo_image.uri]
      } else {
        return []
      }
    }
  )
  const creationTime: number =
    story?.comet_sections?.context_layout?.story?.comet_sections?.metadata?.find(
      (md: any) => {
        return md.__typename === 'CometFeedStoryMinimizedTimestampStrategy'
      }
    )?.story?.creation_time

  const post: Post = {
    userId,
    postId: node?.post_id,
    groupId,
    groupName,
    message: story?.message?.text,
    wwwURL: story?.wwwURL,
    photoImages: photoImages,
    creationTime: moment.unix(creationTime).utcOffset(8).format(),
    crawledTime: moment().utcOffset(8).format(),
  }
  return post
}

const POSTS_PER_REQUEST = 3

interface CrawlProps {
  userId: string
  groupId: string
  groupName: string
  crawlLimit?: number
}

export const crawl = async (page: Page, props: CrawlProps): Promise<Post[]> => {
  console.log('Start crawl', props)
  const { userId, groupId, groupName, crawlLimit = 3 } = props
  const posts: Post[] = []

  page.on('response', async response => {
    if (response.url().startsWith('https://www.facebook.com/api/graphql/')) {
      const text = await response.text()
      const result = text.split(/\r?\n/)
      result.forEach(jsonString => {
        const json = JSON.parse(jsonString)
        const post = extractPost({ userId, groupId, groupName, json })
        if (post) posts.push(post)
      })
    }
  })

  const url = `https://www.facebook.com/groups/${props.groupId}?sorting_setting=CHRONOLOGICAL`
  await page.goto(url)
  await page.waitForSelector(`text/新貼文`)

  const scrollTimes = Math.ceil(crawlLimit / POSTS_PER_REQUEST)

  for (let i = 1; i <= scrollTimes; i++) {
    console.log('scrollPageToBottom', `${i}/${scrollTimes}`)
    await scrollPageToBottom(page, { size: 1500 * POSTS_PER_REQUEST })
    await sleep(2000)
  }

  console.log('collected posts', posts.length)
  console.log('Crawl finish.')

  return take(crawlLimit, posts)
}
