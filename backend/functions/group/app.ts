import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import express from 'express'

import {
  crawlGroupHandler,
  createGroupHandler,
  getGroupHandler,
  listGroupsHandler,
  patchGroupHandler,
  sqsHandler,
  updateGroupHandler,
} from './handlers'

const app = express()
app.use(bodyParser.json())
const router = express.Router()
app.use('/', router)

router.use(compression())
router.use(cors())
router.use(express.json())
router.use(express.urlencoded({ extended: true }))

router.post('/groups', createGroupHandler)
router.get('/groups', listGroupsHandler)
router.get('/groups/:groupId', getGroupHandler)
router.put('/groups/:groupId', updateGroupHandler)
router.patch('/groups/:groupId', patchGroupHandler)
router.put('/groups/:groupId/crawl', crawlGroupHandler)

router.post('/groups/sqs', sqsHandler)

export { app }
