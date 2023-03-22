import { Request, Response } from 'express'
import { Patch } from '../../libs/baseDao'
import { nonEmpty } from '../../libs/commomUtils'
import GroupDAO from '../groupDao'

const userId = 'test'
const groupDAO = new GroupDAO()

export default async function (req: Request, res: Response) {
  const { groupId } = req.params
  const patches = req.body as Patch[]

  if (!nonEmpty(patches))
    return res.status(400).json({ message: 'Bad Request' })
  const group = await groupDAO.patch({
    key: { userId, groupId },
    patches,
  })
  return res.status(200).json(group)
}
