import { Request, Response } from 'express'
import { safeParseInt } from '../../libs/commomUtils'
import ProductDAO from '../productDao'

const userId = 'test'
const productDAO = new ProductDAO()

export default async function (req: Request, res: Response) {
  const { limit, order, nextToken } = req.query
  const data = await productDAO.query({
    userId,
    limit: safeParseInt(limit as string),
    order: order as 'asc' | 'desc',
    nextToken: nextToken as string,
  })
  return res.json(data)
}
