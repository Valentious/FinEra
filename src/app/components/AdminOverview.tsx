import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  Plus, 
  FileDown, 
  Clock, 
  Search,
  History,
  Activity,
  UserPlus
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { motion } from "framer-motion";

interface AdminOverviewProps {
  totalCapital: number;
  activeCreditPortfolio: number;
  repaymentRate: number;
  totalUsers: number;
  onBack: () => void;
}

const auditLogs = [
  { id: 1, time: "10:15 AM", user: "Admin/Sarah", action: "Approved Credit #L882", target: "MEM99281", status: "Success" },
  { id: 2, time: "09:42 AM", user: "System/Audit", action: "Integrity Check", target: "Data Pool", status: "Verified" },
  { id: 3, time: "09:30 AM", user: "Admin/Robert", action: "Override Limit", target: "MEM88212", status: "Logged" },
  { id: 4, time: "08:12 AM", user: "Gateway", action: "Deposit Verify", target: "TXN7721", status: "Sync" },
];

const loanApplications = [
  { id: "L992", name: "Tinashe Moyo", type: "Essential", amount: 450, status: "Pending", time: "2h ago" },
  { id: "L991", name: "Dr. Sarah Phiri", type: "Business", amount: 1200, status: "Under Review", time: "4h ago" },
  { id: "L990", name: "John Doe", type: "Essential", amount: 200, status: "Pending", time: "5h ago" },
];

const recentMembers = [
  { id: "MEM101", name: "Anesu Chida", type: "Student", idStatus: "Verified", date: "Today" },
  { id: "MEM102", name: "Prof. Mutasa", type: "Staff", idStatus: "Verified", date: "Yesterday" },
  { id: "MEM103", name: "Grace Ncube", type: "Employer", idStatus: "Pending Scan", date: "Yesterday" },
];

const riskDistData = [
  { name: "Low Risk", value: 65, color: "#10b981" },
  { name: "Medium Risk", value: 25, color: "#f59e0b" },
  { name: "High Risk", value: 10, color: "#ef4444" },
];

export function AdminOverview({
  totalCapital,
  activeCreditPortfolio,
  repaymentRate,
  totalUsers,
  onBack
}: AdminOverviewProps) {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground">Institutional Oversight</h1>
            <p className="text-muted-foreground font-medium text-sm">Real-time audit & capital management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold">
            <FileDown className="w-4 h-4 mr-2" />
            Export Audit
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Capital", val: `$${totalCapital.toLocaleString()}`, color: "emerald" },
          { label: "Active Portfolio", val: `$${activeCreditPortfolio.toLocaleString()}`, color: "emerald" },
          { label: "Repayment Rate", val: `${repaymentRate}%`, color: "green" },
          { label: "Total Members", val: totalUsers.toLocaleString(), color: "purple" },
        ].map((stat, i) => (
          <Card key={i} className="p-5 border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-xl font-black mt-1 text-foreground">{stat.val}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Widget */}
        <Card className="p-6 border-slate-100 shadow-sm h-fit">
          <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Positive Risk Distribution
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {riskDistData.map((entry, index) => (
                    <motion.rect key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {riskDistData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-bold text-muted-foreground">{item.name}</span>
                <span className="font-black text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* New Member Registration & Recently Joined */}
        <Card className="p-6 border-slate-100 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Recent Onboarding
            </h3>
          </div>
          <div className="space-y-4">
            {recentMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-[10px] text-emerald-600 shadow-sm">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-foreground">{member.name}</p>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">{member.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${member.idStatus === 'Verified' ? 'bg-whatsapp-green-light text-whatsapp-green' : 'bg-amber-100 text-amber-700'}`}>
                    {member.idStatus}
                  </span>
                  <p className="text-[9px] text-muted-foreground mt-1 font-bold">{member.date}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-4 h-8 text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-emerald-600">
            View All Members
          </Button>
        </Card>

        {/* Loan Applications Management */}
        <Card className="p-6 border-slate-100 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Pending Applications
            </h3>
          </div>
          <div className="space-y-4">
            {loanApplications.map((app) => (
              <div key={app.id} className="flex flex-col p-3 rounded-xl bg-slate-50 border border-transparent hover:border-emerald-100 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-emerald-600">{app.id}</span>
                  <span className="text-[10px] text-muted-foreground font-bold">{app.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-foreground">{app.name}</p>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase">{app.type} Credit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-foreground">${app.amount}</p>
                    <p className="text-[9px] text-amber-600 font-black">{app.status}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors">APPROVE</button>
                  <button className="flex-1 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">DECLINE</button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-4 h-8 text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-emerald-600">
            Open Credit Desk
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Audit Logs Widget - Moved to its own row for better visibility */}
        <Card className="p-6 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              Real-time Audit Logs
            </h3>
            <span className="text-[10px] font-black text-green-600 px-2 py-1 bg-green-50 rounded-full animate-pulse">LIVE SYNC</span>
          </div>
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-black text-foreground">{log.action}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{log.user} • Target: {log.target}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{log.time}</span>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">{log.status}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="link" className="w-full mt-4 text-emerald-600 font-bold text-xs" onClick={() => toast.info("Full audit vault opening...")}>
            View Full Audit Vault
          </Button>
        </Card>
      </div>

      {/* Quick Access to System Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Liquidation Rules", desc: "Automated asset recovery settings" },
          { title: "Academic Ties", desc: "Student portal restriction gates" },
          { title: "Payroll Recovery", desc: "Staff deduction schedule sync" }
        ].map((rule, i) => (
          <Card key={i} className="p-4 border-slate-100 bg-white hover:border-emerald-100 transition-all cursor-pointer group">
            <h4 className="font-black text-foreground group-hover:text-emerald-600">{rule.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{rule.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

