import { Request, Response } from 'express'
import GroupDAO from '../groupDao'

const userId = 'test'
const groupDAO = new GroupDAO()

export default async function (req: Request, res: Response) {
  const { groupId } = req.params

  const group = await groupDAO.get({ userId, groupId })
  if (!group) {
    return res.status(404).json({ message: 'Invalid groupId' })
  }
  return res.json(group)
}
