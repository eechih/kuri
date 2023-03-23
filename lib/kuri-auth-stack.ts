import * as cdk from 'aws-cdk-lib'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import { Construct } from 'constructs'

export default class KuriAuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

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

    const callbackUrl = 'http://localhost:3000'
    const scopes: cognito.OAuthScope[] = [
      cognito.OAuthScope.PHONE,
      cognito.OAuthScope.EMAIL,
      cognito.OAuthScope.OPENID,
      cognito.OAuthScope.PROFILE,
    ]

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
        callbackUrls: [callbackUrl],
        scopes: scopes,
      },
    })

    const userPoolDomain = new cognito.UserPoolDomain(this, 'UserPoolDomain', {
      userPool: userPool,
      cognitoDomain: {
        domainPrefix: 'kuri',
      },
    })

    new cdk.CfnOutput(this, 'userPoolId', { value: userPool.userPoolId })
    new cdk.CfnOutput(this, 'userPoolClientId', {
      value: userPoolClient.userPoolClientId,
    })

    const domainName = userPoolDomain.domainName
    const region = this.region
    const clientId = userPoolClient.userPoolClientId
    const responseType = 'code'
    const authScope = scopes.map(scope => scope.scopeName).join('+')
    const loginUrl = `https://${domainName}.auth.${region}.amazoncognito.com/login?client_id=${clientId}&response_type=${responseType}&scope=${authScope}&redirect_uri=${callbackUrl}`
    new cdk.CfnOutput(this, 'LoginUrl', { value: loginUrl })
  }
}
