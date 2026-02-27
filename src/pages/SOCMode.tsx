import { useState, useEffect } from "react";
import { Monitor, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import CyberBackground from "@/components/CyberBackground";
import AttackMap from "@/components/dashboard/AttackMap";
import { useSimulation } from "@/contexts/SimulationContext";
import { generateLogEntry } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const SOCMode = () => {
  const sim = useSimulation();
  const navigate = useNavigate();
  const [socLogs, setSocLogs] = useState<string[]>([]);

  // Auto-generate logs every 3-5s
  useEffect(() => {
    const interval = setInterval(() => {
      const log = generateLogEntry(sim.isRunning ? sim.attackType : undefined);
      setSocLogs(prev => [log, ...prev].slice(0, 300));
      sim.addLog(log);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [sim.isRunning, sim.attackType]);

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <CyberBackground />
      <div className="relative z-10 flex flex-col h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-primary/10 glass-card">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm uppercase tracking-widest text-primary text-glow-green">
              SOC Command Center
            </span>
            {sim.isRunning && (
              <span className="flex items-center gap-1 ml-4">
                <AlertTriangle className="w-4 h-4 text-neon-red animate-pulse" />
                <span className="font-mono text-xs text-neon-red uppercase neon-pulse">ATTACK IN PROGRESS</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-4 font-mono text-xs">
              <span className="text-neon-red">Threats: {sim.totalThreats.toLocaleString()}</span>
              <span className="text-primary">Blocked: {sim.blockedAttacks.toLocaleString()}</span>
              <span className="text-neon-amber">Alerts: {sim.activeAlerts}</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-primary"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main grid */}
        <div className="flex-1 grid grid-cols-3 gap-0.5 p-0.5 overflow-hidden">
          {/* Attack Map - large */}
          <div className="col-span-2 row-span-1 glass-card rounded border border-primary/10 p-2 overflow-hidden">
            <AttackMap />
          </div>

          {/* Metrics panel */}
          <div className="glass-card rounded border border-primary/10 p-4 space-y-4 overflow-auto">
            <h3 className="font-mono text-xs uppercase tracking-widest text-primary">Real-Time Metrics</h3>
            {[
              { label: "Packets/sec", value: Math.floor(12000 + Math.random() * 5000).toLocaleString(), color: "text-primary" },
              { label: "Bandwidth", value: `${(Math.random() * 2 + 0.5).toFixed(1)} Gbps`, color: "text-neon-blue" },
              { label: "Active Connections", value: Math.floor(3000 + Math.random() * 2000).toLocaleString(), color: "text-neon-amber" },
              { label: "CPU Load", value: `${Math.floor(30 + Math.random() * 40)}%`, color: "text-neon-purple" },
              { label: "Memory", value: `${Math.floor(50 + Math.random() * 30)}%`, color: "text-neon-blue" },
              { label: "Threat Level", value: sim.isRunning ? "CRITICAL" : "ELEVATED", color: sim.isRunning ? "text-neon-red" : "text-neon-amber" },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center border-b border-primary/5 pb-2">
                <span className="font-mono text-xs text-muted-foreground uppercase">{m.label}</span>
                <span className={cn("font-mono text-sm font-bold", m.color)}>{m.value}</span>
              </div>
            ))}
          </div>

          {/* Live terminal logs */}
          <div className="col-span-3 glass-card rounded border border-primary/10 flex flex-col overflow-hidden" style={{ maxHeight: "40vh" }}>
            <div className="flex items-center gap-2 px-4 py-2 border-b border-primary/10">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-primary">Live System Logs</span>
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="font-mono text-[11px] leading-relaxed space-y-0.5">
                {socLogs.map((log, i) => (
                  <div
                    key={i}
                    className={cn(
                      log.includes("CRITICAL") && "text-neon-red",
                      log.includes("ERROR") && "text-neon-amber",
                      log.includes("WARN") && "text-neon-amber/70",
                      log.includes("INFO") && "text-muted-foreground",
                    )}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOCMode;
