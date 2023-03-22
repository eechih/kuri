import { Request, Response } from 'express'
import ProductDAO from '../productDao'

const userId = 'test'
const productDAO = new ProductDAO()

export default async function (req: Request, res: Response) {
  const { productId } = req.params

  const product = await productDAO.get({ userId, productId })
  if (!product) {
    return res.status(404).json({ message: 'Invalid productId' })
  }
  return res.json(product)
}
