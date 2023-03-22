import { SQSEvent } from 'aws-lambda'
import { Request, Response } from 'express'
import moment from 'moment'
import { getUniqueId, safeParseInt } from '../libs/commomUtils'
import { sendMessage } from '../libs/sqsClient'
import CrawlerDAO from './crawlerDao'
import BuyPlusOneCrawler from './crawlers/buyPlusOneCrawler'
import FacebookCrawler from './crawlers/facebookCrawler'
import { groups } from './models'

const tableName = process.env.TABLE_NAME || ''
const crawlerQueueUrl = process.env.QUEUE_URL || ''
const crawlerDLQueueUrl = process.env.DLQUEUE_URL || ''
const postQueueUrl = process.env.POST_QUEUE_URL || ''

const crawlerDao = new CrawlerDAO(tableName)
const facebookCrawler = new FacebookCrawler()
const buyPlusOneCrawler = new BuyPlusOneCrawler()

const userId = 'test'

const listGroupsHandler = async (req: Request, res: Response) => {
  return res.json({ count: groups.length, items: groups })
}

const listCrawlersHandler = async (req: Request, res: Response) => {
  const { limit, order, nextToken } = req.query
  const data = await crawlerDao.query({
    userId,
    limit: safeParseInt(limit as string),
    order: order as 'asc' | 'desc',
    nextToken: nextToken as string,
  })
  return res.json(data)
}

const getCrawlerHandler = async (req: Request, res: Response) => {
  const { crawlerId } = req.params
  const crawler = await crawlerDao.get({ userId, crawlerId })
  if (!crawler) return res.status(404).json({})
  return res.json(crawler)
}

const createCrawlerHandler = async (req: Request, res: Response) => {
  console.log('createCrawlerHandler', {
    req: {
      query: req.query,
      body: req.body,
    },
  })

  const { crawlerName } = req.query as { crawlerName: string }
  const data = req.body as Record<string, any>

  try {
    if (!crawlerName) {
      res
        .status(400)
        .json({ message: 'Parameter "crawlerName" must be required.' })
      return
    }
    if (!['Facebook', 'BuyPlusOne'].includes(crawlerName)) {
      res.status(400).json({
        message:
          'Parameter "crawlerName" only allows the following values: "Facebook", "BuyPlusOne".',
      })
      return
    }

    const crawlerId = getUniqueId()

    await crawlerDao.create({
      userId: userId,
      crawlerId: crawlerId,
      crawlerName: crawlerName,
      state: 'Pending',
      creationTime: moment().utcOffset(8).format(),
    })

    const messageBody = JSON.stringify(data)

    const messageId = await sendMessage({
      queueUrl: crawlerQueueUrl,
      messageBody: JSON.stringify(data),
      messageAttributes: {
        userId: { DataType: 'String', StringValue: userId },
        crawlerId: { DataType: 'String', StringValue: crawlerId },
        crawlerName: { DataType: 'String', StringValue: crawlerName },
      },
    })

    const crawler = await crawlerDao.patch({
      key: { userId, crawlerId },
      patches: [
        { op: 'add', path: '/messageId', value: messageId },
        { op: 'add', path: '/messageBody', value: messageBody },
      ],
    })
    return res.status(200).json(crawler)
  } catch (error) {
    console.log('Error', error)
    return res.status(500).json(error)
  }
}

const sqsHandler = async (req: Request, res: Response) => {
  if (req.header('host') !== 'sqs.amazonaws.com') {
    res.status(403).json({ message: 'Forbidden' })
    return
  }

  const event: SQSEvent = req.body
  event.Records.map(async record => {
    try {
      console.log('Starting process:', {
        SQSRecord: {
          messageId: record.messageId,
          messageAttributes: record.messageAttributes,
          body: record.body,
        },
      })

      const userId = record.messageAttributes.userId.stringValue
      const crawlerId = record.messageAttributes.crawlerId.stringValue
      const crawlerName = record.messageAttributes.crawlerName.stringValue

      if (!userId) throw new Error('Attribute "userId" not found.')
      if (!crawlerId) throw new Error('Attribute "crawlerId" not found.')
      if (!crawlerName) throw new Error('Attribute "crawlerName" not found.')

      const key = { userId, crawlerId }

      try {
        crawlerDao.updateState({ key, state: 'Processing' })

        let tracing
        if (crawlerName == 'Facebook') {
          tracing = await facebookCrawler.crawlPosts({
            userId,
            data: JSON.parse(record.body),
          })
        } else if (crawlerName == 'BuyPlusOne') {
          tracing = await buyPlusOneCrawler.createProduct({
            userId,
            jsonData: record.body,
          })
        } else {
          throw new Error(`The crawler does not yes support. ${crawlerName}`)
        }

        crawlerDao.updateState({
          key,
          state: 'Completed',
          tracing: tracing,
        })
      } catch (err) {
        crawlerDao.updateState({
          key,
          state: 'Failed',
          tracing: JSON.stringify(err),
        })
        throw err
      }
    } catch (err) {
      console.error(err)
      // send the message to Crawler DLQueue.
      await sendMessage({
        queueUrl: crawlerDLQueueUrl,
        messageBody: record.body,
      })
    }
  })
  res.status(204)
}

export {
  listGroupsHandler,
  listCrawlersHandler,
  getCrawlerHandler,
  createCrawlerHandler,
  sqsHandler,
}
