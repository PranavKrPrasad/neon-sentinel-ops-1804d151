import { ShieldAlert, ShieldCheck, AlertTriangle, Clock, Bot, FlaskConical, Monitor, Search, Map, Network, Mail, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CyberLayout from "@/components/layout/CyberLayout";
import TopBanner from "@/components/dashboard/TopBanner";
import StatCard from "@/components/dashboard/StatCard";
import ConfidenceGauge from "@/components/dashboard/ConfidenceGauge";
import AttackMap from "@/components/dashboard/AttackMap";
import TrafficChart from "@/components/dashboard/TrafficChart";
import { useSimulation } from "@/contexts/SimulationContext";

const modules = [
  { icon: Bot, label: "AI Assistant", desc: "Threat analysis terminal", path: "/ai-assistant", color: "border-primary/30 hover:border-primary/60 text-primary neon-glow-green" },
  { icon: FlaskConical, label: "Simulation Lab", desc: "Attack simulation & testing", path: "/simulation", color: "border-accent/30 hover:border-accent/60 text-accent neon-glow-purple" },
  { icon: Monitor, label: "SOC Mode", desc: "Immersive command center", path: "/soc", color: "border-neon-blue/30 hover:border-neon-blue/60 text-neon-blue neon-glow-blue" },
  { icon: Search, label: "Threat Intel", desc: "IOC database & indicators", path: "/threat-intel", color: "border-neon-red/30 hover:border-neon-red/60 text-neon-red neon-glow-red" },
  { icon: Map, label: "MITRE ATT&CK", desc: "Interactive technique matrix", path: "/mitre", color: "border-accent/30 hover:border-accent/60 text-accent neon-glow-purple" },
  { icon: Network, label: "Network", desc: "Topology & traffic monitor", path: "/network", color: "border-neon-blue/30 hover:border-neon-blue/60 text-neon-blue neon-glow-blue" },
  { icon: Mail, label: "Spam & Spoofing", desc: "AI email threat detection", path: "/spam", color: "border-neon-amber/30 hover:border-neon-amber/60 text-neon-amber neon-glow-amber" },
  { icon: Brain, label: "AI Training", desc: "Live adaptive learning lab", path: "/training", color: "border-primary/30 hover:border-primary/60 text-primary neon-glow-green" },
];

const Index = () => {
  const navigate = useNavigate();
  const sim = useSimulation();

  return (
    <CyberLayout>
      <div className="space-y-6 animate-fade-in">
        <TopBanner />

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ShieldAlert} label="Total Threats" value={sim.totalThreats.toLocaleString()} trend={sim.isRunning ? "⚡ LIVE" : "+12% last 24h"} color="red" />
          <StatCard icon={ShieldCheck} label="Blocked Attacks" value={sim.blockedAttacks.toLocaleString()} trend={`${((sim.blockedAttacks / sim.totalThreats) * 100).toFixed(1)}% blocked`} color="green" />
          <StatCard icon={AlertTriangle} label="Active Alerts" value={sim.activeAlerts.toString()} trend={sim.isRunning ? "⚠ ACTIVE SIM" : "5 critical"} color="amber" />
          <StatCard icon={Clock} label="System Uptime" value="99.97%" trend="47 days" color="blue" />
        </div>

        {/* Module Tiles */}
        <div>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {modules.map(m => (
              <button
                key={m.path}
                onClick={() => navigate(m.path)}
                className={`glass-card rounded-lg border p-4 flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] text-left ${m.color}`}
              >
                <m.icon className="w-8 h-8 shrink-0 opacity-80" />
                <div>
                  <div className="font-mono text-sm font-bold uppercase tracking-wide">{m.label}</div>
                  <div className="font-mono text-xs text-muted-foreground mt-0.5">{m.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <AttackMap />
          </div>
          <ConfidenceGauge value={sim.defenseScore || 94} />
        </div>

        {/* Traffic chart */}
        <TrafficChart />
      </div>
    </CyberLayout>
  );
};

export default Index;
