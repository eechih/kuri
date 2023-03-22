#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import 'source-map-support/register'
import KuriBackendStack from '../lib/kuri-backend-stack'
import KuriDashboardStack from '../lib/kuri-dashboard-stack'
import KuriStack from '../lib/kuri-stack'

const domain = 'dev3.creditgodbackend.com.tw'

const env = { account: '089370838833', region: 'us-east-1' }

const app = new cdk.App()

new KuriStack(app, 'KuriStack')

const backend = new KuriBackendStack(app, 'KuriBackendStack', { env, domain })

new KuriDashboardStack(app, 'KuriDashboardStack', {
  env,
  domain,
  apiUrl: backend.apiUrl,
})
