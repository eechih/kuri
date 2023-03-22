import { SQSEvent } from 'aws-lambda'
import { Request, Response } from 'express'
import { Patch } from '../../libs/baseDao'
import { sendMessage } from '../../libs/sqsClient'
import ProductDAO from '../productDao'
import ProductPublisher from '../productPublisher'

const DLQueueUrl = process.env.DLQUEUE_URL || ''
const productDAO = new ProductDAO()
const publisher = new ProductPublisher()

export enum ACTION {
  PUBLISH = 'publish',
  PATCH = 'patch',
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

      const productId = record.messageAttributes.productId?.stringValue
      if (!productId)
        throw new Error('Message attribute "productId" must be required.')

      const action = record.messageAttributes.action?.stringValue
      if (!action)
        throw new Error('Message attribute "action" must be required.')

      if (action == ACTION.PATCH) {
        const key = { userId, productId }
        const patches = JSON.parse(record.body) as Patch[]
        await productDAO.patch({ key, patches })
      } else if (action == ACTION.PUBLISH) {
        const { phpsessId } = JSON.parse(record.body) as { phpsessId?: string }
        await publishProduct({ userId, productId, phpsessId })
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

const publishProduct = async (props: {
  userId: string
  productId: string
  phpsessId?: string
}) => {
  console.log('publishProduct', props)

  const { userId, productId, phpsessId } = props
  const key = { userId, productId }

  const product = await productDAO.get(key)
  if (!product) throw Error('Invalid productId')

  try {
    productDAO.patch({
      key,
      patches: [{ op: 'replace', path: '/publishing', value: true }],
    })

    if (phpsessId) publisher.updateCookie({ phpsessId })
    await publisher.refreshToken()

    const publishResult = await publisher.publishToBuyPlusOne({ data: product })
    const postId = await publisher.publishToFB({ groupId: '913862951959460' })

    const patches = [
      { op: 'replace', path: '/publishing', value: false },
      {
        op: 'replace',
        path: '/publishedProductId',
        value: publishResult.productId,
      },
      { op: 'replace', path: '/publishedPostId', value: postId },
    ]

    if (publishResult.updatedName)
      patches.push({
        op: 'replace',
        path: '/name',
        value: publishResult.updatedName,
      })

    if (publishResult.updatedDescription)
      patches.push({
        op: 'replace',
        path: '/description',
        value: publishResult.updatedDescription,
      })

    productDAO.patch({ key, patches })
    console.log('Succesully published product to Buy+1.')
  } catch (err) {
    productDAO.patch({
      key,
      patches: [
        { op: 'replace', path: '/publishing', value: false },
        {
          op: 'replace',
          path: '/publishLog',
          value: JSON.stringify(err),
        },
      ],
    })
    console.error('Failed to publish product to Buy+!')
    throw err
  }
}
