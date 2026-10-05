/** Display-only money formatting. Never performs financial arithmetic. */

const DECIMAL_STRING = /^([+-]?)(\d+)(?:\.(\d+))?$/;

function decimalSeparator(locale: string): string {
  return (
    new Intl.NumberFormat(locale)
      .formatToParts(1.1)
      .find((part) => part.type === "decimal")?.value ?? "."
  );
}

function roundForCurrency(
  amount: string,
  fractionDigits: number,
): {
  negative: boolean;
  integer: bigint;
  fraction: string;
} {
  const match = DECIMAL_STRING.exec(amount);
  if (!match) {
    throw new Error("Money display requires a canonical decimal string.");
  }

  const negative = match[1] === "-";
  const integerPart = BigInt(match[2]);
  const rawFraction = match[3] ?? "";
  const scale = BigInt(10) ** BigInt(fractionDigits);
  const kept =
    fractionDigits === 0
      ? ""
      : rawFraction.slice(0, fractionDigits).padEnd(fractionDigits, "0");

  let scaled =
    integerPart * scale + (kept ? BigInt(kept) : BigInt(0));

  const firstDiscardedDigit = rawFraction[fractionDigits];
  if (firstDiscardedDigit && firstDiscardedDigit >= "5") {
    scaled += BigInt(1);
  }

  const roundedInteger =
    fractionDigits === 0 ? scaled : scaled / scale;
  const roundedFraction =
    fractionDigits === 0
      ? ""
      : (scaled % scale).toString().padStart(fractionDigits, "0");

  return {
    negative,
    integer: roundedInteger,
    fraction: roundedFraction,
  };
}

export function formatMoney(
  amount: string,
  currency: string,
  locale: string = "en",
): string {
  const currencyFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });
  const fractionDigits =
    currencyFormatter.resolvedOptions().maximumFractionDigits;
  if (fractionDigits === undefined) {
    throw new Error("Money display could not resolve currency minor units.");
  }

  const rounded = roundForCurrency(amount, fractionDigits);
  const signedInteger = rounded.negative ? -rounded.integer : rounded.integer;
  const integerFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const parts = integerFormatter.formatToParts(signedInteger);

  if (fractionDigits === 0) {
    return parts.map((part) => part.value).join("");
  }

  const lastNumericIndex = parts.reduce(
    (found, part, index) =>
      part.type === "integer" || part.type === "group" ? index : found,
    -1,
  );
  if (lastNumericIndex < 0) {
    throw new Error("Money display could not resolve an integer position.");
  }

  const separator = decimalSeparator(locale);
  const withFraction = [
    ...parts.slice(0, lastNumericIndex + 1),
    { type: "decimal", value: separator },
    { type: "fraction", value: rounded.fraction },
    ...parts.slice(lastNumericIndex + 1),
  ];

  return withFraction.map((part) => part.value).join("");
}

export function formatCompactMoney(
  amount: string,
  currency: string,
  locale: string = "en",
): string {
  if (!DECIMAL_STRING.test(amount)) {
    throw new Error("Compact money display requires a canonical decimal string.");
  }
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    throw new Error("Compact money display amount is outside the supported range.");
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(numeric);
}
