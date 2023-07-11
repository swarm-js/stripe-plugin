export interface StripePluginOptions {
  prefix: string
  endpointSecret: string
  secretKey: string
  controllerName: string
  model: any
  onPaymentSuccess: (user: any, metadata: string) => unknown
}
