import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  FlaskConical,
  Monitor,
  Search,
  Map,
  Network,
  Mail,
  Brain,
  Shield,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/contexts/SimulationContext";
import { Switch } from "@/components/ui/switch";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Bot, label: "AI Assistant", path: "/ai-assistant" },
  { icon: FlaskConical, label: "Simulation Lab", path: "/simulation" },
  { icon: Monitor, label: "SOC Mode", path: "/soc" },
  { icon: Search, label: "Threat Intel", path: "/threat-intel" },
  { icon: Map, label: "MITRE ATT&CK", path: "/mitre" },
  { icon: Network, label: "Network", path: "/network" },
  { icon: Mail, label: "Spam & Spoofing", path: "/spam" },
  { icon: Brain, label: "AI Training", path: "/training" },
];

const NavSidebar = () => {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();
  const sim = useSimulation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen z-30 flex flex-col glass-card border-r border-primary/10 transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-primary/10">
        <Shield className="w-7 h-7 text-primary shrink-0" />
        {!collapsed && (
          <span className="font-mono text-sm font-bold text-primary uppercase tracking-wider whitespace-nowrap">
            AI-IDS
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-primary neon-glow-green"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium uppercase tracking-wide whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Demo Mode Toggle */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={cn("w-4 h-4", sim.demoMode ? "text-neon-amber" : "text-muted-foreground")} />
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Demo</span>
            </div>
            <Switch checked={sim.demoMode} onCheckedChange={sim.toggleDemoMode} />
          </div>
        </div>
      )}
      {collapsed && (
        <div className="px-3 py-3 border-t border-primary/10 flex justify-center">
          <button
            onClick={sim.toggleDemoMode}
            className={cn("p-1.5 rounded transition-colors", sim.demoMode ? "text-neon-amber bg-neon-amber/10" : "text-muted-foreground hover:text-primary")}
            title="Toggle Demo Mode"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-primary/10 text-muted-foreground hover:text-primary transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : <ChevronLeft className="w-5 h-5 mx-auto" />}
      </button>
    </aside>
  );
};

export default NavSidebar;
