import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { CreditCard, Shield, Plus, Ban, CheckCircle2 } from "lucide-react";
import type { VirtualDebitCard } from "@/services/api";

export type DebitCardFinalizeMeta = {
  kind: "virtual" | "physical";
  virtualCardId?: string;
};

type Step = "kind" | "virtual" | "physicalRegister";

function randomVirtualCard(label: string): VirtualDebitCard {
  const last4 = String(Math.floor(1000 + Math.random() * 9000));
  const bin = `5521 ${String(Math.floor(10 + Math.random() * 89)).padStart(2, "0")}`;
  return {
    id: `vdc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    label: label.trim() || "Virtual Mastercard",
    last4,
    maskedPan: `${bin} **** **** ${last4}`,
    blocked: false,
    createdAt: new Date().toISOString(),
  };
}

interface DebitCardMethodPanelProps {
  title: string;
  virtualDebitCards: VirtualDebitCard[];
  onVirtualDebitCardsChange: (cards: VirtualDebitCard[]) => void;
  physicalMastercardLast4?: string;
  onPhysicalMastercardChange: (last4: string) => void;
  onFinalize: (method: "debit_card_virtual" | "debit_card_physical", meta: DebitCardFinalizeMeta) => void | Promise<void>;
  onBack: () => void;
}

/**
 * Binance-style debit path: Debit card → Virtual Mastercard (multi, create, block) or Physical Mastercard.
 */
export function DebitCardMethodPanel({
  title,
  virtualDebitCards,
  onVirtualDebitCardsChange,
  physicalMastercardLast4,
  onPhysicalMastercardChange,
  onFinalize,
  onBack,
}: DebitCardMethodPanelProps) {
  const [step, setStep] = useState<Step>("kind");
  const [newLabel, setNewLabel] = useState("");
  const [selectedVirtualId, setSelectedVirtualId] = useState<string | null>(null);
  const [physicalInput, setPhysicalInput] = useState(physicalMastercardLast4 ?? "");
  const [editingPhysical, setEditingPhysical] = useState(
    !(physicalMastercardLast4 && physicalMastercardLast4.length === 4)
  );

  const activeVirtual = virtualDebitCards.filter((c) => !c.blocked);
  const blockedVirtual = virtualDebitCards.filter((c) => c.blocked);

  useEffect(() => {
    if (step === "virtual" && activeVirtual.length > 0 && !selectedVirtualId) {
      setSelectedVirtualId(activeVirtual[0].id);
    }
  }, [step, activeVirtual, selectedVirtualId]);

  const toggleBlock = (id: string) => {
    onVirtualDebitCardsChange(
      virtualDebitCards.map((c) => (c.id === id ? { ...c, blocked: !c.blocked } : c))
    );
  };

  const addVirtual = () => {
    const card = randomVirtualCard(newLabel);
    onVirtualDebitCardsChange([...virtualDebitCards, card]);
    setSelectedVirtualId(card.id);
    setNewLabel("");
    setStep("virtual");
  };

  return (
    <Card className="p-6 border-slate-100 shadow-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={step === "kind" ? onBack : () => setStep("kind")}>
          ←
        </Button>
        <div>
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 font-medium">Debit card · Mastercard</p>
        </div>
      </div>

      {step === "kind" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Choose how you want to use your debit card.</p>
          <Button
            className="w-full h-14 rounded-2xl justify-start gap-3 bg-indigo-600 hover:bg-indigo-700 font-black"
            onClick={() => setStep("virtual")}
          >
            <CreditCard className="w-5 h-5" />
            Virtual Mastercard
          </Button>
          <Button
            variant="outline"
            className="w-full h-14 rounded-2xl justify-start gap-3 font-black border-2"
            onClick={() => setStep("physicalRegister")}
          >
            <Shield className="w-5 h-5" />
            Physical Mastercard
          </Button>
        </div>
      )}

      {step === "virtual" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Create unlimited virtual cards. Block a card anytime after use.
          </p>

          {activeVirtual.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-bold">Pay with</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activeVirtual.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVirtualId(c.id)}
                      className={`flex-1 text-left p-3 rounded-xl border-2 transition-all ${
                        selectedVirtualId === c.id ? "border-emerald-600 bg-emerald-50" : "border-slate-100"
                      }`}
                    >
                      <p className="font-mono text-sm font-bold">{c.maskedPan}</p>
                      <p className="text-xs text-slate-500">{c.label}</p>
                    </button>
                    <Button type="button" variant="outline" size="sm" className="shrink-0 text-red-600" onClick={() => toggleBlock(c.id)}>
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeVirtual.length === 0 && (
            <p className="text-sm text-amber-800 bg-amber-50 rounded-xl p-3 font-medium">
              No virtual card yet — create one below (Binance-style instant issue).
            </p>
          )}

          <div className="rounded-xl border border-dashed border-slate-200 p-4 space-y-2">
            <Label className="text-xs font-bold">Create new virtual Mastercard</Label>
            <Input
              placeholder="Label (e.g. Travel, Bills)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="rounded-xl"
            />
            <Button type="button" variant="secondary" className="w-full rounded-xl font-bold gap-2" onClick={addVirtual}>
              <Plus className="w-4 h-4" />
              Issue virtual card
            </Button>
          </div>

          {blockedVirtual.length > 0 && (
            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-600">Blocked cards</p>
              {blockedVirtual.map((c) => (
                <div key={c.id} className="flex justify-between items-center py-1">
                  <span className="font-mono">{c.maskedPan}</span>
                  <Button type="button" variant="ghost" size="sm" className="text-emerald-600" onClick={() => toggleBlock(c.id)}>
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black"
            disabled={!selectedVirtualId}
            onClick={() => selectedVirtualId && void onFinalize("debit_card_virtual", { kind: "virtual", virtualCardId: selectedVirtualId })}
          >
            Continue with selected card
          </Button>
        </div>
      )}

      {step === "physicalRegister" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Register the last 4 digits of your physical Mastercard. You can create many virtual cards; one registered physical
            card per profile for Cash In / Out.
          </p>
          {!editingPhysical && physicalMastercardLast4 && physicalMastercardLast4.length === 4 ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase">Physical Mastercard</p>
                <p className="font-mono font-black text-lg">**** **** **** {physicalMastercardLast4}</p>
              </div>
              <Button
                className="w-full h-12 rounded-xl bg-emerald-600 font-black gap-2"
                onClick={() => void onFinalize("debit_card_physical", { kind: "physical" })}
              >
                <CheckCircle2 className="w-5 h-5" />
                Confirm with this card
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setPhysicalInput(physicalMastercardLast4 ?? "");
                  setEditingPhysical(true);
                }}
              >
                Change registered digits
              </Button>
            </div>
          ) : (
            <>
              <div>
                <Label>Last 4 digits</Label>
                <Input
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={physicalInput}
                  onChange={(e) => setPhysicalInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="h-12 rounded-xl font-mono text-lg tracking-widest"
                  placeholder="••••"
                />
              </div>
              <Button
                className="w-full h-12 rounded-xl bg-emerald-600 font-black gap-2"
                disabled={physicalInput.length !== 4}
                onClick={() => {
                  onPhysicalMastercardChange(physicalInput);
                  setEditingPhysical(false);
                  void onFinalize("debit_card_physical", { kind: "physical" });
                }}
              >
                <CheckCircle2 className="w-5 h-5" />
                Save &amp; continue
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
