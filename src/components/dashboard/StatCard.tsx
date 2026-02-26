import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  color?: "green" | "blue" | "purple" | "red" | "amber";
}

const colorMap = {
  green: "border-neon-green/30 hover:border-neon-green/60 text-neon-green neon-glow-green",
  blue: "border-neon-blue/30 hover:border-neon-blue/60 text-neon-blue neon-glow-blue",
  purple: "border-neon-purple/30 hover:border-neon-purple/60 text-neon-purple neon-glow-purple",
  red: "border-neon-red/30 hover:border-neon-red/60 text-neon-red neon-glow-red",
  amber: "border-neon-amber/30 hover:border-neon-amber/60 text-neon-amber neon-glow-amber",
};

const StatCard = ({ icon: Icon, label, value, trend, color = "green" }: StatCardProps) => {
  return (
    <div
      className={cn(
        "glass-card rounded-lg border p-5 transition-all duration-300 hover:scale-[1.02]",
        colorMap[color]
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="w-5 h-5 opacity-70" />
      </div>
      <div className="text-3xl font-mono font-bold">{value}</div>
      {trend && <p className="text-xs font-mono text-muted-foreground mt-1">{trend}</p>}
    </div>
  );
};

export default StatCard;
