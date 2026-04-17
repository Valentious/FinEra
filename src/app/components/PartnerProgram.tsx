/**
 * Partner Program - Standalone module for transaction partner registration
 * Route: /partner-program (screen: partnerProgram)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { PhoneInputField } from "@/app/components/PhoneInputField";
import {
  Users,
  DollarSign,
  Briefcase,
  UserPlus,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
} from "lucide-react";
import { getPartnerProgram, applyPartnerProgram, type PartnerProgramApplication } from "@/services/api";
import { toast } from "sonner";
import { isCompletePhoneNumber, PHONE_NUMBER_INCOMPLETE_MESSAGE } from "@/lib/validation";
import { FineraGradientBackdrop } from "@/app/components/FineraGradientBackdrop";

const SERVICE_OPTIONS = ["Cash In", "Cash Out", "Loan Support", "Payment Assistance"];

export function PartnerProgram() {
  const [status, setStatus] = useState<"NOT_APPLIED" | "PENDING" | "APPROVED" | "REJECTED">("NOT_APPLIED");
  const [applicationData, setApplicationData] = useState<PartnerProgramApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const latestContactRef = useRef("");
  latestContactRef.current = formData.contactNumber;
  const [formData, setFormData] = useState<PartnerProgramApplication & { services: string[] }>({
    fullName: "",
    idNumber: "",
    contactNumber: "",
    location: "",
    services: [],
  });

  const fetchProgram = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPartnerProgram();
      if (res.success && res.data) {
        setStatus(res.data.status as typeof status);
        setApplicationData(res.data.applicationData ?? null);
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Failed to load partner program";
      const msg = /invalid|expired.*token|unauthorized|401/i.test(raw)
        ? "Please refresh the page or sign in again to continue."
        : raw;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  const handleServiceToggle = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await applyPartnerProgram({
        fullName: formData.fullName,
        idNumber: formData.idNumber,
        contactNumber: formData.contactNumber,
        location: formData.location,
        services: formData.services,
      });
      if (res.success) {
        setStatus("PENDING");
        setApplicationData(res.data.applicationData ?? null);
        setShowForm(false);
        toast.success("Application submitted successfully");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && status === "NOT_APPLIED") {
    return (
      <div className="relative isolate flex min-h-[400px] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl">
        <FineraGradientBackdrop clip="card" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="font-medium text-foreground">Loading partner program...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-[min(100%,calc(100dvh-6rem))] overflow-x-hidden pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <FineraGradientBackdrop />
      <div className="relative z-10 space-y-8">
      {/* Header — same canvas as SplashScreen */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl">
        <FineraGradientBackdrop clip="card" />
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg border border-white/20 bg-white/10 p-2 backdrop-blur-md">
              <UserPlus className="h-6 w-6 text-emerald-100" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/85">Partner Program</span>
          </div>
          <h1 className="mb-2 text-4xl font-black leading-tight">Transaction Partner Program</h1>
          <p className="text-sm text-white/80">
            Become a registered agent and earn through system-based financial services.
          </p>
        </div>
      </div>

      {error && (
        <Card className="relative overflow-hidden border-white/25 shadow-md">
          <FineraGradientBackdrop clip="panel" />
          <CardContent className="relative z-10 flex items-center justify-between py-4 text-white">
            <span className="text-sm text-white/95">{error}</span>
            <Button
              variant="outline"
              size="sm"
              className="border-white/50 bg-white/15 text-white hover:bg-white/25"
              onClick={fetchProgram}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Banner */}
      {status !== "NOT_APPLIED" && (
        <Card
          className={
            status === "APPROVED"
              ? "border-emerald-200 bg-emerald-50"
              : status === "REJECTED"
                ? "border-red-200 bg-red-50"
                : "relative overflow-hidden border-white/25 text-white"
          }
        >
          {status === "PENDING" && <FineraGradientBackdrop clip="panel" />}
          <CardContent className={`flex items-center gap-4 py-4 ${status === "PENDING" ? "relative z-10" : ""}`}>
            {status === "APPROVED" && <CheckCircle2 className="h-10 w-10 text-emerald-600" />}
            {status === "PENDING" && <Clock className="h-10 w-10 text-white" />}
            {status === "REJECTED" && <XCircle className="h-10 w-10 text-red-600" />}
            <div>
              <h3 className={`font-bold ${status === "PENDING" ? "text-white" : "text-foreground"}`}>
                {status === "APPROVED" && "You are an approved partner"}
                {status === "PENDING" && "Application pending review"}
                {status === "REJECTED" && "Application was not approved"}
              </h3>
              <p className={`text-sm ${status === "PENDING" ? "text-white/88" : "text-muted-foreground"}`}>
                {status === "APPROVED" && "You can now facilitate transactions and earn commissions."}
                {status === "PENDING" && "Our team will review your submission within 3-5 business days."}
                {status === "REJECTED" && "Contact support if you have questions."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 border-none bg-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <Users className="w-10 h-10 text-emerald-600 mb-6" />
            <h3 className="text-xl font-black text-foreground mb-2">Become an Agent</h3>
            <p className="text-muted-foreground text-sm font-medium mb-6">
              Earn commissions by facilitating cash in and cash out for your community.
            </p>
            {status === "NOT_APPLIED" && (
              <Button
                onClick={() => setShowForm(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl"
              >
                Start Application
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-8 border-none bg-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <DollarSign className="w-10 h-10 text-green-600 mb-6" />
            <h3 className="text-xl font-black text-foreground mb-2">Earnings Calculator</h3>
            <p className="text-muted-foreground text-sm font-medium mb-6">
              Estimate your monthly revenue based on transaction volume and community size.
            </p>
            <Button variant="outline" className="w-full border-slate-200 font-black rounded-xl">
              Calculate Revenue
            </Button>
          </div>
        </Card>

        <Card className="p-8 border-none bg-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <Briefcase className="w-10 h-10 text-amber-600 mb-6" />
            <h3 className="text-xl font-black text-foreground mb-2">Agent Benefits</h3>
            <p className="text-muted-foreground text-sm font-medium mb-6">
              Priority support, marketing materials, and certified agent branding for your kiosk.
            </p>
            <Button variant="outline" className="w-full border-slate-200 font-black rounded-xl">
              View Benefits
            </Button>
          </div>
        </Card>
      </div>

      {/* Application Form (inline when showForm) */}
      {showForm && status === "NOT_APPLIED" && (
        <Card className="p-8 border-emerald-100">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-2xl font-black text-foreground">Application Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-black text-foreground uppercase tracking-wide">
                Full Name *
              </Label>
              <Input
                id="fullName"
                required
                placeholder="Enter your full legal name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="h-12 rounded-xl font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber" className="text-sm font-black text-foreground uppercase tracking-wide">
                National ID / Student ID *
              </Label>
              <Input
                id="idNumber"
                required
                placeholder="Enter your ID number"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                className="h-12 rounded-xl font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber" className="text-sm font-black text-foreground uppercase tracking-wide">
                Contact Number *
              </Label>
              <PhoneInputField
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(value) => {
                  latestContactRef.current = value;
                  setFormData({ ...formData, contactNumber: value });
                  setPhoneError("");
                }}
                onBlur={() => {
                  const p = latestContactRef.current;
                  if (p.trim().length > 0 && !isCompletePhoneNumber(p)) {
                    setPhoneError(PHONE_NUMBER_INCOMPLETE_MESSAGE);
                  }
                }}
                placeholder="e.g., +263 77 123 4567"
                required
                defaultCountry="zw"
                inputClassName={`!rounded-xl !font-medium ${phoneError ? "!border-red-500" : ""}`}
                buttonClassName="!rounded-l-xl"
              />
              {phoneError ? <p className="text-sm font-medium text-red-600">{phoneError}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-black text-foreground uppercase tracking-wide">
                Location *
              </Label>
              <Input
                id="location"
                required
                placeholder="City, Campus, or Area"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="h-12 rounded-xl font-medium"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-black text-foreground uppercase tracking-wide">
                Type of Services You Can Offer *
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {SERVICE_OPTIONS.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleServiceToggle(service)}
                    className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${
                      formData.services.includes(service)
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-muted-foreground hover:border-slate-300"
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={submitting || formData.services.length === 0}
                className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Application"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {status === "NOT_APPLIED" && !showForm && (
        <Card className="p-8 border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 flex flex-col items-center justify-center text-center max-w-xl mx-auto">
          <UserPlus className="w-14 h-14 text-emerald-600 mb-4" />
          <h3 className="text-xl font-black text-foreground mb-2">Join campus agents</h3>
          <p className="text-muted-foreground font-medium mb-6 max-w-sm text-sm">
            Facilitate financial inclusion and earn commissions. Start your application above.
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black px-8"
          >
            Join Partner Network
          </Button>
        </Card>
      )}
      </div>
    </div>
  );
}
