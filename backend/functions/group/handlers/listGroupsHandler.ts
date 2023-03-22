import { Request, Response } from 'express'
import { safeParseInt } from '../../libs/commomUtils'
import GroupDAO from '../groupDao'

const userId = 'test'
const groupDAO = new GroupDAO()

export default async function (req: Request, res: Response) {
  const { limit, order, nextToken } = req.query
  const data = await groupDAO.query({
    userId,
    limit: safeParseInt(limit as string),
    order: order as 'asc' | 'desc',
    nextToken: nextToken as string,
  })
  return res.json(data)
}
