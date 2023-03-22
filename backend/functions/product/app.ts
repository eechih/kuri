import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import express from 'express'

import {
  createProductHandler,
  getProductHandler,
  listProductsHandler,
  patchProductHandler,
  publishProductHandler,
  sqsHandler,
  updateProductHandler,
} from './handlers'

const app = express()
app.use(bodyParser.json())
const router = express.Router()
app.use('/', router)

router.use(compression())
router.use(cors())
router.use(express.json())
router.use(express.urlencoded({ extended: true }))

router.post('/products', createProductHandler)
router.get('/products', listProductsHandler)
router.get('/products/:productId', getProductHandler)
router.put('/products/:productId', updateProductHandler)
router.patch('/products/:productId', patchProductHandler)
router.put('/products/:productId/publish', publishProductHandler)

router.post('/products/sqs', sqsHandler)

export { app }
