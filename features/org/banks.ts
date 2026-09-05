/**
 * Static controlled Nigerian bank list for MVP.
 * No free-text fallback — BE expects controlled bank_code + bank_name pair.
 * Invalid/stale names create avoidable verification failures (KIV-FE-017 decision #2).
 * Codes align with NIBSS / Paystack bank codes.
 */
export const NIGERIAN_BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank Nigeria" },
  { code: "063", name: "Diamond Bank" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "084", name: "Enterprise Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "030", name: "Heritage Bank" },
  { code: "301", name: "Jaiz Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "076", name: "Skye Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "068", name: "Standard Chartered Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "100", name: "Suntrust Bank" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "033", name: "United Bank For Africa" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
  { code: "101", name: "Providus Bank" },
  { code: "50211", name: "Kuda Bank" },
  { code: "999991", name: "PalmPay" },
  { code: "999992", name: "OPay" },
  { code: "50515", name: "Moniepoint MFB" },
] as const;

/** De-duplicated by code — last write wins, sorted by name */
export const NIGERIAN_BANKS_DEDUPED = (() => {
  const map = new Map<string, { code: string; name: string }>();
  for (const b of NIGERIAN_BANKS) map.set(b.code, { code: b.code, name: b.name });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
})();

export type NigerianBank = (typeof NIGERIAN_BANKS_DEDUPED)[number];

export function findBankByCode(code: string): NigerianBank | undefined {
  return NIGERIAN_BANKS_DEDUPED.find((b) => b.code === code);
}
