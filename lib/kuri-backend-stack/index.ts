import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

import Api from './api'
import Crawler from './crawler'
import Group from './group'
import Layer from './layer'
import Post from './post'
import Product from './product'

interface KuriBackendStackProps extends cdk.StackProps {
  readonly domain: string
}

export default class KuriBackendStack extends cdk.Stack {
  public readonly apiUrl: string

  constructor(scope: Construct, id: string, props: KuriBackendStackProps) {
    super(scope, id, props)

    const { domain } = props

    const layer = new Layer(this, 'Layer')

    const post = new Post(this, 'Post')

    const group = new Group(this, 'Group', {
      layers: [layer.chromium],
      postQueue: post.queue,
    })

    const product = new Product(this, 'Product')

    const crawler = new Crawler(this, 'Crawler', {
      layers: [layer.chromium],
      postQueue: post.queue,
      productQueue: product.queue,
    })

    const api = new Api(this, 'Api', {
      domain: domain,
      subdomain: 'api',
      routeHandlers: [
        { routePath: '/crawlers', handler: crawler.handler },
        { routePath: '/groups', handler: group.handler },
        { routePath: '/posts', handler: post.handler },
        { routePath: '/products', handler: product.handler },
      ],
    })

    this.apiUrl = api.url
    new cdk.CfnOutput(this, 'apiUrl', { value: this.apiUrl })
  }
}
