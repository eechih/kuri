import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

export default class KuriStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)
  }
}
