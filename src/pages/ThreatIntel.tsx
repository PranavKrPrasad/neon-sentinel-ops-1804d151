import CyberLayout from "@/components/layout/CyberLayout";
import { Search } from "lucide-react";

const ThreatIntel = () => (
  <CyberLayout>
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <Search className="w-16 h-16 text-neon-red mb-4 opacity-50" />
      <h1 className="font-mono text-2xl uppercase tracking-widest text-primary text-glow-green mb-2">
        Threat Intelligence
      </h1>
      <p className="font-mono text-sm text-muted-foreground">Threat indicator database — coming soon</p>
    </div>
  </CyberLayout>
);

export default ThreatIntel;
