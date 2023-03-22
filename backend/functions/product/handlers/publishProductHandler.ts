import { Request, Response } from 'express'
import { pick } from 'ramda'
import { sendMessage } from '../../libs/sqsClient'
import ProductDAO from '../productDao'

const userId = 'test'

const queueUrl = process.env.QUEUE_URL || ''
const productDAO = new ProductDAO()

export default async function (req: Request, res: Response) {
  console.log('publishProductHandler', pick(['params', 'query'], req))

  const { productId } = req.params
  const { phpsessId } = req.query as { phpsessId?: string }
  const key = { userId, productId }

  try {
    const product = await productDAO.get(key)
    if (!product) return res.status(404).json({ message: 'Invalid productId' })

    const messageId = await sendMessage({
      queueUrl: queueUrl,
      messageBody: JSON.stringify({ phpsessId }),
      messageAttributes: {
        userId: { DataType: 'String', StringValue: userId },
        productId: { DataType: 'String', StringValue: productId },
        action: { DataType: 'String', StringValue: 'publish' },
      },
    })

    await productDAO.patch({
      key,
      patches: [
        { op: 'replace', path: '/publishing', value: true },
        { op: 'replace', path: '/messageId', value: messageId },
      ],
    })
    return res
      .status(202)
      .json({ message: 'Publish task are queued for execution.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json(JSON.stringify(err))
  }
}
