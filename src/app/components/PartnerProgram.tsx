/**
 * Partner Program - Standalone module for transaction partner registration
 * Route: /partner-program (screen: partnerProgram)
 */

import { useState, useEffect, useCallback } from "react";
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

const ONBOARDING_STEPS = [
  { step: 1, title: "KYC Verification", desc: "Upload business license or student ID for vetting." },
  { step: 2, title: "Training Workshop", desc: "Complete 3 essential modules on secure cash handling." },
  { step: 3, title: "Float Setup", desc: "Initialize your agent wallet with minimum required capital." },
  { step: 4, title: "Go Live", desc: "Start appearing on the platform's nearby agent map." },
];

const SERVICE_OPTIONS = ["Cash In", "Cash Out", "Loan Support", "Payment Assistance"];

export function PartnerProgram() {
  const [status, setStatus] = useState<"NOT_APPLIED" | "PENDING" | "APPROVED" | "REJECTED">("NOT_APPLIED");
  const [applicationData, setApplicationData] = useState<PartnerProgramApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
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
      setError(e instanceof Error ? e.message : "Failed to load partner program");
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
        <p className="text-slate-600 font-medium">Loading partner program...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
              <UserPlus className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
              Partner Program
            </span>
          </div>
          <h1 className="text-4xl font-black mb-2 leading-tight">Transaction Partner Program</h1>
          <p className="text-slate-300 text-sm">
            Become a registered agent and earn through system-based financial services.
          </p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[140%] bg-emerald-500/20 rounded-full blur-[80px]" />
      </div>

      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between py-4">
            <span className="text-amber-800">{error}</span>
            <Button variant="outline" size="sm" onClick={fetchProgram}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
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
                : "border-amber-200 bg-amber-50"
          }
        >
          <CardContent className="flex items-center gap-4 py-4">
            {status === "APPROVED" && <CheckCircle2 className="w-10 h-10 text-emerald-600" />}
            {status === "PENDING" && <Clock className="w-10 h-10 text-amber-600" />}
            {status === "REJECTED" && <XCircle className="w-10 h-10 text-red-600" />}
            <div>
              <h3 className="font-bold text-slate-900">
                {status === "APPROVED" && "You are an approved partner"}
                {status === "PENDING" && "Application pending review"}
                {status === "REJECTED" && "Application was not approved"}
              </h3>
              <p className="text-sm text-slate-600">
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
            <h3 className="text-xl font-black text-slate-900 mb-2">Become an Agent</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">
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
            <h3 className="text-xl font-black text-slate-900 mb-2">Earnings Calculator</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">
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
            <h3 className="text-xl font-black text-slate-900 mb-2">Agent Benefits</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">
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
            <h2 className="text-2xl font-black text-slate-900">Application Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-black text-slate-700 uppercase tracking-wide">
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
              <Label htmlFor="idNumber" className="text-sm font-black text-slate-700 uppercase tracking-wide">
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
              <Label htmlFor="contactNumber" className="text-sm font-black text-slate-700 uppercase tracking-wide">
                Contact Number *
              </Label>
              <PhoneInputField
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(value) => setFormData({ ...formData, contactNumber: value })}
                placeholder="e.g., +263 77 123 4567"
                required
                defaultCountry="zw"
                inputClassName="!rounded-xl !font-medium"
                buttonClassName="!rounded-l-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-black text-slate-700 uppercase tracking-wide">
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
              <Label className="text-sm font-black text-slate-700 uppercase tracking-wide">
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
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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

      {/* Onboarding Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-2xl font-black text-slate-900">Agent Onboarding Flow</h3>
          <div className="space-y-4">
            {ONBOARDING_STEPS.map((s, i) => (
              <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
                  {s.step}
                </div>
                <div>
                  <h4 className="font-black text-slate-900">{s.title}</h4>
                  <p className="text-slate-500 text-xs font-medium">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card className="p-8 border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-center">
          <UserPlus className="w-16 h-16 text-emerald-600 mb-4" />
          <h3 className="text-2xl font-black text-slate-900 mb-2">Join 450+ Campus Agents</h3>
          <p className="text-slate-500 font-medium mb-6 max-w-xs">
            Facilitate academic financial inclusion and earn a steady income while you study or work.
          </p>
          {status === "NOT_APPLIED" && !showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-lg font-black shadow-xl shadow-emerald-100"
            >
              Join Partner Network
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
