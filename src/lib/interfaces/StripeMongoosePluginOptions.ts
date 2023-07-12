export interface StripeMongoosePluginOptions {
  secretKey: string
  firstnameField: string
  lastnameField: string
  emailField: string
  phoneField: string
  addressLine1Field: string
  addressLine2Field: string
  addressPostalCodeField: string
  addressCityField: string
  addressStateField: string
  addressCountryField: string
  paymentMethodTypes: string[]
}
