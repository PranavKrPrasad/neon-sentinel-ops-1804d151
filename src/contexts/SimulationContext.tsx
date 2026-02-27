import { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from "react";
import { generateLogEntry, networkNodes, NetworkNode } from "@/data/mock-data";

interface SimulationState {
  isRunning: boolean;
  attackType: string;
  intensity: number;
  logs: string[];
  detectionTime: number | null;
  defenseScore: number | null;
  totalThreats: number;
  blockedAttacks: number;
  activeAlerts: number;
  detectedTechniques: string[];
  nodes: NetworkNode[];
  demoMode: boolean;
}

interface SimulationContextType extends SimulationState {
  startSimulation: (type: string, intensity: number) => void;
  stopSimulation: () => void;
  blockIP: (nodeId: string) => void;
  toggleDemoMode: () => void;
  addLog: (log: string) => void;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

export const useSimulation = () => {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be inside SimulationProvider");
  return ctx;
};

const MITRE_MAP: Record<string, string[]> = {
  ddos: ["T1498", "T1046"],
  sqli: ["T1190", "T1059"],
  phishing: ["T1566", "T1204"],
  ransomware: ["T1486", "T1005", "T1547"],
  bruteforce: ["T1110", "T1021"],
  c2: ["T1071", "T1041", "T1070"],
};

export const SimulationProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<SimulationState>({
    isRunning: false,
    attackType: "ddos",
    intensity: 50,
    logs: [],
    detectionTime: null,
    defenseScore: null,
    totalThreats: 1247,
    blockedAttacks: 1183,
    activeAlerts: 23,
    detectedTechniques: ["T1190", "T1566", "T1059", "T1547", "T1548", "T1070", "T1003", "T1110", "T1046", "T1021", "T1071", "T1041"],
    nodes: [...networkNodes],
    demoMode: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const addLog = useCallback((log: string) => {
    setState(prev => ({ ...prev, logs: [log, ...prev.logs].slice(0, 200) }));
  }, []);

  const startSimulation = useCallback((type: string, intensity: number) => {
    startTimeRef.current = Date.now();
    const newTechniques = MITRE_MAP[type] || [];

    setState(prev => ({
      ...prev,
      isRunning: true,
      attackType: type,
      intensity,
      detectionTime: null,
      defenseScore: null,
      detectedTechniques: [...new Set([...prev.detectedTechniques, ...newTechniques])],
      nodes: prev.nodes.map(n => n.type === "attacker" ? { ...n, status: "suspicious" as const } : n),
    }));

    // Generate logs at rate proportional to intensity
    const rate = Math.max(200, 2000 - intensity * 18);
    intervalRef.current = setInterval(() => {
      const log = generateLogEntry(type);
      addLog(log);

      setState(prev => {
        const isCritical = log.includes("CRITICAL") || log.includes("ERROR");
        return {
          ...prev,
          totalThreats: prev.totalThreats + (isCritical ? 1 : 0),
          blockedAttacks: prev.blockedAttacks + (isCritical && Math.random() > 0.15 ? 1 : 0),
          activeAlerts: prev.activeAlerts + (isCritical ? 1 : 0),
        };
      });
    }, rate);

    // Simulate detection after a delay
    const detectionDelay = Math.max(1500, 5000 - intensity * 30);
    setTimeout(() => {
      const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
      const score = Math.max(60, Math.min(99, 95 - intensity * 0.2 + Math.random() * 10));
      setState(prev => ({
        ...prev,
        detectionTime: parseFloat(elapsed),
        defenseScore: Math.round(score),
      }));
      addLog(`[${new Date().toISOString()}] [CRITICAL] ⚠ INTRUSION DETECTED — Attack type: ${type.toUpperCase()} | Detection time: ${elapsed}s | Defense score: ${Math.round(score)}%`);
    }, detectionDelay);
  }, [addLog]);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setState(prev => ({
      ...prev,
      isRunning: false,
      nodes: prev.nodes.map(n => n.status === "suspicious" ? { ...n, status: "normal" as const } : n),
    }));
    addLog(`[${new Date().toISOString()}] [INFO] Simulation stopped. System returning to normal state.`);
  }, [addLog]);

  const blockIP = useCallback((nodeId: string) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, status: "blocked" as const } : n),
      blockedAttacks: prev.blockedAttacks + 1,
    }));
    addLog(`[${new Date().toISOString()}] [INFO] IP blocked: node ${nodeId} removed from network.`);
  }, [addLog]);

  const toggleDemoMode = useCallback(() => {
    setState(prev => ({ ...prev, demoMode: !prev.demoMode }));
  }, []);

  // Demo mode auto-attack
  useEffect(() => {
    if (state.demoMode) {
      const types = ["ddos", "sqli", "phishing", "ransomware", "bruteforce", "c2"];
      const runDemo = () => {
        const type = types[Math.floor(Math.random() * types.length)];
        const intensity = Math.floor(Math.random() * 60) + 30;
        startSimulation(type, intensity);
        // Auto-stop after 15 seconds
        setTimeout(() => stopSimulation(), 15000);
      };
      runDemo();
      demoRef.current = setInterval(runDemo, 60000);
      return () => {
        if (demoRef.current) clearInterval(demoRef.current);
      };
    } else {
      if (demoRef.current) clearInterval(demoRef.current);
    }
  }, [state.demoMode, startSimulation, stopSimulation]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (demoRef.current) clearInterval(demoRef.current);
    };
  }, []);

  return (
    <SimulationContext.Provider value={{ ...state, startSimulation, stopSimulation, blockIP, toggleDemoMode, addLog }}>
      {children}
    </SimulationContext.Provider>
  );
};
