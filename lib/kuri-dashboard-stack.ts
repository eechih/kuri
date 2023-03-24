import * as cdk from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsp from 'aws-cdk-lib/aws-ecs-patterns'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import * as path from 'path'

interface KuriDashboardStackProps extends cdk.StackProps {
  readonly domain: string

  readonly subdomain?: string

  readonly apiUrl?: string
}

export default class KuriDashboardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: KuriDashboardStackProps) {
    super(scope, id, props)

    const { domain, subdomain = 'dashboard', apiUrl } = props

    const domainName = subdomain + '.' + domain

    // Look up the default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
      isDefault: true,
    })

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domain,
    })

    // TLS certificate
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: domainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    })

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificate.certificateArn,
    })

    const cluster = new ecs.Cluster(this, 'Cluster', { vpc })

    const logging = new ecs.AwsLogDriver({
      streamPrefix: 'kuri-dashboard',
    })

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    })

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'TaskDefinition',
      {
        taskRole: taskRole,
      }
    )

    const imageBuildArgs: { [key: string]: string } = {}
    if (apiUrl) {
      new cdk.CfnOutput(this, 'apiUrl', { value: apiUrl })
      imageBuildArgs.API_URL = apiUrl
    }

    taskDefinition.addContainer('Container', {
      image: ecs.ContainerImage.fromAsset(
        path.resolve(__dirname, '..', 'dashboard'),
        {
          buildArgs: imageBuildArgs,
        }
      ),
      logging: logging,
      portMappings: [{ containerPort: 3000 }],
      cpu: 256,
      memoryLimitMiB: 512,
    })

    new ecsp.ApplicationLoadBalancedFargateService(this, 'FargateService', {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
      publicLoadBalancer: true,
      domainName: domainName,
      certificate: certificate,
      domainZone: hostedZone,
    })

    new cdk.CfnOutput(this, 'Url', {
      value: 'https://' + domainName,
    })
  }
}
