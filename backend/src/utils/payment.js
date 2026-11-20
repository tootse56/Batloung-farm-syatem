const round = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Business rule: derive PAID / PARTIALLY_PAID / UNPAID from the amounts.
function paymentStatus(total, paid) {
  if (paid >= total && total > 0) return 'PAID';
  if (paid > 0) return 'PARTIALLY_PAID';
  return 'UNPAID';
}

// Business rule: the total is always calculated by the server, never typed in.
function calculateTotal(lines) {
  return round(lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0));
}

module.exports = { round, paymentStatus, calculateTotal };
