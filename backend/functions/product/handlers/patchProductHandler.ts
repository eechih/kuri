import { Request, Response } from 'express'
import { Patch } from '../../libs/baseDao'
import { nonEmpty } from '../../libs/commomUtils'
import ProductDAO from '../productDao'

const userId = 'test'
const productDAO = new ProductDAO()

export default async function (req: Request, res: Response) {
  const { productId } = req.params
  const patches = req.body as Patch[]

  if (!nonEmpty(patches))
    return res.status(400).json({ message: 'Bad Request' })
  const product = await productDAO.patch({
    key: { userId, productId },
    patches,
  })
  return res.status(200).json(product)
}
