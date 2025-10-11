declare module 'yookassa' {
  export class YooKassa {
    constructor(config: { shopId: string; secretKey: string });
    
    createPayment(paymentData: {
      amount: { value: string; currency: string };
      capture: boolean;
      confirmation: { type: string; return_url?: string };
      description: string;
      metadata?: Record<string, string>;
    }): Promise<{
      id: string;
      status: string;
      amount: { value: string; currency: string };
      confirmation?: { confirmation_url?: string };
      description: string;
      metadata?: Record<string, string>;
    }>;
    
    getPayment(paymentId: string): Promise<{
      id: string;
      status: string;
      amount: { value: string; currency: string };
      description: string;
      metadata?: Record<string, string>;
    }>;
    
    cancelPayment(paymentId: string): Promise<{
      id: string;
      status: string;
    }>;
  }
} 