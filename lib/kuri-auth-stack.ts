import * as cdk from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import { Construct } from 'constructs'

const OAUTH_SCOPES: cognito.OAuthScope[] = [
  // cognito.OAuthScope.PHONE,
  // cognito.OAuthScope.EMAIL,
  cognito.OAuthScope.OPENID,
  // cognito.OAuthScope.PROFILE,
]

const CALLBACK_URL = 'http://localhost:3000/api/auth/callback/cognito'

interface KuriAuthProps extends cdk.StackProps {
  readonly domain: string

  /**
   * @defaultValue `auth`
   */
  readonly subdomain?: string
}

export default class KuriAuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: KuriAuthProps) {
    super(scope, id, props)

    const { domain, subdomain = 'auth' } = props

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'kuri-user-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: false,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    new cdk.CfnOutput(this, 'userPoolId', { value: userPool.userPoolId })

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: userPool,
      authFlows: {
        adminUserPassword: true,
        custom: true,
        userSrp: true,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      oAuth: {
        callbackUrls: [CALLBACK_URL],
        scopes: OAUTH_SCOPES,
      },
      generateSecret: true,
    })

    new cdk.CfnOutput(this, 'userPoolClientId', {
      value: userPoolClient.userPoolClientId,
    })

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domain,
    })

    const authDomainName = subdomain + '.' + domain

    // TLS certificate
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: authDomainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    })

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificate.certificateArn,
    })

    const userPoolDomain = new cognito.UserPoolDomain(this, 'UserPoolDomain', {
      userPool: userPool,

      customDomain: {
        domainName: authDomainName,
        certificate: certificate,
      },
    })

    // Route53 alias record
    new route53.ARecord(this, 'ARecord', {
      recordName: authDomainName,
      target: route53.RecordTarget.fromAlias(
        new targets.UserPoolDomainTarget(userPoolDomain)
      ),
      zone: hostedZone,
    })

    const authScope = OAUTH_SCOPES.map(scope => scope.scopeName).join('+')
    const loginUrl = `https://${authDomainName}/login?client_id=${userPoolClient.userPoolClientId}&response_type=code&scope=${authScope}&redirect_uri=${CALLBACK_URL}`
    new cdk.CfnOutput(this, 'LoginUrl', { value: loginUrl })
  }
}
