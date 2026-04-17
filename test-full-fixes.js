/**
 * FinEra - Test Registration & Reference Data Fixes
 * Run: node test-full-fixes.js
 * Requires: backend running on http://localhost:4000
 */

const API_URL = "http://localhost:4000/api/v1";

async function testFixes() {
  console.log("🔧 TESTING FIXES FOR REGISTRATION AND REFERENCE DATA\n");

  const results = {
    referenceData: { passed: false, details: [] },
    registration: { passed: false, details: [] },
  };

  try {
    // Test 1: Reference Data (unified registration-data endpoint)
    console.log("📊 Testing Reference Data...");

    const regDataRes = await fetch(`${API_URL}/reference/registration-data`);
    if (!regDataRes.ok) throw new Error(`Registration data: ${regDataRes.status}`);
    const regData = await regDataRes.json();
    const countries = regData.countries || [];
    const cities = regData.cities || [];
    const institutions = regData.institutions || [];

    results.referenceData.details.push(`Countries: ${countries.length}`);
    results.referenceData.details.push(`Cities (ZW): ${cities.length}`);
    const unis = institutions.filter((i) => i.type === "university");
    const polys = institutions.filter((i) => i.type === "polytechnic"); // expected 0 after college-sector removal
    results.referenceData.details.push(`Universities: ${unis.length}`);
    results.referenceData.details.push(`Polytechnics: ${polys.length}`);

    results.referenceData.passed =
      countries.length > 0 && cities.length > 0 && institutions.length > 0;

    console.log(results.referenceData.passed ? "✅ Reference Data OK" : "❌ Reference Data Missing");

    // Test 2: Registration with reference data
    console.log("\n📝 Testing Registration...");

    const country = countries[0];
    const citiesForCountry = cities.filter((c) => c.countryId === country?.id);
    const city = citiesForCountry[0] || cities[0];
    const institution = institutions.find((i) => i.type === "university") || institutions[0];

    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: "TestPass123!@#",
      fullName: "Test User",
      accountType: "STUDENT",
      country: country?.code || "ZW",
      city: city?.name || "Harare",
      institution: institution?.name || "University of Zimbabwe",
    };

    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    if (registerRes.ok) {
      const regData = await registerRes.json();
      results.registration.passed = true;
      results.registration.details.push(`User ID: ${regData.data?.userId || "N/A"}`);
      results.registration.details.push(`Email: ${testUser.email}`);
      console.log("✅ Registration Successful");
    } else {
      const err = await registerRes.json().catch(() => ({}));
      results.registration.details.push(`Error: ${err.message || registerRes.statusText}`);
      console.log("❌ Registration Failed:", err.message || registerRes.statusText);
    }

    // Final Report
    console.log("\n" + "=".repeat(50));
    console.log("FINAL RESULTS:");
    console.log("=".repeat(50));

    console.log(`\n📊 Reference Data: ${results.referenceData.passed ? "✅" : "❌"}`);
    results.referenceData.details.forEach((d) => console.log(`   - ${d}`));

    console.log(`\n📝 Registration: ${results.registration.passed ? "✅" : "❌"}`);
    results.registration.details.forEach((d) => console.log(`   - ${d}`));

    const allPassed = results.referenceData.passed && results.registration.passed;

    console.log("\n" + "=".repeat(50));
    if (allPassed) {
      console.log("🎉 ALL FIXES VERIFIED - SYSTEM READY!");
      console.log("✅ Registration reference data available");
      console.log("✅ User registration working with country/city/institution");
      console.log("✅ CaptureId component ready (test manually in UI)");
    } else {
      console.log("⚠️ Some issues remain. Check details above.");
    }
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testFixes();
