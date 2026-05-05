export function getCurrencySymbol(market: string): string {
  if (market === 'IN') return '₹';
  if (market === 'EU') return '€';
  return '$';
}

export function formatCurrency(value: number, market: string, digits = 2): string {
  const symbol = getCurrencySymbol(market);
  return `${symbol}${value.toFixed(digits)}`;
}

export function formatCurrencyPrecision(value: number, market: string, precision = 5): string {
  const symbol = getCurrencySymbol(market);
  return `${symbol}${value.toPrecision(precision)}`;
}

export function formatCompactCurrency(value: number, market: string, digits = 1, suffix = ''): string {
  const symbol = getCurrencySymbol(market);
  return `${symbol}${value.toFixed(digits)}${suffix}`;
}
