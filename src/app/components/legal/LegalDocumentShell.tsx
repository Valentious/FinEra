import { Link } from "react-router-dom";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft } from "lucide-react";

type LegalDocumentShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  backTo?: string;
};

export function LegalDocumentShell({
  title,
  subtitle = "FinEra — document version 1.0 (April 2026). This is a platform agreement template; obtain qualified legal review before production use.",
  children,
  backTo = "/",
}: LegalDocumentShellProps) {
  return (
    <div className="relative isolate min-h-dvh bg-background">
      <div className="finera-gradient-plate pointer-events-none fixed inset-0 opacity-40" aria-hidden />
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 md:py-14">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2 text-muted-foreground">
          <Link to={backTo}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to FinEra
          </Link>
        </Button>
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        </header>
        <article className="space-y-8 text-sm leading-relaxed text-foreground md:text-[15px] md:leading-7">
          {children}
        </article>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-3 text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground">{children}</div>
    </section>
  );
}

export { Section };
