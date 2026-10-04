/** Display-only — never calc. Pass Decimal string from BE. */
export function formatMoney(
  amount: string,
  currency: string,
  locale: string = "en",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(Number(amount));
}

export function formatCompactMoney(
  amount: string,
  currency: string,
  locale: string = "en",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(amount));
}
