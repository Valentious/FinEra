/**
 * FinEra - Country-specific payment options
 * Fetched dynamically based on country_code
 */

export interface PaymentCategory {
  id: string;
  label: string;
  items: { id: string; label: string; icon?: string }[];
}

export interface PaymentGateway {
  id: string;
  label: string;
  icon?: string;
}

/** Zimbabwe payment options */
export const ZIMBABWE_PAYMENTS = {
  categories: [
    {
      id: "airtime",
      label: "Airtime & Tokens",
      items: [
        { id: "econet", label: "Econet Airtime" },
        { id: "onemoney", label: "OneMoney" },
        { id: "netone", label: "NetOne" },
        { id: "telecel", label: "Telecel" },
      ],
    },
    {
      id: "electricity",
      label: "Electricity",
      items: [{ id: "zesa", label: "ZESA Tokens (Prepaid Electricity)" }],
    },
    {
      id: "water",
      label: "Water",
      items: [{ id: "zinwa", label: "ZINWA Bills" }],
    },
    {
      id: "education",
      label: "Education",
      items: [{ id: "tuition", label: "Tuition Fees" }],
    },
    {
      id: "insurance",
      label: "Insurance",
      items: [{ id: "insurance", label: "Insurance Premiums" }],
    },
  ] as PaymentCategory[],
  gateways: [
    { id: "ecocash", label: "EcoCash" },
    { id: "onemoney", label: "OneMoney" },
    { id: "innbucks", label: "InnBucks" },
    { id: "telecash", label: "TeleCash" },
  ] as PaymentGateway[],
};

/** Default/fallback for other countries */
export const DEFAULT_PAYMENTS = {
  categories: [
    {
      id: "bills",
      label: "Bills & Utilities",
      items: [
        { id: "electricity", label: "Electricity" },
        { id: "water", label: "Water" },
        { id: "tuition", label: "Tuition Fees" },
      ],
    },
  ] as PaymentCategory[],
  gateways: [
    { id: "mobilemoney", label: "Mobile Money" },
    { id: "bank", label: "Bank Transfer" },
  ] as PaymentGateway[],
};

export function getPaymentOptionsByCountry(countryCode: string) {
  if (countryCode === "zw" || countryCode === "ZW") return ZIMBABWE_PAYMENTS;
  return DEFAULT_PAYMENTS;
}
