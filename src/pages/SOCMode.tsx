import { useState, useEffect, useRef, useMemo, memo } from "react";
import { Monitor, X, AlertTriangle, Activity, Shield, Zap, Globe, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import CyberBackground from "@/components/CyberBackground";
import AttackMap from "@/components/dashboard/AttackMap";
import { useSimulation } from "@/contexts/SimulationContext";
import { generateLogEntry, threatIndicators } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// ----- Sub components (memoized for performance) -----

const LogLine = memo(({ log }: { log: string }) => {
  const cls = log.includes("CRITICAL")
    ? "text-neon-red"
    : log.includes("ERROR")
    ? "text-neon-amber"
    : log.includes("WARN")
    ? "text-neon-amber/70"
    : "text-muted-foreground";
  return <div className={cls}>{log}</div>;
});
LogLine.displayName = "LogLine";

const Sparkline = memo(({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-8">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
});
Sparkline.displayName = "Sparkline";

interface Metric {
  label: string;
  value: string;
  raw: number;
  history: number[];
  color: string;
  status: "ok" | "warn" | "crit";
}

const MetricRow = memo(({ m }: { m: Metric }) => (
  <div className="border-b border-primary/5 pb-2">
    <div className="flex justify-between items-center mb-1">
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
      <span className={cn("font-mono text-sm font-bold", m.color)}>{m.value}</span>
    </div>
    <Sparkline data={m.history} color={`hsl(var(--${m.status === "crit" ? "destructive" : m.status === "warn" ? "neon-amber" : "primary"}))`} />
  </div>
));
MetricRow.displayName = "MetricRow";

// ----- Main page -----

const MAX_LOGS = 150;
const MAX_HISTORY = 30;

const SOCMode = () => {
  const sim = useSimulation();
  const navigate = useNavigate();
  const [socLogs, setSocLogs] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  // Rolling metric history
  const historyRef = useRef({
    pps: [] as number[],
    bw: [] as number[],
    conn: [] as number[],
    cpu: [] as number[],
    mem: [] as number[],
    threats: [] as number[],
  });

  // Single ticker drives all live updates (efficient)
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      // Add 1-3 logs per tick depending on simulation
      const burst = sim.isRunning ? 2 + Math.floor(Math.random() * 3) : 1;
      const newLogs: string[] = [];
      for (let i = 0; i < burst; i++) {
        newLogs.push(generateLogEntry(sim.isRunning ? sim.attackType : undefined));
      }
      setSocLogs(prev => [...newLogs, ...prev].slice(0, MAX_LOGS));
      // Push to global log buffer (single batched call)
      newLogs.forEach(l => sim.addLog(l));

      // Update metric history
      const h = historyRef.current;
      const intensity = sim.isRunning ? sim.intensity / 100 : 0;
      const push = (arr: number[], v: number) => {
        arr.push(v);
        if (arr.length > MAX_HISTORY) arr.shift();
      };
      push(h.pps, 12000 + Math.random() * 5000 + intensity * 30000);
      push(h.bw, 0.5 + Math.random() * 1.5 + intensity * 4);
      push(h.conn, 3000 + Math.random() * 2000 + intensity * 8000);
      push(h.cpu, 30 + Math.random() * 30 + intensity * 40);
      push(h.mem, 50 + Math.random() * 20 + intensity * 25);
      push(h.threats, sim.totalThreats);

      setTick(t => t + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, [paused, sim.isRunning, sim.attackType, sim.intensity, sim.addLog, sim.totalThreats]);

  // Metrics derived from latest history
  const metrics: Metric[] = useMemo(() => {
    const h = historyRef.current;
    const last = (a: number[]) => a[a.length - 1] ?? 0;
    const cpu = last(h.cpu);
    const mem = last(h.mem);
    return [
      { label: "Packets/sec", value: Math.floor(last(h.pps)).toLocaleString(), raw: last(h.pps), history: [...h.pps], color: "text-primary", status: "ok" },
      { label: "Bandwidth", value: `${last(h.bw).toFixed(2)} Gbps`, raw: last(h.bw), history: [...h.bw], color: "text-neon-blue", status: last(h.bw) > 3 ? "warn" : "ok" },
      { label: "Active Conns", value: Math.floor(last(h.conn)).toLocaleString(), raw: last(h.conn), history: [...h.conn], color: "text-neon-amber", status: "ok" },
      { label: "CPU Load", value: `${Math.floor(cpu)}%`, raw: cpu, history: [...h.cpu], color: cpu > 80 ? "text-neon-red" : "text-neon-purple", status: cpu > 80 ? "crit" : cpu > 60 ? "warn" : "ok" },
      { label: "Memory", value: `${Math.floor(mem)}%`, raw: mem, history: [...h.mem], color: mem > 85 ? "text-neon-red" : "text-neon-blue", status: mem > 85 ? "crit" : "ok" },
      { label: "Threat Level", value: sim.isRunning ? "CRITICAL" : sim.activeAlerts > 30 ? "ELEVATED" : "GUARDED", raw: 0, history: [...h.threats], color: sim.isRunning ? "text-neon-red" : "text-neon-amber", status: sim.isRunning ? "crit" : "warn" },
    ];
  }, [tick, sim.isRunning, sim.activeAlerts]);

  // Top talkers (rotating live IP stats)
  const topTalkers = useMemo(() => {
    return threatIndicators.slice(0, 6).map(t => ({
      ip: t.value,
      packets: Math.floor(Math.random() * 50000 + 1000 + (sim.isRunning ? 30000 : 0)),
      severity: t.severity,
    })).sort((a, b) => b.packets - a.packets);
  }, [tick, sim.isRunning]);

  // Recent alerts feed
  const recentAlerts = useMemo(() => {
    return socLogs.filter(l => l.includes("CRITICAL") || l.includes("ERROR")).slice(0, 5);
  }, [socLogs]);

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
            <span className="font-mono text-[10px] text-muted-foreground ml-2">
              {new Date().toLocaleTimeString()} UTC
            </span>
            {sim.isRunning && (
              <span className="flex items-center gap-1 ml-4 px-2 py-0.5 rounded border border-neon-red/40 bg-neon-red/10">
                <AlertTriangle className="w-3.5 h-3.5 text-neon-red animate-pulse" />
                <span className="font-mono text-[10px] text-neon-red uppercase neon-pulse">
                  {sim.attackType.toUpperCase()} IN PROGRESS
                </span>
              </span>
            )}
            {sim.demoMode && (
              <span className="ml-2 px-2 py-0.5 rounded border border-neon-purple/40 bg-neon-purple/10 font-mono text-[10px] text-neon-purple uppercase">
                Demo Mode
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-4 font-mono text-xs">
              <span className="text-neon-red">Threats: {sim.totalThreats.toLocaleString()}</span>
              <span className="text-primary">Blocked: {sim.blockedAttacks.toLocaleString()}</span>
              <span className="text-neon-amber">Alerts: {sim.activeAlerts}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setPaused(p => !p)} className="h-7 px-2 font-mono text-[10px] uppercase">
              {paused ? <><Play className="w-3 h-3 mr-1" />Resume</> : <><Pause className="w-3 h-3 mr-1" />Pause</>}
            </Button>
            <Button size="icon" variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-primary h-7 w-7">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main grid: 12 cols */}
        <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-1 p-1 overflow-hidden">
          {/* Attack map - large */}
          <div className="col-span-7 row-span-3 glass-card rounded border border-primary/10 p-2 overflow-hidden">
            <AttackMap />
          </div>

          {/* Metrics with sparklines */}
          <div className="col-span-3 row-span-3 glass-card rounded border border-primary/10 p-3 overflow-auto">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-primary">Real-Time Metrics</h3>
            </div>
            <div className="space-y-2">
              {metrics.map(m => <MetricRow key={m.label} m={m} />)}
            </div>
          </div>

          {/* Recent alerts */}
          <div className="col-span-2 row-span-3 glass-card rounded border border-neon-red/20 p-3 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-neon-red" />
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-neon-red">Critical Alerts</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-1.5">
                {recentAlerts.length === 0 ? (
                  <div className="font-mono text-[10px] text-muted-foreground italic">No critical alerts</div>
                ) : (
                  recentAlerts.map((a, i) => (
                    <div key={i} className="font-mono text-[9px] text-neon-red/90 leading-tight border-l-2 border-neon-red/50 pl-1.5 py-0.5">
                      {a.slice(0, 200)}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Top talkers */}
          <div className="col-span-3 row-span-3 glass-card rounded border border-primary/10 p-3 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-3.5 h-3.5 text-neon-blue" />
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-neon-blue">Top Talkers (Malicious)</h3>
            </div>
            <div className="space-y-1.5 flex-1 overflow-auto">
              {topTalkers.map(t => {
                const pct = Math.min(100, (t.packets / 80000) * 100);
                const color = t.severity === "critical" ? "bg-neon-red" : t.severity === "high" ? "bg-neon-amber" : "bg-neon-blue";
                return (
                  <div key={t.ip} className="space-y-0.5">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-foreground/80">{t.ip}</span>
                      <span className="text-muted-foreground">{t.packets.toLocaleString()}</span>
                    </div>
                    <div className="h-1 bg-card rounded-full overflow-hidden">
                      <div className={cn("h-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Defense posture */}
          <div className="col-span-3 row-span-3 glass-card rounded border border-primary/10 p-3 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-primary">Defense Posture</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              {[
                { label: "Firewall", status: "ACTIVE", val: 99 },
                { label: "IDS/IPS", status: sim.isRunning ? "ENGAGED" : "ACTIVE", val: sim.isRunning ? 87 : 98 },
                { label: "WAF", status: "ACTIVE", val: 96 },
                { label: "EDR", status: "ACTIVE", val: 94 },
                { label: "DLP", status: "ACTIVE", val: 91 },
                { label: "SIEM", status: "ACTIVE", val: 99 },
              ].map(d => (
                <div key={d.label} className="border border-primary/10 rounded p-2 bg-card/30">
                  <div className="font-mono text-[9px] text-muted-foreground uppercase">{d.label}</div>
                  <div className="font-mono text-xs text-primary font-bold">{d.status}</div>
                  <div className="h-0.5 bg-muted rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${d.val}%` }} />
                  </div>
                  <div className="font-mono text-[9px] text-muted-foreground mt-0.5">{d.val}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live logs - full width */}
          <div className="col-span-6 row-span-3 glass-card rounded border border-primary/10 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-primary/10">
              <div className="flex items-center gap-2">
                <span className={cn("w-1.5 h-1.5 rounded-full", paused ? "bg-muted" : "bg-primary animate-pulse")} />
                <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Live System Logs</span>
                <span className="font-mono text-[9px] text-muted-foreground">({socLogs.length}/{MAX_LOGS})</span>
              </div>
              <button
                onClick={() => setAutoScroll(a => !a)}
                className={cn("font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border", autoScroll ? "border-primary/40 text-primary" : "border-muted text-muted-foreground")}
              >
                {autoScroll ? "Auto" : "Manual"}
              </button>
            </div>
            <ScrollArea className="flex-1 p-2">
              <div className="font-mono text-[10px] leading-relaxed">
                {socLogs.map((log, i) => <LogLine key={`${i}-${log.slice(0, 30)}`} log={log} />)}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOCMode;
