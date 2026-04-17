-- Registration legal consent (Terms + Privacy) — required for new users; defaults preserve existing rows.

ALTER TABLE "User" ADD COLUMN "termsOfServiceAccepted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "privacyPolicyAccepted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "consentAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "consentVersion" TEXT;
ALTER TABLE "User" ADD COLUMN "registrationIp" TEXT;
ALTER TABLE "User" ADD COLUMN "registrationUserAgent" TEXT;
