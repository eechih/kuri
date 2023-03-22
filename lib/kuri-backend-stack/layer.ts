import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { join } from 'path'

export default class Layer extends Construct {
  public readonly chromium: lambda.LayerVersion

  constructor(scope: Construct, id: string) {
    super(scope, id)

    const backendDir = join(__dirname, '..', '..', 'backend')

    this.chromium = new lambda.LayerVersion(this, 'Chromium', {
      code: lambda.Code.fromAsset(join(backendDir, 'layers', 'chromium')),
      layerVersionName: 'chromium',
      description: 'Chromium v111',
      compatibleArchitectures: [lambda.Architecture.X86_64],
      compatibleRuntimes: [
        lambda.Runtime.NODEJS_14_X,
        lambda.Runtime.NODEJS_16_X,
        lambda.Runtime.NODEJS_18_X,
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
  }
}
