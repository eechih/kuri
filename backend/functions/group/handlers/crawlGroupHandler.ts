import { Request, Response } from 'express'
import { pick } from 'ramda'
import { sendMessage } from '../../libs/sqsClient'
import GroupDAO from '../groupDao'
import { ACTION } from './sqsHandler'

const userId = 'test'

const queueUrl = process.env.QUEUE_URL || ''
const groupDAO = new GroupDAO()

export default async function (req: Request, res: Response) {
  console.log('crawlGroupHandler', pick(['params', 'query'], req))

  const { groupId } = req.params
  const { limit = '10' } = req.query as { limit: string }
  const key = { userId, groupId }

  try {
    const group = await groupDAO.get(key)
    if (!group) return res.status(404).json({ message: 'Invalid groupId' })

    const messageId = await sendMessage({
      queueUrl: queueUrl,
      messageBody: JSON.stringify({ limit }),
      messageAttributes: {
        userId: { DataType: 'String', StringValue: userId },
        groupId: { DataType: 'String', StringValue: groupId },
        action: { DataType: 'String', StringValue: ACTION.CRAWL },
      },
    })

    groupDAO.patch({
      key,
      patches: [{ op: 'replace', path: '/messageId', value: messageId }],
    })
    return res
      .status(202)
      .json({ message: 'Crawl task are queued for execution.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json(JSON.stringify(err))
  }
}
