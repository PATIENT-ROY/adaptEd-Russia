// Тестовые данные для sandbox режима
export const TEST_CARDS = {
  SUCCESS: '4111111111111111',
  FAILURE: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
  EXPIRED: '4000000000000069',
  INVALID_CVC: '4000000000000127',
};

export const TEST_SBP_PHONES = {
  SUCCESS: '+79001234567',
  FAILURE: '+79001234568',
};

// Заглушка для тестирования платежей
const createMockPayment = (amount: number, description: string, metadata?: Record<string, string>) => {
  const paymentId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: paymentId,
    status: 'pending',
    amount: {
      value: amount.toFixed(2),
      currency: 'RUB',
    },
    confirmation: {
      type: 'redirect',
      confirmation_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/callback?payment_id=${paymentId}`,
    },
    description,
    metadata: {
      ...metadata,
      test_mode: 'true',
    },
  };
};

// Функция для создания платежа
export const createPayment = async (amount: number, description: string, metadata?: Record<string, string>) => {
  console.log('Creating test payment:', { amount, description, metadata });
  
  // Имитируем задержку сети
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return createMockPayment(amount, description, metadata);
};

// Функция для получения информации о платеже
export const getPayment = async (paymentId: string) => {
  console.log('Getting test payment:', paymentId);
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    id: paymentId,
    status: 'succeeded',
    amount: {
      value: '299.00',
      currency: 'RUB',
    },
    description: 'Test payment',
    metadata: {
      test_mode: 'true',
    },
  };
};

// Функция для отмены платежа
export const cancelPayment = async (paymentId: string) => {
  console.log('Canceling test payment:', paymentId);
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    id: paymentId,
    status: 'canceled',
  };
};

// Функция для проверки статуса платежа
export const checkPaymentStatus = async (paymentId: string) => {
  console.log('Checking test payment status:', paymentId);
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return {
    id: paymentId,
    status: 'succeeded',
    amount: {
      value: '299.00',
      currency: 'RUB',
    },
    description: 'Test payment',
    metadata: {
      test_mode: 'true',
    },
  };
};

export default {
  createPayment,
  getPayment,
  cancelPayment,
  checkPaymentStatus,
}; 