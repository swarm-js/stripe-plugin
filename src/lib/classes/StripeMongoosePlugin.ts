import { StripeMongoosePluginOptions } from '../interfaces/StripeMongoosePluginOptions'
import {} from 'http-errors'
import { Mail } from '@swarmjs/mail'

export function StripeMongoosePlugin (
  schema: any,
  options: Partial<StripeMongoosePluginOptions>
): void {
  const conf: StripeMongoosePluginOptions = {
    privateKey: '',
    secretKey: '',
    ...options
  }

  schema.add({
    swarmUserAccess: [String],
    swarmValidated: { [schema.get('typeKey')]: Boolean, default: false },
    swarmValidationCode: { [schema.get('typeKey')]: String },
    swarmMagicLinkCode: { [schema.get('typeKey')]: String },
    swarmMagicLinkValidity: { [schema.get('typeKey')]: Number }
  })

  schema.static('invite', async function invite () {})
}
