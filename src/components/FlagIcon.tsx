import React from "react";
import { getCurrencyInfo } from "@/lib/currencies";

// Map currency code → ISO 3166-1 alpha-2 country code for flag
const CURRENCY_TO_COUNTRY: Record<string, string> = {
  AED: "ae", AFN: "af", ALL: "al", AMD: "am", ANG: "cw", AOA: "ao", ARS: "ar",
  AUD: "au", AWG: "aw", AZN: "az", BAM: "ba", BBD: "bb", BDT: "bd", BGN: "bg",
  BHD: "bh", BIF: "bi", BMD: "bm", BND: "bn", BOB: "bo", BRL: "br", BSD: "bs",
  BTN: "bt", BWP: "bw", BYN: "by", BZD: "bz", CAD: "ca", CDF: "cd", CHF: "ch",
  CLP: "cl", CNY: "cn", COP: "co", CRC: "cr", CUP: "cu", CVE: "cv", CZK: "cz",
  DJF: "dj", DKK: "dk", DOP: "do", DZD: "dz", EGP: "eg", ERN: "er", ETB: "et",
  EUR: "eu", FJD: "fj", FKP: "fk", GBP: "gb", GEL: "ge", GHS: "gh", GIP: "gi",
  GMD: "gm", GNF: "gn", GTQ: "gt", GYD: "gy", HKD: "hk", HNL: "hn", HRK: "hr",
  HTG: "ht", HUF: "hu", IDR: "id", ILS: "il", INR: "in", IQD: "iq", IRR: "ir",
  ISK: "is", JMD: "jm", JOD: "jo", JPY: "jp", KES: "ke", KGS: "kg", KHR: "kh",
  KMF: "km", KPW: "kp", KRW: "kr", KWD: "kw", KYD: "ky", KZT: "kz", LAK: "la",
  LBP: "lb", LKR: "lk", LRD: "lr", LSL: "ls", LYD: "ly", MAD: "ma", MDL: "md",
  MGA: "mg", MKD: "mk", MMK: "mm", MNT: "mn", MOP: "mo", MRU: "mr", MUR: "mu",
  MVR: "mv", MWK: "mw", MXN: "mx", MYR: "my", MZN: "mz", NAD: "na", NGN: "ng",
  NIO: "ni", NOK: "no", NPR: "np", NZD: "nz", OMR: "om", PAB: "pa", PEN: "pe",
  PGK: "pg", PHP: "ph", PKR: "pk", PLN: "pl", PYG: "py", QAR: "qa", RON: "ro",
  RSD: "rs", RUB: "ru", RWF: "rw", SAR: "sa", SBD: "sb", SCR: "sc", SDG: "sd",
  SEK: "se", SGD: "sg", SHP: "sh", SLL: "sl", SOS: "so", SRD: "sr", STN: "st",
  SVC: "sv", SYP: "sy", SZL: "sz", THB: "th", TJS: "tj", TMT: "tm", TND: "tn",
  TOP: "to", TRY: "tr", TTD: "tt", TWD: "tw", TZS: "tz", UAH: "ua", UGX: "ug",
  USD: "us", UYU: "uy", UZS: "uz", VES: "ve", VND: "vn", VUV: "vu", WST: "ws",
  XAF: "cm", XCD: "ag", XOF: "sn", XPF: "pf", YER: "ye", ZAR: "za", ZMW: "zm",
  ZWL: "zw",
};

function getCountryCode(currencyCode: string): string | null {
  return CURRENCY_TO_COUNTRY[currencyCode] ?? null;
}

interface FlagIconProps {
  currencyCode: string;
  size?: number;
  className?: string;
}

const FlagIcon: React.FC<FlagIconProps> = ({ currencyCode, size = 24, className = "" }) => {
  const country = getCountryCode(currencyCode);
  if (!country) return null;

  return (
    <img
      src={`https://flagcdn.com/w80/${country}.png`}
      srcSet={`https://flagcdn.com/w160/${country}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt={currencyCode}
      className={`inline-block rounded-sm object-cover ${className}`}
      loading="lazy"
    />
  );
};

export default FlagIcon;
