import { Request, Response } from 'express'
import { Product } from '../models'
import ProductDAO from '../productDao'

const userId = 'test'
const productDAO = new ProductDAO()

export default async function (req: Request, res: Response) {
  const data: Product = { ...req.body, userId, productId: req.params.productId }
  const product = await productDAO.update(data)
  return res.json(product)
}
