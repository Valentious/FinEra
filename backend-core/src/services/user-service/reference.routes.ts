/**
 * FinEra Backend - Reference Data Routes
 * Countries, Cities, Institutions for registration
 */

import { Router, Request, Response } from "express";
import {
  COUNTRIES,
  INSTITUTIONS,
  getCitiesByCountry,
  getInstitutionsByCountryAndType,
} from "./reference.data.js";

const router = Router();

/** Unified registration data - countries, all cities, all institutions (frontend filters by country) */
router.get("/registration-data", (_req: Request, res: Response) => {
  const cities = COUNTRIES.flatMap((c) => getCitiesByCountry(c.id));
  res.json({
    countries: COUNTRIES,
    cities,
    institutions: INSTITUTIONS,
  });
});

router.get("/countries", (_req: Request, res: Response) => {
  res.json(COUNTRIES);
});

router.get("/cities", (req: Request, res: Response) => {
  const countryId = req.query.countryId as string | undefined;
  if (!countryId) {
    return res.json([]);
  }
  const cities = getCitiesByCountry(countryId);
  return res.json(cities);
});

router.get("/institutions", (req: Request, res: Response) => {
  const countryId = req.query.countryId as string | undefined;
  const type = req.query.type as "student" | "staff" | "alumni" | undefined;
  const accountType = type || "student";

  if (!countryId) {
    return res.json(INSTITUTIONS);
  }
  const institutions = getInstitutionsByCountryAndType(countryId, accountType);
  return res.json(institutions);
});

router.get("/health", (_req: Request, res: Response) => {
  const countries = COUNTRIES.length;
  const citiesCount = COUNTRIES.reduce((sum, c) => sum + getCitiesByCountry(c.id).length, 0);
  const institutions = INSTITUTIONS.length;
  const isComplete = countries > 0 && citiesCount > 0 && institutions > 0;

  res.json({
    status: isComplete ? "healthy" : "degraded",
    data: { countries, cities: citiesCount, institutions },
    message: isComplete ? "Reference data available" : "Missing reference data",
  });
});

export default router;
