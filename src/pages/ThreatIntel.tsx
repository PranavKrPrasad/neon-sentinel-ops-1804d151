import { useState, useMemo } from "react";
import CyberLayout from "@/components/layout/CyberLayout";
import { Search, FileDown, Shield, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { threatIndicators, ThreatIndicator } from "@/data/mock-data";
import { useSimulation } from "@/contexts/SimulationContext";
import { cn } from "@/lib/utils";

const severityColors: Record<string, string> = {
  critical: "bg-neon-red/20 text-neon-red border-neon-red/30",
  high: "bg-neon-amber/20 text-neon-amber border-neon-amber/30",
  medium: "bg-neon-blue/20 text-neon-blue border-neon-blue/30",
  low: "bg-primary/20 text-primary border-primary/30",
};

const statusIcons: Record<string, typeof Shield> = {
  active: ShieldAlert,
  resolved: ShieldCheck,
  investigating: AlertTriangle,
};

const ThreatIntel = () => {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const sim = useSimulation();

  const filtered = useMemo(() => {
    return threatIndicators.filter(t => {
      const matchesSearch = !search || t.value.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
      const matchesSeverity = severityFilter === "all" || t.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [search, severityFilter]);

  // Check if any threat IPs are being used in active simulation
  const isKnownMalicious = (indicator: ThreatIndicator) => {
    return sim.isRunning && indicator.type === "IP" && sim.logs.some(l => l.includes(indicator.value));
  };

  return (
    <CyberLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neon-red/10 neon-glow-red">
            <Search className="w-6 h-6 text-neon-red" />
          </div>
          <div>
            <h1 className="font-mono text-lg uppercase tracking-widest text-primary text-glow-green">Threat Intelligence</h1>
            <p className="font-mono text-xs text-muted-foreground">Threat indicator database & IOC management</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search indicators..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 font-mono text-sm bg-background/50 border-primary/20"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[160px] font-mono text-sm bg-background/50 border-primary/20">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-mono text-sm">All Severities</SelectItem>
              <SelectItem value="critical" className="font-mono text-sm">Critical</SelectItem>
              <SelectItem value="high" className="font-mono text-sm">High</SelectItem>
              <SelectItem value="medium" className="font-mono text-sm">Medium</SelectItem>
              <SelectItem value="low" className="font-mono text-sm">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="font-mono text-xs border-primary/30 text-primary hover:bg-primary/10">
            <FileDown className="w-4 h-4 mr-1.5" /> Import IOC
          </Button>
        </div>

        {/* Table */}
        <div className="glass-card rounded-lg border border-primary/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/10 hover:bg-transparent">
                <TableHead className="font-mono text-xs uppercase text-primary">ID</TableHead>
                <TableHead className="font-mono text-xs uppercase text-primary">Type</TableHead>
                <TableHead className="font-mono text-xs uppercase text-primary">Value</TableHead>
                <TableHead className="font-mono text-xs uppercase text-primary">Severity</TableHead>
                <TableHead className="font-mono text-xs uppercase text-primary">Source</TableHead>
                <TableHead className="font-mono text-xs uppercase text-primary">Status</TableHead>
                <TableHead className="font-mono text-xs uppercase text-primary">Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => {
                const StatusIcon = statusIcons[t.status] || Shield;
                const malicious = isKnownMalicious(t);
                return (
                  <TableRow key={t.id} className={cn("border-primary/5 hover:bg-primary/5", malicious && "bg-neon-red/5")}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px] border-primary/20">{t.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {t.value}
                      {malicious && (
                        <Badge className="ml-2 font-mono text-[9px] bg-neon-red/20 text-neon-red border border-neon-red/30 neon-pulse">
                          Known Malicious
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-mono text-[10px] border", severityColors[t.severity])}>
                        {t.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.source}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <StatusIcon className={cn("w-3.5 h-3.5",
                          t.status === "active" && "text-neon-red",
                          t.status === "resolved" && "text-primary",
                          t.status === "investigating" && "text-neon-amber"
                        )} />
                        <span className="font-mono text-xs capitalize">{t.status}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.lastSeen}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </CyberLayout>
  );
};

export default ThreatIntel;
