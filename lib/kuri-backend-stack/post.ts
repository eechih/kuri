import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sources from 'aws-cdk-lib/aws-lambda-event-sources'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'
import { join } from 'path'

export default class Post extends Construct {
  public readonly bucket: s3.Bucket
  public readonly dlqueue: sqs.Queue
  public readonly queue: sqs.Queue
  public readonly table: dynamodb.Table
  public readonly handler: lambda.IFunction

  constructor(scope: Construct, id: string) {
    super(scope, id)

    this.bucket = new s3.Bucket(this, 'Bucket', {
      cors: [{ allowedMethods: [s3.HttpMethods.GET], allowedOrigins: ['*'] }],
    })

    this.bucket.addCorsRule({
      allowedMethods: [s3.HttpMethods.POST],
      allowedOrigins: ['*'],
    })

    this.dlqueue = new sqs.Queue(this, 'DLQueue', {
      retentionPeriod: cdk.Duration.days(14),
    })

    this.queue = new sqs.Queue(this, 'Queue', {
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
        name: 'postId',
        type: dynamodb.AttributeType.STRING,
      },
    })

    // 👇 add global secondary index
    this.table.addGlobalSecondaryIndex({
      indexName: 'groupIdIndex',
      partitionKey: {
        name: 'groupId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'postCreationTime',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    const backendDir = join(__dirname, '..', '..', 'backend')

    this.handler = new nodejs.NodejsFunction(this, 'Handler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: join(backendDir, 'functions', 'post', 'index.ts'),
      depsLockFilePath: join(backendDir, 'package-lock.json'),
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        TABLE_NAME: this.table.tableName,
        PARTITION_KEY: 'postId',
        DLQUEUE_URL: this.dlqueue.queueUrl,
        BUCKET_NAME: this.bucket.bucketName,
      },
      timeout: cdk.Duration.seconds(30),
    })

    // 👇 grant some permissions for the lambda role
    this.table.grantReadWriteData(this.handler)
    this.bucket.grantReadWrite(this.handler)
    this.bucket.grantPutAcl(this.handler)
    this.dlqueue.grantSendMessages(this.handler)

    this.handler.addEventSource(
      new sources.SqsEventSource(this.queue, { batchSize: 10 })
    )
  }
}
