import CyberLayout from "@/components/layout/CyberLayout";
import { Monitor } from "lucide-react";

const SOCMode = () => (
  <CyberLayout>
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <Monitor className="w-16 h-16 text-neon-blue mb-4 opacity-50" />
      <h1 className="font-mono text-2xl uppercase tracking-widest text-primary text-glow-green mb-2">
        SOC Full-Screen Mode
      </h1>
      <p className="font-mono text-sm text-muted-foreground">Immersive SOC command center — coming soon</p>
    </div>
  </CyberLayout>
);

export default SOCMode;
