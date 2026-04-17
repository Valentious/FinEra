import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { 
  UserCircle, 
  MapPin, 
  Star, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Search,
  Navigation,
  Clock,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Agent {
  id: string;
  name: string;
  location: string;
  rating: number;
  agentCode: string;
  distance: string;
  availability: "Online" | "Offline";
  contact: string;
}

const MOCK_AGENTS: Agent[] = [
  { id: "A1", name: "Simba Mukanya", location: "Civic Centre", rating: 4.9, agentCode: "AG-9921", distance: "0.4 km", availability: "Online", contact: "+263 77 123 4567" },
  { id: "A2", name: "Chipo Mupemhi", location: "Community Hub", rating: 4.8, agentCode: "AG-8812", distance: "0.8 km", availability: "Online", contact: "+263 71 987 6543" },
  { id: "A3", name: "Tinashe Zhou", location: "Main Gate Plaza", rating: 4.7, agentCode: "AG-7733", distance: "1.2 km", availability: "Online", contact: "+263 73 555 1212" },
  { id: "A4", name: "Farai Gumbo", location: "Tech Park", rating: 4.6, agentCode: "AG-6644", distance: "1.5 km", availability: "Offline", contact: "+263 77 333 4444" },
];

interface AgentGatewayProps {
  type: 'deposit' | 'withdrawal' | 'repayment';
  amount: number;
  onSuccess: (txnId: string) => void;
  onCancel: () => void;
}

export function AgentGateway({ type, amount, onSuccess, onCancel }: AgentGatewayProps) {
  const [step, setStep] = useState<"list" | "details" | "confirmation" | "verifying" | "success">("list");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [txnCode, setTxnCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setStep("details");
  };

  const handleConfirmInitiation = () => {
    setStep("confirmation");
  };

  const handleVerifyTransaction = () => {
    setIsVerifying(true);
    setStep("verifying");
    
    // Simulate real-time update logic
    setTimeout(() => {
      setIsVerifying(false);
      setStep("success");
      onSuccess(`AGT-${Date.now().toString().slice(-6)}`);
    }, 3000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <AnimatePresence mode="wait">
        {step === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-foreground">Find Nearby Agent</h2>
                <p className="text-muted-foreground font-medium">Payment Agent Gateway • Proximity Sort</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-full">Map View</Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search location or agent name..." className="pl-10 h-12 rounded-xl bg-card border-border" />
            </div>

            <div className="space-y-3">
              {MOCK_AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-600 transition-all text-left group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                          <UserCircle className="w-8 h-8 text-muted-foreground" />
                        </div>
                        {agent.availability === "Online" && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-whatsapp-green border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-foreground group-hover:text-emerald-600 transition-colors">{agent.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {agent.location}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-muted-foreground font-black">
                            {agent.distance}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-xs font-black">{agent.rating}</span>
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">{agent.agentCode}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === "details" && selectedAgent && (
          <motion.div
            key="details"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <Card className="p-8 border-none bg-slate-900 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full -mr-16 -mt-16" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                  <UserCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-black">{selectedAgent.name}</h3>
                <p className="text-emerald-300 font-bold text-sm">{selectedAgent.location} Agent • {selectedAgent.agentCode}</p>
                
                <div className="flex gap-4 mt-8 w-full">
                  <button className="flex-1 bg-white/10 hover:bg-white/20 py-4 rounded-2xl border border-white/10 flex flex-col items-center gap-1 transition-all">
                    <Phone className="w-5 h-5 text-whatsapp-green" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Call</span>
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 py-4 rounded-2xl border border-white/10 flex flex-col items-center gap-1 transition-all">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Chat</span>
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 py-4 rounded-2xl border border-white/10 flex flex-col items-center gap-1 transition-all">
                    <Navigation className="w-5 h-5 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Locate</span>
                  </button>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-slate-100 shadow-sm bg-white space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-bold">Amount to {type === 'withdrawal' ? 'receive' : 'pay'}</span>
                <span className="text-2xl font-black text-foreground">${amount.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Please contact the agent before proceeding. Ensure you are at the agent's location for immediate verification.
                </p>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("list")} className="flex-1 h-14 rounded-2xl font-black">Go Back</Button>
              <Button onClick={handleConfirmInitiation} className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black gap-2 shadow-xl shadow-emerald-100">
                Initiate Transaction <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "confirmation" && selectedAgent && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-foreground">Awaiting Agent Confirmation</h3>
              <p className="text-muted-foreground font-medium">Ask the agent to confirm your request on their portal.</p>
            </div>

            <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Agent Verification Code</p>
              <p className="text-4xl font-black text-foreground tracking-[0.5em]">{selectedAgent.agentCode.split('-')[1]}</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-muted-foreground uppercase ml-1">Agent Transaction ID</label>
                <Input 
                  value={txnCode} 
                  onChange={(e) => setTxnCode(e.target.value)}
                  placeholder="Enter ID from Agent" 
                  className="h-14 text-center text-xl font-black tracking-widest bg-white border-2 border-emerald-100 focus:border-emerald-600 rounded-2xl"
                />
              </div>
              <Button 
                disabled={!txnCode}
                onClick={handleVerifyTransaction}
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black shadow-xl"
              >
                Verify & Complete
              </Button>
            </div>
          </motion.div>
        )}

        {step === "verifying" && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="relative">
              <div className="w-24 h-24 border-4 border-emerald-100 rounded-full" />
              <Loader2 className="w-24 h-24 text-emerald-600 animate-spin absolute top-0 left-0" />
            </div>
            <h3 className="text-2xl font-black mt-8 text-foreground">Validating Agent Data...</h3>
            <p className="text-muted-foreground font-medium mt-2">Syncing with real-time financial logs.</p>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 bg-whatsapp-green-light rounded-full flex items-center justify-center mx-auto text-whatsapp-green">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-foreground">Transaction Verified</h2>
              <p className="text-muted-foreground font-medium mt-1">Funds updated instantly in your account.</p>
            </div>

            <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl bg-white text-left">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold text-[10px] uppercase">Agent</span>
                  <span className="text-foreground font-black">{selectedAgent?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold text-[10px] uppercase">Amount</span>
                  <span className="text-foreground font-black">${amount.toLocaleString()}</span>
                </div>
                <div className="h-[1px] bg-slate-100 my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold text-[10px] uppercase">Verification Code</span>
                  <span className="text-emerald-600 font-black">{txnCode}</span>
                </div>
              </div>
            </Card>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-muted-foreground font-medium italic">
                A confirmation SMS and receipt have been sent to your registered contact. 15-minute reversal window active.
              </p>
            </div>

            <Button 
              onClick={onCancel} // This will trigger the parent's success flow
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-lg font-bold"
            >
              Continue
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
