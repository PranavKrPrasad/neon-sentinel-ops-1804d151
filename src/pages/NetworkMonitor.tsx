import { useEffect, useRef, useCallback } from "react";
import CyberLayout from "@/components/layout/CyberLayout";
import { Network, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSimulation } from "@/contexts/SimulationContext";
import { networkEdges } from "@/data/mock-data";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, string> = {
  server: "⬢",
  workstation: "◻",
  firewall: "◆",
  router: "◈",
  attacker: "☠",
};

const statusColors: Record<string, string> = {
  normal: "#00ff9c",
  suspicious: "#ff003c",
  compromised: "#ffb800",
  blocked: "#666666",
};

const NetworkMonitor = () => {
  const sim = useSimulation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const scaleX = w / 800;
    const scaleY = h / 550;

    // Draw edges
    networkEdges.forEach(edge => {
      const src = sim.nodes.find(n => n.id === edge.source);
      const tgt = sim.nodes.find(n => n.id === edge.target);
      if (!src || !tgt) return;
      if (src.status === "blocked" || tgt.status === "blocked") return;

      const sx = src.x * scaleX;
      const sy = src.y * scaleY;
      const tx = tgt.x * scaleX;
      const ty = tgt.y * scaleY;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = edge.suspicious ? "rgba(255, 0, 60, 0.5)" : "rgba(0, 255, 156, 0.15)";
      ctx.lineWidth = edge.suspicious ? 2 : 1;
      ctx.stroke();

      // Animated packet dot
      const progress = ((offsetRef.current / 100) % 1);
      const px = sx + (tx - sx) * progress;
      const py = sy + (ty - sy) * progress;
      ctx.beginPath();
      ctx.arc(px, py, edge.suspicious ? 3 : 2, 0, Math.PI * 2);
      ctx.fillStyle = edge.suspicious ? "#ff003c" : "#00ff9c";
      ctx.fill();
    });

    // Draw nodes
    sim.nodes.forEach(node => {
      const x = node.x * scaleX;
      const y = node.y * scaleY;
      const color = statusColors[node.status];

      // Glow for suspicious/compromised
      if (node.status === "suspicious" || node.status === "compromised") {
        const glow = ctx.createRadialGradient(x, y, 5, x, y, 30);
        glow.addColorStop(0, color + "40");
        glow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = node.status === "blocked" ? "#333" : `${color}20`;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = color;
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(node.label, x, y + 26);
      ctx.fillStyle = "#888";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillText(node.ip, x, y + 38);
    });

    offsetRef.current += 0.5;
    animRef.current = requestAnimationFrame(draw);
  }, [sim.nodes]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <CyberLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neon-blue/10 neon-glow-blue">
            <Network className="w-6 h-6 text-neon-blue" />
          </div>
          <div>
            <h1 className="font-mono text-lg uppercase tracking-widest text-primary text-glow-green">Network Monitoring</h1>
            <p className="font-mono text-xs text-muted-foreground">Topology & traffic analysis — {sim.nodes.length} nodes</p>
          </div>
        </div>

        {/* Topology canvas */}
        <div className="glass-card rounded-lg border border-primary/10 p-4">
          <canvas ref={canvasRef} className="w-full" style={{ height: "450px" }} />
        </div>

        {/* Node list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sim.nodes.map(node => (
            <div
              key={node.id}
              className={cn(
                "glass-card rounded-lg border p-3 flex items-center gap-3 transition-all",
                node.status === "suspicious" && "border-neon-red/40 neon-glow-red",
                node.status === "normal" && "border-primary/10",
                node.status === "blocked" && "border-muted/20 opacity-50",
                node.status === "compromised" && "border-neon-amber/40 neon-glow-amber"
              )}
            >
              <span className="text-2xl">{typeIcons[node.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-bold text-foreground">{node.label}</div>
                <div className="font-mono text-xs text-muted-foreground">{node.ip}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn("font-mono text-[9px] border",
                  node.status === "suspicious" && "bg-neon-red/20 text-neon-red border-neon-red/30 neon-pulse",
                  node.status === "normal" && "bg-primary/20 text-primary border-primary/30",
                  node.status === "blocked" && "bg-muted/20 text-muted-foreground border-muted/30",
                  node.status === "compromised" && "bg-neon-amber/20 text-neon-amber border-neon-amber/30",
                )}>
                  {node.status.toUpperCase()}
                </Badge>
                {(node.status === "suspicious" || node.status === "compromised") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sim.blockIP(node.id)}
                    className="font-mono text-[10px] h-7 border-neon-red/30 text-neon-red hover:bg-neon-red/10"
                  >
                    <Ban className="w-3 h-3 mr-1" /> Block
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CyberLayout>
  );
};

export default NetworkMonitor;
