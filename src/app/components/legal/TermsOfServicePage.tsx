import { LegalDocumentShell, Section } from "@/app/components/legal/LegalDocumentShell";
import { Link } from "react-router-dom";

export function TermsOfServicePage() {
  return (
    <LegalDocumentShell title="FinEra — Terms of Service">
      <Section id="acceptance" title="1. Agreement and acceptance">
        <p>
          By registering for or using FinEra (&quot;FinEra&quot;, &quot;we&quot;, &quot;us&quot;), you enter a legally binding
          agreement with the FinEra operating entity. If you do not agree, you must not use the service. Continued use after
          we post an updated version constitutes acceptance of the revised terms where permitted by law.
        </p>
      </Section>

      <Section id="nature" title="2. Nature of the service — not a bank">
        <p>
          FinEra provides digital wallet functionality, information tools, and access to credit products as described in these
          terms. <strong>FinEra is not a bank, deposit-taking institution, or licensed custodian unless separately disclosed in
          writing for your jurisdiction.</strong> Wallet balances represent stored value or ledger positions made available
          through the platform subject to verification, compliance holds, settlement timing, and product rules.
        </p>
        <p>
          We may partner with regulated financial institutions, payment processors, or identity providers. Their terms may
          also apply where you use their services through FinEra.
        </p>
      </Section>

      <Section id="wallet" title="3. Wallet services">
        <p>
          You may hold and move supported currencies within your FinEra wallet subject to limits, eligibility, and security
          controls. Funds may be delayed, frozen, or subject to additional verification for anti-fraud, sanctions, or
          regulatory reasons. You are responsible for ensuring that instructions you give (transfers, withdrawals, card loads)
          are accurate; mistaken transfers may not be reversible.
        </p>
        <p>
          Certain wallet features may be simulated or restricted in &quot;explore&quot; or demo modes. Live wallet operations
          require completion of onboarding, verification, and any applicable agreements.
        </p>
      </Section>

      <Section id="credit" title="4. Credit and loans">
        <p>
          Credit, loans, or similar facilities are offered only after application, underwriting, and explicit approval in
          accordance with FinEra policies. <strong>Approved credit may be disbursed directly to your FinEra wallet.</strong>{" "}
          When you accept a loan offer, you incur legally binding repayment obligations including principal, fees, and
          interest as disclosed in the loan schedule and agreement.
        </p>
        <p>
          Late or missed repayment may result in penalties, additional interest, collection activity, reporting to credit
          bureaus or internal scoring systems, suspension of certain features, or restricted account access until the default
          is cured or resolved under applicable law and your agreement.
        </p>
      </Section>

      <Section id="compliance" title="5. Compliance, monitoring, and risk controls">
        <p>
          We operate anti-fraud monitoring, transaction screening, and identity verification (including KYC-style checks). We
          may request documents, selfies, proof of address, or organization affiliation evidence. We may suspend, limit, or
          terminate accounts where we reasonably suspect fraud, abuse, sanctions exposure, identity concerns, or breach of
          these terms, subject to applicable law and any mandatory dispute or complaint processes.
        </p>
        <p>
          You agree that we may retain and process data as described in our{" "}
          <Link to="/legal/privacy" className="font-medium text-emerald-600 underline underline-offset-2">
            Privacy Policy
          </Link>{" "}
          and as required for regulatory compliance applicable to fintech operations in your region.
        </p>
      </Section>

      <Section id="user-duties" title="6. Your responsibilities">
        <p>
          You must provide accurate, complete information and keep it updated. You must safeguard credentials, devices, and
          any second factors. You must not misuse wallets or credit features (including layering, structuring to evade limits,
          providing false employment or income data, or using FinEra for unlawful purposes).
        </p>
      </Section>

      <Section id="liability" title="7. Disclaimers and limitation of liability">
        <p>
          To the maximum extent permitted by law, FinEra disclaims warranties not expressly stated here. Our aggregate
          liability arising out of or relating to the service may be limited as set out in a separate liability schedule or
          jurisdiction-specific addendum where required. Nothing in these terms excludes liability that cannot be excluded by
          law.
        </p>
      </Section>

      <Section id="law" title="8. Governing law and disputes (configurable)">
        <p>
          <strong>Governing law:</strong> Unless a different governing law is configured in your FinEra account region settings
          or a written addendum, the parties agree that the laws of the jurisdiction selected by FinEra for your onboarding
          region apply, excluding conflict-of-law rules that would apply another jurisdiction&apos;s law.
        </p>
        <p>
          <strong>Dispute resolution:</strong> Unless otherwise required by mandatory consumer protection law, disputes shall
          be resolved through the dispute resolution mechanism configured for your region (for example, arbitration or
          competent courts as specified in your addendum). If no mechanism is configured, disputes shall be submitted to the
          courts of competent jurisdiction as determined by FinEra&apos;s entity formation documents and your region of
          residence, subject to mandatory local rights you cannot waive.
        </p>
      </Section>

      <Section id="contact" title="9. Contact">
        <p>
          For questions about these terms, contact FinEra support through the in-app help center or the official support
          channel published on the FinEra website.
        </p>
      </Section>
    </LegalDocumentShell>
  );
}
