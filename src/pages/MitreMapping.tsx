import CyberLayout from "@/components/layout/CyberLayout";
import { Map } from "lucide-react";

const MitreMapping = () => (
  <CyberLayout>
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <Map className="w-16 h-16 text-neon-purple mb-4 opacity-50" />
      <h1 className="font-mono text-2xl uppercase tracking-widest text-primary text-glow-green mb-2">
        MITRE ATT&CK Mapping
      </h1>
      <p className="font-mono text-sm text-muted-foreground">Interactive attack framework matrix — coming soon</p>
    </div>
  </CyberLayout>
);

export default MitreMapping;
