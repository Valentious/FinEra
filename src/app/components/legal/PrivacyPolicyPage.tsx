import { LegalDocumentShell, Section } from "@/app/components/legal/LegalDocumentShell";
import { Link } from "react-router-dom";

export function PrivacyPolicyPage() {
  return (
    <LegalDocumentShell title="FinEra — Privacy Policy">
      <Section id="intro" title="1. Who we are and scope">
        <p>
          This Privacy Policy explains how FinEra (&quot;we&quot;) collects, uses, stores, and shares personal data when you
          use our digital wallet, onboarding, and credit-related services. It should be read together with our{" "}
          <Link to="/legal/terms" className="font-medium text-emerald-600 underline underline-offset-2">
            Terms of Service
          </Link>
          .
        </p>
      </Section>

      <Section id="data" title="2. Data we collect">
        <p>
          We may collect identifiers and contact details (name, email, phone), organization or employer affiliation, government
          identifiers where permitted for KYC, device and log data (IP address, user agent, approximate location from IP),
          financial and transaction data (wallet movements, loan applications, repayment history), and content you upload for
          verification (documents, selfies).
        </p>
      </Section>

      <Section id="purposes" title="3. How we use data">
        <p>We use personal and financial data to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Create and maintain your account and wallets;</li>
          <li>Evaluate creditworthiness and administer loans disbursed to your wallet;</li>
          <li>Detect, investigate, and prevent fraud, abuse, and security incidents;</li>
          <li>Meet regulatory, audit, and legal obligations applicable to fintech operations;</li>
          <li>Provide support, notices, and service improvements.</li>
        </ul>
      </Section>

      <Section id="sharing" title="4. Sharing and processors">
        <p>
          We may share data with service providers that assist us (hosting, messaging, identity verification, payments,
          analytics where configured). We require appropriate contractual safeguards.{" "}
          <strong>We do not sell your personal information to third parties for money.</strong> We may disclose information
          when required by law, lawful process, or to protect the rights, safety, and integrity of FinEra, our users, or the
          public.
        </p>
      </Section>

      <Section id="retention" title="5. Retention and security">
        <p>
          We retain data for as long as your account is active and as needed for legal, regulatory, and dispute-resolution
          purposes (including credit and anti-fraud records). We apply technical and organizational measures appropriate to
          the sensitivity of financial data; no method of transmission or storage is completely secure.
        </p>
      </Section>

      <Section id="rights" title="6. Your rights">
        <p>
          Depending on your jurisdiction, you may have rights to access, correct, delete, or port certain data, or to object to
          or restrict certain processing. Financial and compliance records may be exempt from deletion where retention is
          required by law. Submit requests through the in-app privacy contact or official support channel.
        </p>
      </Section>

      <Section id="international" title="7. International transfers">
        <p>
          If we process data across borders, we use mechanisms recognized under applicable law (for example, standard
          contractual clauses or adequacy decisions) where required.
        </p>
      </Section>

      <Section id="children" title="8. Age">
        <p>
          FinEra onboarding requires that you meet the minimum age we enforce in your region (for example, 18+ where
          applicable). We do not knowingly collect data from children below the permitted age.
        </p>
      </Section>

      <Section id="changes" title="9. Changes">
        <p>
          We may update this policy and will provide notice as required by law (including in-app notice or email). Material
          changes affecting credit or wallet processing may require renewed acknowledgment where mandated.
        </p>
      </Section>

      <Section id="law-privacy" title="10. Governing law and disputes (configurable)">
        <p>
          Questions about privacy law applicability, supervisory authority contacts, and dispute resolution follow the same
          configurable regional framework described in the Terms of Service, subject to mandatory local privacy rights.
        </p>
      </Section>
    </LegalDocumentShell>
  );
}
