/**
 * FinEra - Digitally Enabled Countries & Institutions
 * Pre-filtered list of nations with approved digital technology status.
 * Institutions filtered by country for profile completion.
 */

export interface Institution {
  id: string;
  name: string;
  type: "university" | "polytechnic" | "company" | "government" | "research";
  cityId: string;
}

export interface City {
  id: string;
  name: string;
  countryId: string;
}

export interface Country {
  id: string;
  name: string;
  code: string;
}

/** Digitally enabled countries - approved for FinEra platform */
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

/** Cities by country */
export const CITIES: City[] = [
  // Zimbabwe
  { id: "zw-hre", name: "Harare", countryId: "zw" },
  { id: "zw-bul", name: "Bulawayo", countryId: "zw" },
  { id: "zw-mut", name: "Mutare", countryId: "zw" },
  { id: "zw-gwe", name: "Gweru", countryId: "zw" },
  { id: "zw-kad", name: "Kadoma", countryId: "zw" },
  // South Africa
  { id: "za-jhb", name: "Johannesburg", countryId: "za" },
  { id: "za-cpt", name: "Cape Town", countryId: "za" },
  { id: "za-dbn", name: "Durban", countryId: "za" },
  { id: "za-pta", name: "Pretoria", countryId: "za" },
  { id: "za-bfn", name: "Bloemfontein", countryId: "za" },
  // Kenya
  { id: "ke-nrb", name: "Nairobi", countryId: "ke" },
  { id: "ke-msa", name: "Mombasa", countryId: "ke" },
  { id: "ke-kis", name: "Kisumu", countryId: "ke" },
  // Nigeria
  { id: "ng-lag", name: "Lagos", countryId: "ng" },
  { id: "ng-abj", name: "Abuja", countryId: "ng" },
  { id: "ng-ibd", name: "Ibadan", countryId: "ng" },
  // Ghana
  { id: "gh-acc", name: "Accra", countryId: "gh" },
  { id: "gh-kum", name: "Kumasi", countryId: "gh" },
  // UK
  { id: "gb-lon", name: "London", countryId: "gb" },
  { id: "gb-man", name: "Manchester", countryId: "gb" },
  { id: "gb-bir", name: "Birmingham", countryId: "gb" },
  { id: "gb-edin", name: "Edinburgh", countryId: "gb" },
  // US
  { id: "us-nyc", name: "New York", countryId: "us" },
  { id: "us-la", name: "Los Angeles", countryId: "us" },
  { id: "us-chi", name: "Chicago", countryId: "us" },
  { id: "us-sf", name: "San Francisco", countryId: "us" },
  { id: "us-bos", name: "Boston", countryId: "us" },
];

// Fallback cities for countries without explicit entries
const FALLBACK_CITIES: City[] = COUNTRIES.filter(c => !["zw", "za", "ke", "ng", "gh", "gb", "us"].includes(c.id)).map(c => ({
  id: `${c.id}-cap`,
  name: `${c.name} (Capital)`,
  countryId: c.id,
}));

