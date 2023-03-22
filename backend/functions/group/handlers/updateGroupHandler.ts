import { Request, Response } from 'express'
import GroupDAO from '../groupDao'
import { Group } from '../models'

const userId = 'test'
const groupDAO = new GroupDAO()

export default async function (req: Request, res: Response) {
  const data: Group = { ...req.body, userId, groupId: req.params.groupId }
  const group = await groupDAO.update(data)
  return res.json(group)
}
