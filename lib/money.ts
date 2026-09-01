/** Display-only — never calc. Pass Decimal string from BE. */
export function formatMoney(amount: string, currency: string = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(Number(amount));
}
