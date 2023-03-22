import { SQSEvent } from 'aws-lambda'
import { Request, Response } from 'express'
import moment from 'moment'
import { sendMessage } from '../../libs/sqsClient'
import Crawler from '../crawler'
import GroupDAO from '../groupDao'

const DLQueueUrl = process.env.DLQUEUE_URL || ''
const groupDAO = new GroupDAO()

export enum ACTION {
  CRAWL = 'crawl',
}

export default async function (req: Request, res: Response) {
  if (req.header('host') !== 'sqs.amazonaws.com') {
    res.status(403).json({ message: 'Forbidden' })
    return
  }

  const event: SQSEvent = req.body
  event.Records.map(async record => {
    try {
      console.log('Processing:', {
        SQSRecord: {
          messageId: record.messageId,
          messageAttributes: record.messageAttributes,
          body: record.body,
        },
      })

      const userId = record.messageAttributes.userId?.stringValue
      if (!userId)
        throw new Error('Message attribute "userId" must be required.')

      const groupId = record.messageAttributes.groupId?.stringValue
      if (!groupId)
        throw new Error('Message attribute "groupId" must be required.')

      const action = record.messageAttributes.action?.stringValue
      if (!action)
        throw new Error('Message attribute "action" must be required.')

      if (action == ACTION.CRAWL) {
        await crawl({ userId, groupId })
      }
    } catch (err) {
      console.error(err)
      // send the message to DLQueue.
      await sendMessage({
        queueUrl: DLQueueUrl,
        messageAttributes: record.messageAttributes,
        messageBody: record.body,
      })
    }
  })
}

const crawl = async (props: { userId: string; groupId: string }) => {
  console.log('crawl', props)

  const { userId, groupId } = props
  const key = { userId, groupId }

  let crawler
  try {
    const group = await groupDAO.get(key)
    if (!group) throw Error('Invalid groupId')

    groupDAO.patch({
      key,
      patches: [
        { op: 'replace', path: '/crawling', value: true },
        {
          op: 'replace',
          path: '/crawledStartTime',
          value: moment().utcOffset(8).format(),
        },
        { op: 'remove', path: '/crawledEndTime' },
        { op: 'remove', path: '/crawledTrace' },
      ],
    })

    crawler = await Crawler.create({ userId, groupId })
    await crawler.crawl({ crawlLimit: 10 })

    groupDAO.patch({
      key,
      patches: [
        { op: 'replace', path: '/crawling', value: false },
        {
          op: 'replace',
          path: '/crawledEndTime',
          value: moment().utcOffset(8).format(),
        },
        { op: 'remove', path: 'messageId' },
      ],
    })
    console.log('Succesully crawled group.')
  } catch (err) {
    console.error('Failed to crawl group.')
    groupDAO.patch({
      key,
      patches: [
        { op: 'replace', path: '/crawling', value: false },
        {
          op: 'replace',
          path: '/crawledTrace',
          value: JSON.stringify(err),
        },
      ],
    })
    throw err
  } finally {
    if (crawler) await crawler.close()
  }
}
