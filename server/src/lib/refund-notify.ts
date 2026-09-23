import { sendRefundEmail } from './email';
import { createUserNotification } from './user-notifications';

export type RefundNotifyPayload = {
  userId: string;
  email: string;
  name: string;
  amount: number;
  currency: string;
  refundId: string;
};

export async function notifyPaymentRefund(payload: RefundNotifyPayload): Promise<void> {
  try {
    const emailResult = await sendRefundEmail({
      to: payload.email,
      name: payload.name,
      amount: payload.amount,
      currency: payload.currency,
      refundId: payload.refundId,
    });
    if (!emailResult.sent) {
      console.error('Refund email was not sent:', emailResult.error);
    }
  } catch (error) {
    console.error('Refund email error:', error);
  }

  await createUserNotification({
    userId: payload.userId,
    type: 'SYSTEM',
    title: 'Возврат средств',
    message: `Мы вернули ${payload.amount} ₽ на вашу карту.`,
    link: '/profile',
    entityType: 'payment_refund',
    entityId: payload.refundId,
  });
}