/** All institutions - Staff: universities, companies, government, research. Student / Employer–Alumni: universities & polytechnics only */
export const INSTITUTIONS: Institution[] = [
  // Zimbabwe - Universities & Polytechnics
  { id: "uoz", name: "University of Zimbabwe", type: "university", cityId: "zw-hre" },
  { id: "nust", name: "National University of Science and Technology", type: "university", cityId: "zw-bul" },
  { id: "mbu", name: "Midlands State University", type: "university", cityId: "zw-gwe" },
  { id: "buse", name: "Bindura University of Science Education", type: "university", cityId: "zw-hre" },
  { id: "lupane", name: "Lupane State University", type: "university", cityId: "zw-bul" },
  { id: "hcc", name: "Harare Polytechnic College", type: "polytechnic", cityId: "zw-hre" },
  { id: "bpc", name: "Bulawayo Polytechnic College", type: "polytechnic", cityId: "zw-bul" },
  { id: "gpc", name: "Gweru Polytechnic College", type: "polytechnic", cityId: "zw-gwe" },
  // Zimbabwe - Government & Companies (Staff only)
  { id: "zrp", name: "Zimbabwe Republic Police", type: "government", cityId: "zw-hre" },
  { id: "zimra", name: "Zimbabwe Revenue Authority", type: "government", cityId: "zw-hre" },
  { id: "zec", name: "Zimbabwe Electoral Commission", type: "government", cityId: "zw-hre" },
  { id: "ecobank", name: "Ecobank Zimbabwe", type: "company", cityId: "zw-hre" },
  { id: "cbz", name: "CBZ Bank", type: "company", cityId: "zw-hre" },
  { id: "zimplats", name: "Zimplats", type: "company", cityId: "zw-hre" },
  { id: "zrc", name: "Zimbabwe Research Council", type: "research", cityId: "zw-hre" },
  // South Africa
  { id: "uct", name: "University of Cape Town", type: "university", cityId: "za-cpt" },
  { id: "wits", name: "University of the Witwatersrand", type: "university", cityId: "za-jhb" },
  { id: "up", name: "University of Pretoria", type: "university", cityId: "za-pta" },
  { id: "cput", name: "Cape Peninsula University of Technology", type: "polytechnic", cityId: "za-cpt" },
  { id: "sars", name: "South African Revenue Service", type: "government", cityId: "za-pta" },
  { id: "sap", name: "SAP South Africa", type: "company", cityId: "za-jhb" },
  // Kenya
  { id: "uon", name: "University of Nairobi", type: "university", cityId: "ke-nrb" },
  { id: "kemu", name: "Kenyatta University", type: "university", cityId: "ke-nrb" },
  { id: "kpu", name: "Kenya Polytechnic University", type: "polytechnic", cityId: "ke-nrb" },
  { id: "kra", name: "Kenya Revenue Authority", type: "government", cityId: "ke-nrb" },
  { id: "safaricom", name: "Safaricom PLC", type: "company", cityId: "ke-nrb" },
  // Nigeria
  { id: "ui", name: "University of Ibadan", type: "university", cityId: "ng-ibd" },
  { id: "unilag", name: "University of Lagos", type: "university", cityId: "ng-lag" },
  { id: "abu", name: "Ahmadu Bello University", type: "university", cityId: "ng-abj" },
  { id: "yabatech", name: "Yaba College of Technology", type: "polytechnic", cityId: "ng-lag" },
  { id: "firs", name: "Federal Inland Revenue Service", type: "government", cityId: "ng-abj" },
  { id: "gtbank", name: "Guaranty Trust Bank", type: "company", cityId: "ng-lag" },
  // UK
  { id: "oxford", name: "University of Oxford", type: "university", cityId: "gb-lon" },
  { id: "cambridge", name: "University of Cambridge", type: "university", cityId: "gb-lon" },
  { id: "ucl", name: "University College London", type: "university", cityId: "gb-lon" },
  { id: "imperial", name: "Imperial College London", type: "university", cityId: "gb-lon" },
  { id: "manchester", name: "University of Manchester", type: "university", cityId: "gb-man" },
  { id: "hmrc", name: "HM Revenue & Customs", type: "government", cityId: "gb-lon" },
  { id: "barclays", name: "Barclays PLC", type: "company", cityId: "gb-lon" },
  // US
  { id: "mit", name: "Massachusetts Institute of Technology", type: "university", cityId: "us-bos" },
  { id: "harvard", name: "Harvard University", type: "university", cityId: "us-bos" },
  { id: "stanford", name: "Stanford University", type: "university", cityId: "us-sf" },
  { id: "nyu", name: "New York University", type: "university", cityId: "us-nyc" },
  { id: "ucla", name: "UCLA", type: "university", cityId: "us-la" },
  { id: "irs", name: "Internal Revenue Service", type: "government", cityId: "us-nyc" },
  { id: "google", name: "Google LLC", type: "company", cityId: "us-sf" },
];

/** Get cities for a country */
export function getCitiesByCountry(countryId: string): City[] {
  const fromMain = CITIES.filter((c) => c.countryId === countryId);
  if (fromMain.length > 0) return fromMain;
  return FALLBACK_CITIES.filter((c) => c.countryId === countryId);
}

/** Get institutions for Staff: all formal orgs. For Student / Employer–Alumni: universities & polytechnics only. Filtered by country. */
export function getInstitutionsByCountryAndType(
  countryId: string,
  accountType: "student" | "staff" | "alumni"
): Institution[] {
  const cityIds = getCitiesByCountry(countryId).map((c) => c.id);
  const inCountry = INSTITUTIONS.filter((i) => cityIds.includes(i.cityId));

  if (accountType === "staff") {
    return inCountry; // All: universities, polytechnics, companies, government, research
  }
  // Student & Employer: universities and polytechnics only
  return inCountry.filter(
    (i) => i.type === "university" || i.type === "polytechnic"
  );
}

/** Full registration data for fallback when API is unavailable */
export function getFallbackRegistrationData() {
  const allCities = [...CITIES, ...FALLBACK_CITIES];
  return { countries: COUNTRIES, cities: allCities, institutions: INSTITUTIONS };
}

/** Search institutions by name */
export function searchInstitutions(
  countryId: string,
  accountType: "student" | "staff" | "alumni",
  query: string
): Institution[] {
  const list = getInstitutionsByCountryAndType(countryId, accountType);
  if (!query.trim()) return list;
  const q = query.toLowerCase();
  return list.filter((i) => i.name.toLowerCase().includes(q));
}


