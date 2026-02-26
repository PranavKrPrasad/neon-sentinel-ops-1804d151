import CyberLayout from "@/components/layout/CyberLayout";
import { Network } from "lucide-react";

const NetworkMonitor = () => (
  <CyberLayout>
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <Network className="w-16 h-16 text-neon-blue mb-4 opacity-50" />
      <h1 className="font-mono text-2xl uppercase tracking-widest text-primary text-glow-green mb-2">
        Network Monitoring
      </h1>
      <p className="font-mono text-sm text-muted-foreground">Network topology & traffic monitoring — coming soon</p>
    </div>
  </CyberLayout>
);

export default NetworkMonitor;
