import { StripePluginOptions } from '../interfaces/StripePluginOptions'

let swarm: any
let conf: StripePluginOptions

export class AuthPlugin {
  static setup (instance: any, options: Partial<StripePluginOptions> = {}) {
    swarm = instance
    conf = {
      prefix: '/stripe',
      endpointSecret: '',
      privateKey: '',
      secretKey: '',
      ...options
    }
  }
}
