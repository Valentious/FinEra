import { Button } from "@/app/components/ui/button";
import { 
  LayoutDashboard, 
  CreditCard, 
  PiggyBank, 
  GraduationCap, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Menu,
  X
} from "lucide-react";
import { FinEraShieldIcon } from "@/app/components/FinEraShieldIcon";
import { FinEraLogoText } from "@/app/components/FinEraLogoText";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MainNavigationProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  userName: string;
  accountNumber?: string;
  isAdmin?: boolean;
}

export function MainNavigation({ activeScreen, onNavigate, onLogout, userName, accountNumber, isAdmin }: MainNavigationProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "applyForCredit", label: "Credit & Loans", icon: CreditCard },
    { id: "savingsWallet", label: "Savings Wallet", icon: PiggyBank },
    { id: "financialEducation", label: "Learning Hub", icon: GraduationCap },
    { id: "profileSettings", label: "Account Settings", icon: Settings },
  ];

  return (
    <>
      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-slate-600/30 z-40 px-4 flex items-center justify-between bg-slate-800">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-slate-200 hover:text-white hover:bg-white/10"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("dashboard")}>
            <FinEraShieldIcon size={32} className="rounded-lg" />
            <div className="hidden sm:flex flex-col leading-tight">
              <FinEraLogoText variant="dark" size="md" as="span" className="font-bold text-lg [&_.fin]:text-white [&_.era]:text-emerald-400" />
              <span className="font-semibold text-xs text-slate-300 tracking-wider uppercase">INCLUSIVE CREDIT</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative text-slate-200 hover:text-white hover:bg-white/10">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-800" />
          </Button>
          <div className="h-8 w-[1px] bg-slate-500/50 mx-1" />
          <div className="flex items-center gap-2 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none text-white">{userName}</p>
              <p className="text-[10px] text-slate-300 font-semibold tracking-wide">
                {accountNumber ? `Acc: ${accountNumber}` : 'Verified Member'}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 shadow-sm cursor-pointer hover:bg-white/30" onClick={() => onNavigate("profileSettings")}>
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Desktop */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-100 hidden md:flex flex-col p-4 z-30">
        <div className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeScreen === item.id 
                  ? "bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/50" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeScreen === item.id ? "text-emerald-600" : "text-slate-400"}`} />
              <span className="font-medium">{item.label}</span>
              {activeScreen === item.id && (
                <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-50">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-[60] md:hidden flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-2">
                  <FinEraShieldIcon size={32} className="rounded-lg" />
                  <div className="flex flex-col leading-tight">
                    <FinEraLogoText variant="light" size="md" as="span" className="font-bold text-lg" />
                    <span className="font-semibold text-xs text-slate-600 tracking-wider uppercase">INCLUSIVE CREDIT</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex-1 space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                      activeScreen === item.id 
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <item.icon className={`w-6 h-6 ${activeScreen === item.id ? "text-white" : "text-slate-400"}`} />
                    <span className="font-bold text-lg">{item.label}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={onLogout}
                className="mt-auto w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-6 h-6" />
                <span className="font-bold text-lg">Logout</span>
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}