import { useState } from "react";
import CyberLayout from "@/components/layout/CyberLayout";
import { Map } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { mitreTactics, mitreTechniques, MitreTechnique } from "@/data/mock-data";
import { useSimulation } from "@/contexts/SimulationContext";
import { cn } from "@/lib/utils";

const severityColors: Record<string, string> = {
  critical: "border-neon-red/60 bg-neon-red/15 text-neon-red",
  high: "border-neon-amber/60 bg-neon-amber/15 text-neon-amber",
  medium: "border-neon-blue/60 bg-neon-blue/15 text-neon-blue",
  low: "border-primary/60 bg-primary/15 text-primary",
};

const MitreMapping = () => {
  const [selected, setSelected] = useState<MitreTechnique | null>(null);
  const sim = useSimulation();

  const getTechniquesForTactic = (tactic: string) =>
    mitreTechniques.filter(t => t.tactic === tactic);

  const isDetected = (techId: string) =>
    sim.detectedTechniques.includes(techId);

  return (
    <CyberLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 neon-glow-purple">
            <Map className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="font-mono text-lg uppercase tracking-widest text-primary text-glow-green">MITRE ATT&CK Mapping</h1>
            <p className="font-mono text-xs text-muted-foreground">
              Interactive attack framework matrix — {sim.detectedTechniques.length} techniques detected
            </p>
          </div>
        </div>

        {/* Matrix */}
        <div className="overflow-x-auto">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${mitreTactics.length}, minmax(130px, 1fr))` }}>
            {/* Headers */}
            {mitreTactics.map(tactic => (
              <div key={tactic} className="glass-card rounded-t-lg border border-primary/10 px-2 py-2 text-center">
                <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold">{tactic}</span>
              </div>
            ))}

            {/* Technique cells */}
            {mitreTactics.map(tactic => (
              <div key={`col-${tactic}`} className="space-y-1">
                {getTechniquesForTactic(tactic).map(tech => {
                  const detected = isDetected(tech.id);
                  return (
                    <button
                      key={tech.id}
                      onClick={() => setSelected(tech)}
                      className={cn(
                        "w-full text-left rounded border px-2 py-2 transition-all duration-200 hover:scale-[1.02]",
                        detected
                          ? cn(severityColors[tech.severity], "neon-glow-purple")
                          : "border-muted/20 bg-muted/5 text-muted-foreground/50 hover:border-muted/40"
                      )}
                    >
                      <div className="font-mono text-[10px] font-bold">{tech.id}</div>
                      <div className="font-mono text-[9px] leading-tight mt-0.5 line-clamp-2">{tech.name}</div>
                      {detected && (
                        <div className="mt-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 font-mono text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-neon-red/60 bg-neon-red/15" /> Critical</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-neon-amber/60 bg-neon-amber/15" /> High</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-neon-blue/60 bg-neon-blue/15" /> Medium</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-primary/60 bg-primary/15" /> Low</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-muted/20 bg-muted/5" /> Not Detected</span>
        </div>

        {/* Detail modal */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="glass-card border-primary/20 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-mono text-primary text-glow-green flex items-center gap-2">
                {selected?.id}
                {selected && isDetected(selected.id) && (
                  <Badge className="font-mono text-[10px] bg-neon-red/20 text-neon-red border border-neon-red/30">DETECTED</Badge>
                )}
              </DialogTitle>
              <DialogDescription className="font-mono text-sm text-foreground">{selected?.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <span className="font-mono text-xs uppercase text-muted-foreground">Tactic</span>
                <p className="font-mono text-sm text-accent">{selected?.tactic}</p>
              </div>
              <div>
                <span className="font-mono text-xs uppercase text-muted-foreground">Description</span>
                <p className="font-mono text-sm text-foreground/80">{selected?.description}</p>
              </div>
              <div>
                <span className="font-mono text-xs uppercase text-muted-foreground">Severity</span>
                <Badge className={cn("ml-2 font-mono text-[10px] border", severityColors[selected?.severity || "low"])}>
                  {selected?.severity?.toUpperCase()}
                </Badge>
              </div>
              {selected && isDetected(selected.id) && (
                <div>
                  <span className="font-mono text-xs uppercase text-muted-foreground">Related Logs</span>
                  <div className="mt-1 bg-background/50 rounded p-2 max-h-32 overflow-auto">
                    {sim.logs.filter(l => l.includes("CRITICAL") || l.includes("ERROR")).slice(0, 5).map((l, i) => (
                      <p key={i} className="font-mono text-[10px] text-neon-red/80">{l}</p>
                    ))}
                    {sim.logs.filter(l => l.includes("CRITICAL") || l.includes("ERROR")).length === 0 && (
                      <p className="font-mono text-[10px] text-muted-foreground">No related logs yet. Run a simulation to generate data.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </CyberLayout>
  );
};

export default MitreMapping;
