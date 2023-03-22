import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sources from 'aws-cdk-lib/aws-lambda-event-sources'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'
import { join } from 'path'

interface CrawlerProps {
  layers: lambda.LayerVersion[]
  postQueue: sqs.Queue
  productQueue: sqs.Queue
}

export default class Crawler extends Construct {
  public readonly dlqueue: sqs.Queue
  public readonly queue: sqs.Queue
  public readonly table: dynamodb.Table
  public readonly handler: lambda.IFunction

  constructor(scope: Construct, id: string, props: CrawlerProps) {
    super(scope, id)

    this.dlqueue = new sqs.Queue(this, 'DLQueue', {
      retentionPeriod: cdk.Duration.days(14),
    })

    this.queue = new sqs.Queue(this, 'Queue', {
      visibilityTimeout: cdk.Duration.seconds(180),
      deadLetterQueue: {
        maxReceiveCount: 1,
        queue: this.dlqueue,
      },
    })

    this.table = new dynamodb.Table(this, 'Table', {
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'crawlerId',
        type: dynamodb.AttributeType.STRING,
      },
    })

    this.table.addLocalSecondaryIndex({
      indexName: 'creationTimeIndex',
      sortKey: {
        name: 'creationTime',
        type: dynamodb.AttributeType.STRING,
      },
    })

    const backendDir = join(__dirname, '..', '..', 'backend')

    this.handler = new nodejs.NodejsFunction(this, 'Handler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: join(backendDir, 'functions', 'crawler', 'index.ts'),
      depsLockFilePath: join(backendDir, 'package-lock.json'),
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        TABLE_NAME: this.table.tableName,
        QUEUE_URL: this.queue.queueUrl,
        DLQUEUE_URL: this.dlqueue.queueUrl,
        POST_QUEUE_URL: props.postQueue.queueUrl,
        PRODUCT_QUEUE_URL: props.productQueue.queueUrl,
      },
      layers: props.layers,
      memorySize: 1600,
      timeout: cdk.Duration.seconds(180),
    })

    // 👇 grant some permissions for the lambda role
    this.queue.grantSendMessages(this.handler)
    this.dlqueue.grantSendMessages(this.handler)
    this.table.grantReadWriteData(this.handler)
    props.postQueue.grantSendMessages(this.handler)
    props.productQueue.grantSendMessages(this.handler)

    this.handler.addEventSource(
      new sources.SqsEventSource(this.queue, { batchSize: 1 })
    )
  }
}
