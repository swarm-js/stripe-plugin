export interface StripeMongoosePluginOptions {
  secretKey: string
  firstnameField: string
  lastnameField: string
  emailField: string
  paymentMethodTypes: string[]
}
