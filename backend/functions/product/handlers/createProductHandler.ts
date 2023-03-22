import { Request, Response } from 'express'
import { getUniqueId } from '../../libs/commomUtils'
import { Product } from '../models'
import ProductDAO from '../productDao'

const userId = 'test'
const productDAO = new ProductDAO()

export default async function (req: Request, res: Response) {
  const data: Product = { ...req.body, userId, productId: getUniqueId() }
  const product = await productDAO.create(data)
  return res.json(product)
}
