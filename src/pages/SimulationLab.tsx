import CyberLayout from "@/components/layout/CyberLayout";
import { FlaskConical } from "lucide-react";

const SimulationLab = () => (
  <CyberLayout>
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <FlaskConical className="w-16 h-16 text-neon-purple mb-4 opacity-50" />
      <h1 className="font-mono text-2xl uppercase tracking-widest text-primary text-glow-green mb-2">
        Simulation Lab
      </h1>
      <p className="font-mono text-sm text-muted-foreground">Attack simulation module — coming soon</p>
    </div>
  </CyberLayout>
);

export default SimulationLab;
