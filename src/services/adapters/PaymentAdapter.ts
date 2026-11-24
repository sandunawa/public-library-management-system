export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: 'LKR' | 'USD';
  itemsDescription: string;
  patronName: string;
  patronEmail: string;
  patronPhone: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  transactionId?: string;
  error?: string;
}

export interface PaymentGatewayAdapter {
  readonly gatewayName: string;
  createCheckoutSession(req: PaymentRequest): Promise<{ checkoutUrl?: string; params?: Record<string, string> }>;
  verifyWebhookSignature(payload: any, signature: string): Promise<PaymentVerificationResult>;
}

/**
 * PayHere Sri Lanka Payment Gateway Adapter (Sandbox-First)
 * Handles LKR fine settlements and membership subscriptions.
 */
export class PayHereAdapter implements PaymentGatewayAdapter {
  readonly gatewayName = 'PAYHERE_LK';

  private merchantId: string;
  private merchantSecret: string;
  private isSandbox: boolean;

  constructor(merchantId = '1211149', merchantSecret = 'fakePayHereSecretKey', isSandbox = true) {
    this.merchantId = merchantId;
    this.merchantSecret = merchantSecret;
    this.isSandbox = isSandbox;
  }

  async createCheckoutSession(req: PaymentRequest) {
    const actionUrl = this.isSandbox
      ? 'https://sandbox.payhere.lk/pay/checkout'
      : 'https://www.payhere.lk/pay/checkout';

    return {
      checkoutUrl: actionUrl,
      params: {
        merchant_id: this.merchantId,
        return_url: `${window.location.origin}/account/fines?payment=success`,
        cancel_url: `${window.location.origin}/account/fines?payment=cancel`,
        notify_url: 'https://api.libraryos.lk/payhere-notify',
        order_id: req.orderId,
        items: req.itemsDescription,
        currency: req.currency,
        amount: req.amount.toFixed(2),
        first_name: req.patronName,
        email: req.patronEmail,
        phone: req.patronPhone,
      },
    };
  }

  async verifyWebhookSignature(payload: any, signature: string): Promise<PaymentVerificationResult> {
    // In production, compute md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + md5(merchant_secret))
    if (!payload.order_id || !payload.payment_id) {
      return { verified: false, error: 'Invalid payload parameters' };
    }
    return { verified: true, transactionId: payload.payment_id };
  }
}
