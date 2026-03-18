import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { PhoneInputField } from "@/app/components/PhoneInputField";
import { ArrowLeft, CheckCircle2, UserPlus, FileText } from "lucide-react";

interface PartnerApplicationProps {
  onBack: () => void;
}

export function PartnerApplication({ onBack }: PartnerApplicationProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    contactNumber: "",
    location: "",
    services: [] as string[],
  });
  const [submitted, setSubmitted] = useState(false);

  const serviceOptions = [
    "Deposits",
    "Withdrawals",
    "Loan Support",
    "Payment Assistance",
  ];

  const handleServiceToggle = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-purple-100 p-4 flex items-center justify-center">
        <Card className="max-w-lg w-full p-10 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">Application Submitted!</h1>
          <p className="text-slate-600 font-medium mb-8">
            Your partner application has been received. Our team will review your submission and contact you within 3-5 business days.
          </p>
          <p className="text-sm text-slate-500 font-medium mb-8 bg-slate-50 p-4 rounded-xl">
            <strong className="text-slate-700">System Note:</strong> Approval is required before partner access is activated.
          </p>
          <Button onClick={onBack} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-black rounded-xl">
            Return to Learning Hub
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-purple-100 p-4">
      <div className="max-w-3xl mx-auto space-y-6 pt-6 pb-12">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Partner Program
        </Button>

        {/* Header */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                <UserPlus className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Partner Program</span>
            </div>
            <h1 className="text-4xl font-black mb-2 leading-tight">Transaction Partner Registration</h1>
            <p className="text-emerald-100 text-sm font-medium">
              Become a registered transaction agent and earn through system-based financial services.
            </p>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[140%] bg-emerald-500/20 rounded-full blur-[80px]" />
        </div>

        {/* Application Form */}
        <Card className="p-8">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-2xl font-black text-slate-900">Application Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-black text-slate-700 uppercase tracking-wide">
                Full Name *
              </Label>
              <Input
                id="fullName"
                type="text"
                required
                placeholder="Enter your full legal name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="h-12 rounded-xl font-medium"
              />
            </div>

            {/* National ID / Student ID */}
            <div className="space-y-2">
              <Label htmlFor="idNumber" className="text-sm font-black text-slate-700 uppercase tracking-wide">
                National ID / Student ID *
              </Label>
              <Input
                id="idNumber"
                type="text"
                required
                placeholder="Enter your ID number"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                className="h-12 rounded-xl font-medium"
              />
            </div>

            {/* Contact Number */}
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

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-black text-slate-700 uppercase tracking-wide">
                Location *
              </Label>
              <Input
                id="location"
                type="text"
                required
                placeholder="City, Campus, or Area"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="h-12 rounded-xl font-medium"
              />
            </div>

            {/* Type of Services */}
            <div className="space-y-3">
              <Label className="text-sm font-black text-slate-700 uppercase tracking-wide">
                Type of Services You Can Offer *
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {serviceOptions.map((service) => (
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
              <p className="text-xs text-slate-500 font-medium">Select all services you can provide</p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={formData.services.length === 0}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-lg shadow-xl shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Application
              </Button>
              <p className="text-xs text-slate-500 font-medium text-center mt-3">
                Approval is required before partner access is activated.
              </p>
            </div>
          </form>
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-emerald-50 border-emerald-200">
          <h3 className="font-black text-slate-900 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            What Happens Next?
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-2">
              <span className="text-emerald-600 font-bold">1.</span>
              <span className="font-medium">Your application will be reviewed by our verification team</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600 font-bold">2.</span>
              <span className="font-medium">You'll receive an email/SMS within 3-5 business days</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600 font-bold">3.</span>
              <span className="font-medium">Once approved, you'll undergo training before activation</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
