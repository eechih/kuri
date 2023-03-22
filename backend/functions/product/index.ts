import serverlessExpress from '@vendia/serverless-express'
import { Handler } from 'aws-lambda'
import 'source-map-support/register'
import { app } from './app'

export const handler = serverlessExpress({
  app,
  eventSourceRoutes: {
    AWS_SQS: '/products/sqs',
  },
}) as Handler
