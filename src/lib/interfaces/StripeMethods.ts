import { StripeLine } from './StripeLine'

export interface StripeMethods {
  getStripePortalURL(redirectUrl: string): Promise<string>
  createCheckoutSession(
    lines: StripeLine[],
    success_url: string,
    cancel_url?: string | null,
    metadata?: string
  ): Promise<string>
  getCheckoutSession(id: string): Promise<any>
}
