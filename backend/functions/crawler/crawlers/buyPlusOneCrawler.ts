import { omit } from 'ramda'
import { Patch } from '../../libs/baseDao'
import { sendMessage } from '../../libs/sqsClient'
import { cookies } from '../../product/cookies'
import BuyPlusOneAPI, { Product } from './bp1Api'

const productQueueUrl = process.env.PRODUCT_QUEUE_URL || ''

const patchProduct = async (props: {
  key: { userId: string; productId: string }
  patches: Patch[]
}) => {
  const {
    key: { userId, productId },
    patches,
  } = props

  sendMessage({
    queueUrl: productQueueUrl,
    messageBody: JSON.stringify(patches),
    messageAttributes: {
      userId: { DataType: 'String', StringValue: userId },
      productId: { DataType: 'String', StringValue: productId },
      action: { DataType: 'String', StringValue: 'patch' },
    },
  })
}
export default class BuyPlusOneCrawler {
  private api: BuyPlusOneAPI

  constructor() {
    this.api = new BuyPlusOneAPI({ initCookies: cookies })
    console.log('api', this.api)
  }

  createProduct = async (props: {
    userId: string
    jsonData: string
  }): Promise<string> => {
    console.log('createProduct', props)

    const { userId, jsonData } = props
    const payload = JSON.parse(jsonData)
    console.log('payload', payload)

    const { phpsessId } = payload
    console.log('phpsessId', phpsessId)

    const product: Product = omit(['phpsessId'], payload)
    console.log('product', product)

    if (!product.productId) throw new Error('productId must be required')
    const key = { userId, productId: product.productId }

    try {
      patchProduct({
        key,
        patches: [{ op: 'replace', path: '/processing', value: true }],
      })

      if (phpsessId) this.api.updatePhpsessId(phpsessId)
      const token = await this.api.obtaineToken()

      const productId = await this.api.genProductId(token)
      product.productId = productId
      await this.api.updateProduct(token, { product })

      patchProduct({
        key,
        patches: [{ op: 'replace', path: '/buyPlusOneId', value: productId }],
      })

      const postId = await this.api.publishToFB(token, { productId })

      patchProduct({
        key,
        patches: [
          { op: 'replace', path: '/postId', value: postId },
          { op: 'replace', path: '/processing', value: false },
        ],
      })

      return 'success'
    } catch (err) {
      patchProduct({
        key,
        patches: [{ op: 'replace', path: '/processing', value: false }],
      })
      throw err
    }
  }
}
