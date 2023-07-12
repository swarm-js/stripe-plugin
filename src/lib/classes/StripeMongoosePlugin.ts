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
    phoneField: '',
    addressLine1Field: '',
    addressLine2Field: '',
    addressPostalCodeField: '',
    addressCityField: '',
    addressStateField: '',
    addressCountryField: '',
    localeField: '',
    secretKey: '',
    paymentMethodTypes: ['card'],
    invoiceLang: 'auto',
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
        name: `${this.get(conf.firstnameField)} ${this.get(
          conf.lastnameField
        )}`,
        email: this.get(conf.emailField),
        phone: conf.phoneField ? this.get(conf.phoneField) : '',
        address: {
          line1: conf.addressLine1Field ? this.get(conf.addressLine1Field) : '',
          line2: conf.addressLine2Field ? this.get(conf.addressLine2Field) : '',
          postal_code: conf.addressPostalCodeField
            ? this.get(conf.addressPostalCodeField)
            : '',
          city: conf.addressCityField ? this.get(conf.addressCityField) : '',
          state: conf.addressStateField ? this.get(conf.addressStateField) : '',
          country: conf.addressCountryField
            ? this.get(conf.addressCountryField)
            : ''
        },
        preferred_locales: conf.localeField ? [this.get(conf.localeField)] : []
      })
      this.swarmStripeId = customer.id
    } else if (
      this.isModified(conf.firstnameField) ||
      this.isModified(conf.lastnameField) ||
      this.isModified(conf.emailField) ||
      (conf.phoneField && this.isModified(conf.phoneField)) ||
      (conf.addressLine1Field && this.isModified(conf.addressLine1Field)) ||
      (conf.addressLine2Field && this.isModified(conf.addressLine2Field)) ||
      (conf.addressPostalCodeField &&
        this.isModified(conf.addressPostalCodeField)) ||
      (conf.addressCityField && this.isModified(conf.addressCityField)) ||
      (conf.addressStateField && this.isModified(conf.addressStateField)) ||
      (conf.addressCountryField && this.isModified(conf.addressCountryField)) ||
      (conf.localeField && this.isModified(conf.localeField))
    ) {
      // If informations are updated, keep Stripe synced
      await stripe.customers.update(this.swarmStripeId, {
        name: `${this[conf.firstnameField]} ${this[conf.lastnameField]}`,
        email: this[conf.emailField],
        phone: conf.phoneField ? this.get(conf.phoneField) : '',
        address: {
          line1: conf.addressLine1Field ? this.get(conf.addressLine1Field) : '',
          line2: conf.addressLine2Field ? this.get(conf.addressLine2Field) : '',
          postal_code: conf.addressPostalCodeField
            ? this.get(conf.addressPostalCodeField)
            : '',
          city: conf.addressCityField ? this.get(conf.addressCityField) : '',
          state: conf.addressStateField ? this.get(conf.addressStateField) : '',
          country: conf.addressCountryField
            ? this.get(conf.addressCountryField)
            : ''
        },
        preferred_locales: conf.localeField ? [this.get(conf.localeField)] : []
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
        locale: conf.localeField
          ? this.get(conf.localeField)
          : conf.invoiceLang,
        cancel_url: cancel_url ?? success_url,
        customer: this.swarmStripeId,
        automatic_tax: {
          enabled: true
        },
        invoice_creation: {
          enabled: true
        },
        payment_method_types: ['card'],
        payment_intent_data: { setup_future_usage: 'on_session' },
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
