import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.finera.inclusivecredit",
  appName: "FinEra Inclusive Credit",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
