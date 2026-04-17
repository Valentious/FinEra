/**
 * FinEra - Reference Data (Countries, Cities, Institutions)
 * Shared with frontend locations.ts - single source for API responses
 */

export interface Country {
  id: string;
  name: string;
  code: string;
}

export interface City {
  id: string;
  name: string;
  countryId: string;
}

export interface Institution {
  id: string;
  name: string;
  type: "university" | "polytechnic" | "company" | "government" | "research";
  cityId: string;
}

export const COUNTRIES: Country[] = [
  { id: "zw", name: "Zimbabwe", code: "ZW" },
  { id: "za", name: "South Africa", code: "ZA" },
  { id: "ke", name: "Kenya", code: "KE" },
  { id: "ng", name: "Nigeria", code: "NG" },
  { id: "gh", name: "Ghana", code: "GH" },
  { id: "tz", name: "Tanzania", code: "TZ" },
  { id: "ug", name: "Uganda", code: "UG" },
  { id: "zm", name: "Zambia", code: "ZM" },
  { id: "bw", name: "Botswana", code: "BW" },
  { id: "mz", name: "Mozambique", code: "MZ" },
  { id: "et", name: "Ethiopia", code: "ET" },
  { id: "rw", name: "Rwanda", code: "RW" },
  { id: "eg", name: "Egypt", code: "EG" },
  { id: "ma", name: "Morocco", code: "MA" },
  { id: "tn", name: "Tunisia", code: "TN" },
  { id: "gb", name: "United Kingdom", code: "GB" },
  { id: "us", name: "United States", code: "US" },
  { id: "ca", name: "Canada", code: "CA" },
  { id: "au", name: "Australia", code: "AU" },
  { id: "de", name: "Germany", code: "DE" },
  { id: "fr", name: "France", code: "FR" },
  { id: "nl", name: "Netherlands", code: "NL" },
  { id: "in", name: "India", code: "IN" },
  { id: "sg", name: "Singapore", code: "SG" },
];

const CITIES: City[] = [
  { id: "zw-hre", name: "Harare", countryId: "zw" },
  { id: "zw-bul", name: "Bulawayo", countryId: "zw" },
  { id: "zw-mut", name: "Mutare", countryId: "zw" },
  { id: "zw-gwe", name: "Gweru", countryId: "zw" },
  { id: "zw-mas", name: "Masvingo", countryId: "zw" },
  { id: "zw-kwe", name: "Kwekwe", countryId: "zw" },
  { id: "zw-chi", name: "Chitungwiza", countryId: "zw" },
  { id: "zw-vfa", name: "Victoria Falls", countryId: "zw" },
  { id: "za-jhb", name: "Johannesburg", countryId: "za" },
  { id: "za-cpt", name: "Cape Town", countryId: "za" },
  { id: "za-dbn", name: "Durban", countryId: "za" },
  { id: "za-pta", name: "Pretoria", countryId: "za" },
  { id: "za-bfn", name: "Bloemfontein", countryId: "za" },
  { id: "ke-nrb", name: "Nairobi", countryId: "ke" },
  { id: "ke-msa", name: "Mombasa", countryId: "ke" },
  { id: "ke-kis", name: "Kisumu", countryId: "ke" },
  { id: "ng-lag", name: "Lagos", countryId: "ng" },
  { id: "ng-abj", name: "Abuja", countryId: "ng" },
  { id: "ng-ibd", name: "Ibadan", countryId: "ng" },
  { id: "gh-acc", name: "Accra", countryId: "gh" },
  { id: "gh-kum", name: "Kumasi", countryId: "gh" },
  { id: "gb-lon", name: "London", countryId: "gb" },
  { id: "gb-man", name: "Manchester", countryId: "gb" },
  { id: "gb-bir", name: "Birmingham", countryId: "gb" },
  { id: "gb-edin", name: "Edinburgh", countryId: "gb" },
  { id: "us-nyc", name: "New York", countryId: "us" },
  { id: "us-la", name: "Los Angeles", countryId: "us" },
  { id: "us-chi", name: "Chicago", countryId: "us" },
  { id: "us-sf", name: "San Francisco", countryId: "us" },
  { id: "us-bos", name: "Boston", countryId: "us" },
];

const FALLBACK_CITIES: City[] = COUNTRIES.filter(
  (c) => !["zw", "za", "ke", "ng", "gh", "gb", "us"].includes(c.id)
).map((c) => ({
  id: `${c.id}-cap`,
  name: `${c.name} (Capital)`,
  countryId: c.id,
}));

