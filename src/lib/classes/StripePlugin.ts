import { StripePluginOptions } from '../interfaces/StripePluginOptions'
import Stripe from 'stripe'

let swarm: any
let conf: StripePluginOptions

export class StripePlugin {
  static setup (instance: any, options: Partial<StripePluginOptions> = {}) {
    swarm = instance
    conf = {
      prefix: '/stripe',
      endpointSecret: '',
      secretKey: '',
      controllerName: 'Stripe',
      model: null,
      onPaymentSuccess: _ => {},
      ...options
    }

    if (conf.model === null) throw new Error('User model not defined.')

    instance.controllers.addController(conf.controllerName, {
      title: 'Stripe',
      description: 'Handles Stripe webhooks',
      prefix: conf.prefix,
      root: true
    })

    instance.controllers.addMethod(
      conf.controllerName,
      StripePlugin.webhook(swarm, conf),
      {
        method: 'POST',
        route: '/webhook',
        title: 'Receive webhooks'
      }
    )
  }

  static webhook (_: any, conf: StripePluginOptions) {
    return async function webhook (request: any) {
      const stripe = new Stripe(conf.secretKey, {
        apiVersion: '2022-11-15',
        typescript: true
      })

      const sig = request.headers['stripe-signature']

      let event: Stripe.Event = stripe.webhooks.constructEvent(
        request.rawBody,
        sig,
        conf.endpointSecret
      )

      const data: Stripe.Event.Data = event.data
      const eventType: string = event.type

      if (eventType === 'checkout.session.completed') {
        const checkout = data.object as any
        const user = await conf.model.findOne({
          swarmStripeId: checkout.customer
        })

        if (user) {
          conf.onPaymentSuccess(user, checkout.metadata.swarmjs, checkout)
        }
      }
    }
  }
}
