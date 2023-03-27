import { SQSEvent } from 'aws-lambda'
import { Request, Response } from 'express'
import { Patch } from '../libs/baseDao'
import { nonEmpty, safeParseInt } from '../libs/commomUtils'
import { sendMessage } from '../libs/sqsClient'
import * as helper from './helper'
import { CrawledPost } from './models'
import PostDAO from './postDao'

const tableName = process.env.TABLE_NAME || ''
const dlqueueUrl = process.env.DLQUEUE_URL || ''
const bucketName = process.env.BUCKET_NAME || ''

const postDao = new PostDAO(tableName)
const userId = 'test'

const queryPostsHandler = async (req: Request, res: Response) => {
  const { groupId, limit, order, nextToken, productName } = req.query
  try {
    const filters: Record<string, string> = {}
    if (productName) filters['productName'] = productName as string

    const data = await postDao.query({
      userId,
      groupId: groupId as string,
      limit: safeParseInt(limit as string),
      order: order as 'asc' | 'desc',
      nextToken: nextToken as string,
    })
    return res.json(data)
  } catch (err) {
    return res.status(500).json(err)
  }
}

const getPostHandler = async (req: Request, res: Response) => {
  const { postId } = req.params
  const post = await postDao.get({ userId, postId })
  if (!post) {
    res.status(404).json({ message: 'The post does not exist.' })
    return
  }
  return res.json(post)
}

const createPostHandler = async (req: Request, res: Response) => {
  return res.status(405).json('Method Not Allowed')
}

const updatePostHandler = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params
    const key = { userId, postId }
    if (!(await postDao.isExist(key))) {
      res.status(404).json({ message: 'The post does not exist.' })
      return
    }

    const post = await postDao.update({ ...req.body, ...key })
    return res.status(200).json(post)
  } catch (err) {
    console.error(err)
    return res.status(500).json(err)
  }
}

const patchPostHandler = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params
    const key = { userId, postId }
    const patches = req.body as Patch[]
    if (!nonEmpty(patches)) {
      res.status(400).json({ message: 'Parameter "patches" cannot be empty.' })
      return
    }
    if (!(await postDao.isExist(key))) {
      res.status(404).json({ message: 'The post does not exist.' })
      return
    }

    const post = await postDao.patch({ key, patches })
    return res.status(200).json(post)
  } catch (err) {
    console.error(err)
    return res.status(500).json(err)
  }
}

const sqsHandler = async (req: Request, res: Response) => {
  if (req.header('host') !== 'sqs.amazonaws.com') {
    res.status(403).json({ message: 'Forbidden' })
    return
  }
  const event: SQSEvent = req.body

  event.Records.map(async record => {
    try {
      console.log('Processing:', record.messageId)
      const crawledPost = JSON.parse(record.body) as CrawledPost
      const { userId, groupId, postId, photoImages } = crawledPost

      if (await postDao.isExist({ userId, postId })) {
        console.log('The post already exists.')
      } else {
        const post = helper.analysePost({ crawledPost })
        post.postUrl = await helper.uploadPostMessageToS3({
          bucketName,
          userId,
          groupId,
          postId,
          postMessage: crawledPost.message,
        })
        post.productImageUrls = await helper.downloadImagesAndUploadToS3({
          bucketName,
          userId,
          groupId,
          postId,
          imageUrls: photoImages ?? [],
        })
        await postDao.create(post)
      }
    } catch (error) {
      console.error(error)
      // send the message to Post DLQueue.
      await sendMessage({
        messageBody: record.body,
        queueUrl: dlqueueUrl,
        delaySeconds: 10,
      })
    }
  })
  res.status(201)
}

export {
  queryPostsHandler,
  getPostHandler,
  createPostHandler,
  updatePostHandler,
  patchPostHandler,
  sqsHandler,
}
