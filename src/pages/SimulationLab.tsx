import { useState } from "react";
import CyberLayout from "@/components/layout/CyberLayout";
import { FlaskConical, Play, Square, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSimulation } from "@/contexts/SimulationContext";
import { attackTypes } from "@/data/mock-data";
import { cn } from "@/lib/utils";

const SimulationLab = () => {
  const sim = useSimulation();
  const [attackType, setAttackType] = useState("ddos");
  const [intensity, setIntensity] = useState([50]);

  return (
    <CyberLayout>
      <div className={cn("space-y-6 animate-fade-in relative", sim.isRunning && "screen-shake-container")}>
        {/* Red overlay during simulation */}
        {sim.isRunning && (
          <div className="fixed inset-0 z-20 pointer-events-none bg-neon-red/5 animate-pulse" />
        )}

        {/* Intrusion banner */}
        {sim.isRunning && sim.detectionTime && (
          <div className="fixed top-0 left-0 right-0 z-40 bg-neon-red/20 border-b border-neon-red/50 py-2 text-center neon-glow-red">
            <span className="font-mono text-sm text-neon-red uppercase tracking-widest neon-pulse">
              ⚠ INTRUSION DETECTED — Detection Time: {sim.detectionTime}s — Defense Score: {sim.defenseScore}%
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 neon-glow-purple">
            <FlaskConical className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="font-mono text-lg uppercase tracking-widest text-primary text-glow-green">Simulation Lab</h1>
            <p className="font-mono text-xs text-muted-foreground">Attack simulation & defense testing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Controls */}
          <div className="glass-card rounded-lg border border-primary/10 p-5 space-y-5">
            <h2 className="font-mono text-sm uppercase tracking-widest text-primary">Attack Configuration</h2>

            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground uppercase">Attack Type</label>
              <Select value={attackType} onValueChange={setAttackType} disabled={sim.isRunning}>
                <SelectTrigger className="font-mono text-sm bg-background/50 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {attackTypes.map(a => (
                    <SelectItem key={a.value} value={a.value} className="font-mono text-sm">
                      {a.label} ({a.mitre})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground uppercase">Intensity: {intensity[0]}%</label>
              <Slider
                value={intensity}
                onValueChange={setIntensity}
                min={10}
                max={100}
                step={5}
                disabled={sim.isRunning}
                className="[&_[role=slider]]:border-primary"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => sim.startSimulation(attackType, intensity[0])}
                disabled={sim.isRunning}
                className="flex-1 font-mono text-xs uppercase bg-neon-red/20 hover:bg-neon-red/30 border border-neon-red/40 text-neon-red"
              >
                <Play className="w-4 h-4 mr-1" /> Start
              </Button>
              <Button
                onClick={sim.stopSimulation}
                disabled={!sim.isRunning}
                className="flex-1 font-mono text-xs uppercase bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary"
              >
                <Square className="w-4 h-4 mr-1" /> Stop
              </Button>
            </div>

            {/* Results */}
            {sim.detectionTime !== null && (
              <div className="space-y-3 pt-3 border-t border-primary/10">
                <h3 className="font-mono text-xs uppercase text-primary tracking-widest">Results</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 rounded bg-background/50 border border-primary/10">
                    <div className="font-mono text-lg font-bold text-neon-amber">{sim.detectionTime}s</div>
                    <div className="font-mono text-[10px] text-muted-foreground uppercase">Detection Time</div>
                  </div>
                  <div className="text-center p-2 rounded bg-background/50 border border-primary/10">
                    <div className={cn("font-mono text-lg font-bold", (sim.defenseScore || 0) > 80 ? "text-primary" : "text-neon-red")}>
                      {sim.defenseScore}%
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground uppercase">Defense Score</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Logs */}
          <div className="lg:col-span-2 glass-card rounded-lg border border-primary/10 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-mono text-sm uppercase tracking-widest text-primary">Live Attack Logs</h2>
              {sim.isRunning && (
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-neon-red animate-pulse" />
                  <span className="font-mono text-xs text-neon-red uppercase">Active</span>
                </span>
              )}
            </div>
            <ScrollArea className="flex-1 max-h-[500px] bg-background/30 rounded p-3">
              <div className="font-mono text-xs space-y-0.5">
                {sim.logs.length === 0 && (
                  <p className="text-muted-foreground opacity-50">Waiting for simulation data...</p>
                )}
                {sim.logs.map((log, i) => (
                  <div
                    key={i}
                    className={cn(
                      "py-0.5 leading-relaxed",
                      log.includes("CRITICAL") && "text-neon-red",
                      log.includes("ERROR") && "text-neon-amber",
                      log.includes("WARN") && "text-neon-amber/70",
                      log.includes("INFO") && "text-muted-foreground",
                      log.includes("INTRUSION") && "text-neon-red font-bold neon-pulse"
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
    </CyberLayout>
  );
};

export default SimulationLab;
