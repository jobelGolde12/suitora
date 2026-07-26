/**
 * Currency formatting utilities.
 * Detects user locale from the browser and formats prices accordingly.
 */

/**
 * Map of locale → currency code for reliable currency detection.
 * `Intl.NumberFormat` with `style: "currency"` usually gets this right,
 * but this explicit map ensures correctness across all browsers.
 */
const LOCALE_TO_CURRENCY: Record<string, string> = {
  // Philippines
  "en-PH": "PHP",
  "fil-PH": "PHP",
  "tl-PH": "PHP",
  // United States
  "en-US": "USD",
  // United Kingdom
  "en-GB": "GBP",
  // Europe
  "de-DE": "EUR",
  "fr-FR": "EUR",
  "it-IT": "EUR",
  "es-ES": "EUR",
  "nl-NL": "EUR",
  "pt-PT": "EUR",
  "el-GR": "EUR",
  "fi-FI": "EUR",
  "sv-SE": "EUR",
  "nb-NO": "NOK",
  "da-DK": "DKK",
  "pl-PL": "PLN",
  "cs-CZ": "CZK",
  "hu-HU": "HUF",
  "ro-RO": "RON",
  "bg-BG": "BGN",
  "hr-HR": "EUR",
  // Asia
  "ja-JP": "JPY",
  "ko-KR": "KRW",
  "zh-CN": "CNY",
  "zh-TW": "TWD",
  "zh-HK": "HKD",
  "th-TH": "THB",
  "vi-VN": "VND",
  "id-ID": "IDR",
  "ms-MY": "MYR",
  "pt-BR": "BRL",
  "es-MX": "MXN",
  "es-AR": "ARS",
  "es-CL": "CLP",
  "es-CO": "COP",
  "es-PE": "PEN",
  // Middle East / Africa
  "ar-SA": "SAR",
  "ar-AE": "AED",
  "ar-EG": "EGP",
  "he-IL": "ILS",
  "tr-TR": "TRY",
  "en-ZA": "ZAR",
  "en-NG": "NGN",
  "sw-KE": "KES",
  // Oceania
  "en-AU": "AUD",
  "en-NZ": "NZD",
  // Canada
  "en-CA": "CAD",
  "fr-CA": "CAD",
  // India
  "en-IN": "INR",
  "hi-IN": "INR",
  // Russia
  "ru-RU": "RUB",
  // Switzerland
  "de-CH": "CHF",
  "fr-CH": "CHF",
  "it-CH": "CHF",
};

/**
 * Detect the user's currency code from their browser locale.
 * Falls back to "USD" if the locale is not recognized.
 */
export function getUserCurrency(): string {
  if (typeof navigator === "undefined") return "USD";
  const locale = navigator.language;

  // Try exact match first
  if (LOCALE_TO_CURRENCY[locale]) return LOCALE_TO_CURRENCY[locale];

  // Try language-only match (e.g. "en" → "USD", "es" → "EUR", "pt" → "BRL")
  const lang = locale.split("-")[0];
  const langDefaults: Record<string, string> = {
    en: "USD",
    es: "EUR",
    fr: "EUR",
    de: "EUR",
    it: "EUR",
    pt: "BRL",
    ja: "JPY",
    ko: "KRW",
    zh: "CNY",
    th: "THB",
    vi: "VND",
    id: "IDR",
    ms: "MYR",
    ar: "SAR",
    he: "ILS",
    tr: "TRY",
    ru: "RUB",
    sw: "KES",
    hi: "INR",
    nl: "EUR",
    pl: "PLN",
    cs: "CZK",
    hu: "HUF",
    ro: "RON",
    bg: "BGN",
    el: "EUR",
    fi: "EUR",
    sv: "SEK",
    nb: "NOK",
    da: "DKK",
    hr: "EUR",
  };

  return langDefaults[lang] ?? "USD";
}

/**
 * Format a price in the user's local currency.
 * Uses the browser's Intl API to format with the correct symbol, grouping, and decimals.
 *
 * @param price - The numeric price value
 * @param fallbackCurrency - The source currency from the data (if known, e.g. "USD")
 * @returns Formatted price string like "₱6,912" or "$128" or null if no price
 */
export function formatLocalPrice(
  price: number | null | undefined,
  fallbackCurrency?: string | null
): string | null {
  if (price == null) return null;

  const userCurrency = getUserCurrency();
  const locale = typeof navigator !== "undefined" ? navigator.language : "en-US";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: userCurrency,
      maximumFractionDigits: userCurrency === "JPY" || userCurrency === "KRW" ? 0 : 0,
    }).format(price);
  } catch {
    // Fallback: show as USD if Intl fails
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: fallbackCurrency || "USD",
        maximumFractionDigits: 0,
      }).format(price);
    } catch {
      return `$${Math.round(price)}`;
    }
  }
}

/**
 * Create a locale-aware Intl.NumberFormat for repeat use.
 * Useful inside React components that render many prices.
 */
export function createPriceFormatter() {
  const locale = typeof navigator !== "undefined" ? navigator.language : "en-US";
  const currency = getUserCurrency();

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }
}
