import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { withInclusiveCreditBrandColor } from "@/lib/brandText";

const TERMS_BODY = [
  "This summary describes how FinEra Inclusive Credit operates the member platform. Replace this page with your organisation’s full Terms of Service before production.",
  "By registering and using wallets, credit, or repayments, you agree to follow product-specific rules shown in the app (including loan agreements, collateral disclosures, and salary-based consent where applicable).",
];

const PRIVACY_BODY = [
  "FinEra processes personal data you provide for identity verification, fraud prevention, and service delivery. Replace this page with your organisation’s full Privacy Policy before production.",
  "Sensitive fields (for example date of birth and identity documents) are treated as high-risk data and should be protected in line with your jurisdiction’s requirements.",
];

export function LegalNoticePage() {
  const { doc } = useParams<{ doc: string }>();
  const navigate = useNavigate();
  const isTerms = doc === "terms";
  const isPrivacy = doc === "privacy";

  if (!isTerms && !isPrivacy) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <p className="text-muted-foreground">Document not found.</p>
        <Button asChild variant="link" className="mt-4 px-0">
          <Link to="/">Return home</Link>
        </Button>
      </div>
    );
  }

  const title = isTerms ? "Terms of Service" : "Privacy Policy";
  const paragraphs = isTerms ? TERMS_BODY : PRIVACY_BODY;

  return (
    <div className="relative isolate min-h-dvh bg-background px-4 py-10">
      <div className="finera-gradient-plate pointer-events-none fixed inset-0 opacity-40" aria-hidden />
      <div className="relative z-10 mx-auto max-w-2xl">
        <Button type="button" variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm font-medium text-muted-foreground">Last updated: informational placeholder</p>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-foreground">
          {paragraphs.map((p, i) => (
            <p key={i}>{withInclusiveCreditBrandColor(p)}</p>
          ))}
        </div>
        <p className="mt-10 text-sm">
          <Link to="/" className="font-semibold text-primary underline underline-offset-4">
            Return to FinEra
          </Link>
        </p>
      </div>
    </div>
  );
}
