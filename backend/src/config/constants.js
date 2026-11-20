module.exports = {
  PROVINCES: ['Gauteng', 'Free State', 'KwaZulu-Natal', 'Western Cape', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West'],
  SIZES: ['SMALL', 'MEDIUM', 'LARGE'],
  PAYMENT_METHODS: ['CASH', 'MOBILE_MONEY', 'CREDIT'],
  LOW_STOCK_THRESHOLD: Number(process.env.LOW_STOCK_THRESHOLD) || 15,
};
