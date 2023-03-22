import { Request, Response } from 'express'
import GroupDAO from '../groupDao'
import { Group } from '../models'

const userId = 'test'
const groupDAO = new GroupDAO()

export default async function (req: Request, res: Response) {
  const { groupId } = req.body as { groupId: string }
  if (!groupId)
    return res
      .status(400)
      .json({ message: 'Field "groupId" must be required.' })
  const data: Group = { ...req.body, userId }
  const group = await groupDAO.create(data)
  return res.json(group)
}
