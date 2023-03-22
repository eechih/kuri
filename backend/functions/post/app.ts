import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import express from 'express'
import {
  createPostHandler,
  getPostHandler,
  patchPostHandler,
  queryPostsHandler,
  sqsHandler,
  updatePostHandler,
} from './handlers'

const app = express()
app.use(bodyParser.json())
const router = express.Router()
app.use('/', router)

router.use(compression())
router.use(cors())
router.use(express.json())
router.use(express.urlencoded({ extended: true }))

router.post('/posts', createPostHandler)
router.get('/posts', queryPostsHandler)
router.post('/posts/sqs', sqsHandler)
router.get('/posts/:postId', getPostHandler)
router.put('/posts/:postId', updatePostHandler)
router.patch('/posts/:postId', patchPostHandler)

export { app }
