import * as apigw from '@aws-cdk/aws-apigatewayv2-alpha'
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import * as cdk from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import { Construct } from 'constructs'

type RouteHandler = {
  routePath: string
  handler: lambda.IFunction
}

interface ApiProps {
  domain: string
  subdomain: string
  routeHandlers: RouteHandler[]
}

export default class Api extends Construct {
  public readonly url: string

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id)

    const { domain, subdomain = 'api' } = props

    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: domain,
    })

    const domainName = subdomain + '.' + domain

    // TLS certificate
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: domainName,
      validation: acm.CertificateValidation.fromDns(zone),
    })

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificate.certificateArn,
    })

    const customDomain = new apigw.DomainName(this, 'CustomDomain', {
      domainName: domainName,
      certificate,
    })

    // Route53 alias record
    new route53.ARecord(this, 'ARecord', {
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayv2DomainProperties(
          customDomain.regionalDomainName,
          customDomain.regionalHostedZoneId
        )
      ),
      zone,
    })

    const httpApi = new apigw.HttpApi(this, 'HttpApi', {
      corsPreflight: {
        allowOrigins: ['http://localhost:3000'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: [
          apigw.CorsHttpMethod.OPTIONS,
          apigw.CorsHttpMethod.GET,
          apigw.CorsHttpMethod.POST,
          apigw.CorsHttpMethod.PUT,
          apigw.CorsHttpMethod.PATCH,
          apigw.CorsHttpMethod.DELETE,
        ],
        allowCredentials: true,
      },
      defaultDomainMapping: {
        domainName: customDomain,
      },
      disableExecuteApiEndpoint: true,
    })

    const methods = [
      apigw.HttpMethod.OPTIONS,
      apigw.HttpMethod.GET,
      apigw.HttpMethod.POST,
      apigw.HttpMethod.PUT,
      apigw.HttpMethod.PATCH,
      apigw.HttpMethod.DELETE,
    ]

    props.routeHandlers.forEach(({ routePath, handler }) => {
      const integration = new integrations.HttpLambdaIntegration(
        'Integration',
        handler
      )
      httpApi.addRoutes({ path: routePath, methods, integration })
      httpApi.addRoutes({ path: `${routePath}/{proxy+}`, methods, integration })
    })

    this.url = 'https://' + domainName
  }
}
