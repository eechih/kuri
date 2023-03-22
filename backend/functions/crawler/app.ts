import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import express from 'express'
import 'source-map-support/register'

import {
  createCrawlerHandler,
  getCrawlerHandler,
  listCrawlersHandler,
  listGroupsHandler,
  sqsHandler,
} from './handlers'

const app = express()
app.use(bodyParser.json())
const router = express.Router()
app.use('/', router)

router.use(compression())
router.use(cors())
router.use(express.json())
router.use(express.urlencoded({ extended: true }))

router.post('/crawlers/sqs', sqsHandler)
router.post('/crawlers', createCrawlerHandler)
router.get('/crawlers', listCrawlersHandler)
router.get('/crawlers/:crawlerId', getCrawlerHandler)
router.get('/crawlers/facebook/groups', listGroupsHandler)

export { app }
