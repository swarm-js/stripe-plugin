import { StripeMongoosePluginOptions } from '../interfaces/StripeMongoosePluginOptions'
import {} from 'http-errors'
import Stripe from 'stripe'
import { StripeLine } from '../interfaces/StripeLine'

export function StripeMongoosePlugin (
  schema: any,
  options: Partial<StripeMongoosePluginOptions>
): void {
  const conf: StripeMongoosePluginOptions = {
    firstnameField: 'firstname',
    lastnameField: 'lastname',
    emailField: 'email',
    secretKey: '',
    ...options
  }

  if (!conf.secretKey) throw new Error('Stripe secret key is not set.')

  const stripe = new Stripe(conf.secretKey, { apiVersion: '2022-11-15' })

  schema.add({
    swarmStripeId: String
  })

  schema.pre('save', async function (next: any) {
    // If no customer is attached to this user, create one
    if (!this.swarmStripeId) {
      const customer = await stripe.customers.create({
        name: `${this[conf.firstnameField]} ${this[conf.lastnameField]}`,
        email: this[conf.emailField]
      })
      this.swarmStripeId = customer.id
    } else if (
      this.isModified(conf.firstnameField) ||
      this.isModified(conf.lastnameField) ||
      this.isModified(conf.emailField)
    ) {
      // If informations are updated, keep Stripe synced
      await stripe.customers.update(this.swarmStripeId, {
        name: `${this[conf.firstnameField]} ${this[conf.lastnameField]}`,
        email: this[conf.emailField]
      })
    }

    return next()
  })

  schema.method(
    'getStripePortalURL',
    async function getStripePortalURL (redirectUrl: string) {
      const session = await stripe.billingPortal.sessions.create({
        customer: this.swarmStripeId,
        return_url: redirectUrl
      })

      return session.url
    }
  )

  schema.method(
    'createCheckoutSession',
    async function createCheckoutSession (
      lines: StripeLine[],
      success_url: string,
      cancel_url: string | null = null,
      metadata: string = ''
    ) {
      const session = await stripe.checkout.sessions.create({
        line_items: lines.map((line: StripeLine) => ({
          price_data: {
            currency: line.currency,
            product_data: {
              name: line.name
            },
            unit_amount: line.unit * 100
          },
          quantity: line.qty
        })),
        mode: 'payment',
        success_url,
        cancel_url: cancel_url ?? success_url,
        customer: this.swarmStripeId,
        metadata: {
          swarmjs: metadata
        }
      })
      return session.url
    }
  )

  schema.method(
    'getCheckoutSession',
    async function getCheckoutSession (id: string) {
      return await stripe.checkout.sessions.retrieve(id)
    }
  )
}