/** Reference orgs for onboarding. Student / alumni pick universities only (no polytechnic / FE college sector). */
export const INSTITUTIONS: Institution[] = [
  { id: "uoz", name: "University of Zimbabwe", type: "university", cityId: "zw-hre" },
  { id: "nust", name: "National University of Science and Technology (NUST)", type: "university", cityId: "zw-bul" },
  { id: "mbu", name: "Midlands State University", type: "university", cityId: "zw-gwe" },
  { id: "buse", name: "Bindura University of Science Education", type: "university", cityId: "zw-hre" },
  { id: "lupane", name: "Lupane State University", type: "university", cityId: "zw-bul" },
  { id: "zrp", name: "Zimbabwe Republic Police", type: "government", cityId: "zw-hre" },
  { id: "zimra", name: "Zimbabwe Revenue Authority", type: "government", cityId: "zw-hre" },
  { id: "zec", name: "Zimbabwe Electoral Commission", type: "government", cityId: "zw-hre" },
  { id: "ecobank", name: "Ecobank Zimbabwe", type: "company", cityId: "zw-hre" },
  { id: "cbz", name: "CBZ Bank", type: "company", cityId: "zw-hre" },
  { id: "zimplats", name: "Zimplats", type: "company", cityId: "zw-hre" },
  { id: "zrc", name: "Zimbabwe Research Council", type: "research", cityId: "zw-hre" },
  { id: "uct", name: "University of Cape Town", type: "university", cityId: "za-cpt" },
  { id: "wits", name: "University of the Witwatersrand", type: "university", cityId: "za-jhb" },
  { id: "up", name: "University of Pretoria", type: "university", cityId: "za-pta" },
  { id: "sars", name: "South African Revenue Service", type: "government", cityId: "za-pta" },
  { id: "sap", name: "SAP South Africa", type: "company", cityId: "za-jhb" },
  { id: "uon", name: "University of Nairobi", type: "university", cityId: "ke-nrb" },
  { id: "kemu", name: "Kenyatta University", type: "university", cityId: "ke-nrb" },
  { id: "kra", name: "Kenya Revenue Authority", type: "government", cityId: "ke-nrb" },
  { id: "safaricom", name: "Safaricom PLC", type: "company", cityId: "ke-nrb" },
  { id: "ui", name: "University of Ibadan", type: "university", cityId: "ng-ibd" },
  { id: "unilag", name: "University of Lagos", type: "university", cityId: "ng-lag" },
  { id: "abu", name: "Ahmadu Bello University", type: "university", cityId: "ng-abj" },
  { id: "firs", name: "Federal Inland Revenue Service", type: "government", cityId: "ng-abj" },
  { id: "gtbank", name: "Guaranty Trust Bank", type: "company", cityId: "ng-lag" },
  { id: "oxford", name: "University of Oxford", type: "university", cityId: "gb-lon" },
  { id: "cambridge", name: "University of Cambridge", type: "university", cityId: "gb-lon" },
  { id: "ucl", name: "UCL", type: "university", cityId: "gb-lon" },
  { id: "imperial", name: "Imperial College London", type: "university", cityId: "gb-lon" },
  { id: "manchester", name: "University of Manchester", type: "university", cityId: "gb-man" },
  { id: "hmrc", name: "HM Revenue & Customs", type: "government", cityId: "gb-lon" },
  { id: "barclays", name: "Barclays PLC", type: "company", cityId: "gb-lon" },
  { id: "mit", name: "Massachusetts Institute of Technology", type: "university", cityId: "us-bos" },
  { id: "harvard", name: "Harvard University", type: "university", cityId: "us-bos" },
  { id: "stanford", name: "Stanford University", type: "university", cityId: "us-sf" },
  { id: "nyu", name: "New York University", type: "university", cityId: "us-nyc" },
  { id: "ucla", name: "UCLA", type: "university", cityId: "us-la" },
  { id: "irs", name: "Internal Revenue Service", type: "government", cityId: "us-nyc" },
  { id: "google", name: "Google LLC", type: "company", cityId: "us-sf" },
];

export function getCitiesByCountry(countryId: string): City[] {
  const fromMain = CITIES.filter((c) => c.countryId === countryId);
  if (fromMain.length > 0) return fromMain;
  return FALLBACK_CITIES.filter((c) => c.countryId === countryId);
}

export function getInstitutionsByCountryAndType(
  countryId: string,
  accountType: "student" | "staff" | "alumni"
): Institution[] {
  const cityIds = getCitiesByCountry(countryId).map((c) => c.id);
  const inCountry = INSTITUTIONS.filter((i) => cityIds.includes(i.cityId));
  if (accountType === "staff") return inCountry;
  return inCountry.filter((i) => i.type === "university");
}

/** Zimbabwe-only registration city list (must match auth.registerSchema city enum). */
export const ZW_REGISTRATION_CITIES: City[] = CITIES.filter((c) => c.countryId === "zw");

const ZW_REGISTRATION_CITY_ID_SET = new Set(ZW_REGISTRATION_CITIES.map((c) => c.id));

export const ZW_REGISTRATION_CITY_NAMES = [
  "Harare",
  "Bulawayo",
  "Mutare",
  "Gweru",
  "Masvingo",
  "Kwekwe",
  "Chitungwiza",
  "Victoria Falls",
] as const;

/** Zimbabwe registration institution picker: students and alumni — universities only; staff — all listed ZW orgs. */
export function getZimbabweRegistrationInstitutions(accountType: "student" | "staff" | "alumni"): Institution[] {
  const inZw = INSTITUTIONS.filter((i) => ZW_REGISTRATION_CITY_ID_SET.has(i.cityId));
  if (accountType === "student") {
    return inZw.filter((i) => i.type === "university");
  }
  if (accountType === "staff") {
    return inZw;
  }
  // Alumni: universities and other formal orgs in ZW (no polytechnic / FE college sector).
  return inZw.filter((i) => i.type !== "polytechnic");
}

/** Allowed institution display names for POST /auth/register (Zimbabwe onboarding). */
export function getZimbabweRegistrationInstitutionNames(accountType: "STUDENT" | "STAFF" | "ALUMNI"): string[] {
  const at = accountType.toLowerCase() as "student" | "staff" | "alumni";
  return getZimbabweRegistrationInstitutions(at).map((i) => i.name);
}
