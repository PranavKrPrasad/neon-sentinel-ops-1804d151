import { useState, useEffect, useMemo, useRef } from "react";
import { Brain, Mail, Activity, Target, Loader2, CheckCircle2, XCircle, Play, Pause, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import CyberLayout from "@/components/layout/CyberLayout";
import { cn } from "@/lib/utils";
import { emailSamples } from "@/data/spam-samples";
import { generateLogEntry } from "@/data/mock-data";
import { useSimulation } from "@/contexts/SimulationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrainResult {
  id: string;
  kind: "email" | "attack";
  input: string;
  expected: string;
  predicted: string;
  confidence: number;
  reasoning: string;
  correct: boolean;
  timestamp: number;
}

const EMAIL_LABELS = ["phishing", "spam", "bec", "spoofing", "malware", "clean"];
const ATTACK_LABELS = ["ddos", "sqli", "phishing", "ransomware", "bruteforce", "c2", "benign"];

const ATTACK_SAMPLES_BY_TYPE: Record<string, string> = {
  ddos: "ddos", sqli: "sqli", phishing: "phishing", ransomware: "ransomware",
  bruteforce: "bruteforce", c2: "c2",
};

const Training = () => {
  const sim = useSimulation();
  const [results, setResults] = useState<TrainResult[]>([]);
  const [emailIdx, setEmailIdx] = useState(0);
  const [attackBatch, setAttackBatch] = useState(0);
  const [training, setTraining] = useState(false);
  const [autoTrain, setAutoTrain] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ----- Metrics derived from results -----
  const metrics = useMemo(() => {
    const total = results.length;
    const correct = results.filter(r => r.correct).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const avgConf = total > 0 ? results.reduce((s, r) => s + r.confidence, 0) / total : 0;
    const emailCount = results.filter(r => r.kind === "email").length;
    const attackCount = results.filter(r => r.kind === "attack").length;
    return { total, correct, accuracy, avgConf, emailCount, attackCount, loss: Math.max(0, 100 - accuracy) / 100 };
  }, [results]);

  // Training curve (epoch = every 3 samples)
  const curve = useMemo(() => {
    const points: { epoch: number; accuracy: number; loss: number }[] = [];
    const step = 3;
    for (let i = step; i <= results.length; i += step) {
      const slice = results.slice(0, i);
      const acc = (slice.filter(r => r.correct).length / slice.length) * 100;
      points.push({ epoch: Math.floor(i / step), accuracy: parseFloat(acc.toFixed(1)), loss: parseFloat(((100 - acc) / 100).toFixed(3)) });
    }
    return points;
  }, [results]);

  // Confusion matrix per label (predicted vs actual)
  const confusion = useMemo(() => {
    const map = new Map<string, { tp: number; fp: number; fn: number; total: number }>();
    for (const r of results) {
      if (!map.has(r.expected)) map.set(r.expected, { tp: 0, fp: 0, fn: 0, total: 0 });
      if (!map.has(r.predicted)) map.set(r.predicted, { tp: 0, fp: 0, fn: 0, total: 0 });
      const exp = map.get(r.expected)!;
      const pred = map.get(r.predicted)!;
      exp.total += 1;
      if (r.correct) exp.tp += 1;
      else { exp.fn += 1; pred.fp += 1; }
    }
    return Array.from(map.entries()).map(([label, v]) => ({
      label,
      ...v,
      precision: v.tp + v.fp > 0 ? (v.tp / (v.tp + v.fp)) * 100 : 0,
      recall: v.tp + v.fn > 0 ? (v.tp / (v.tp + v.fn)) * 100 : 0,
    })).sort((a, b) => b.total - a.total);
  }, [results]);

  // ----- Train one email sample -----
  const trainEmail = async (idx?: number) => {
    const sample = emailSamples[idx ?? emailIdx % emailSamples.length];
    setTraining(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-train", {
        body: {
          kind: "email",
          sample: { sender: sample.sender, subject: sample.subject, body: sample.body, spf: sample.spf, dkim: sample.dkim, dmarc: sample.dmarc },
          expected: sample.category,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setResults(prev => [{
        id: `e-${Date.now()}`, kind: "email" as const,
        input: `${sample.displayName} — "${sample.subject.slice(0, 40)}"`,
        expected: sample.category as string, predicted: data.label,
        confidence: data.confidence ?? 0, reasoning: data.reasoning ?? "",
        correct: !!data.correct, timestamp: Date.now(),
      }, ...prev].slice(0, 100));
      setEmailIdx(i => i + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Training failed");
    } finally {
      setTraining(false);
    }
  };

  // ----- Train one attack log sample -----
  const trainAttack = async () => {
    const types = Object.keys(ATTACK_SAMPLES_BY_TYPE);
    const expected = types[attackBatch % types.length];
    const log = generateLogEntry(expected);
    setTraining(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-train", {
        body: { kind: "attack", sample: { log }, expected },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setResults(prev => [{
        id: `a-${Date.now()}`, kind: "attack" as const,
        input: log.slice(0, 80) + "...",
        expected, predicted: data.label,
        confidence: data.confidence ?? 0, reasoning: data.reasoning ?? "",
        correct: !!data.correct, timestamp: Date.now(),
      }, ...prev].slice(0, 100));
      setAttackBatch(i => i + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Training failed");
    } finally {
      setTraining(false);
    }
  };

  // Auto-train: alternate email/attack every 4s
  useEffect(() => {
    if (autoTrain) {
      let toggle = false;
      autoRef.current = setInterval(() => {
        if (training) return;
        toggle ? trainEmail() : trainAttack();
        toggle = !toggle;
      }, 4000);
      return () => { if (autoRef.current) clearInterval(autoRef.current); };
    }
  }, [autoTrain, training]); // eslint-disable-line

  // When live simulation is running, auto-feed attack samples into training
  useEffect(() => {
    if (sim.isRunning && autoTrain) {
      const i = setInterval(() => { if (!training) trainAttack(); }, 5000);
      return () => clearInterval(i);
    }
  }, [sim.isRunning, autoTrain, training]); // eslint-disable-line

  const reset = () => { setResults([]); setEmailIdx(0); setAttackBatch(0); toast.success("Model reset"); };

  return (
    <CyberLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="glass-card border border-primary/20 rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-primary animate-pulse" />
            <div>
              <h1 className="font-mono text-lg font-bold uppercase tracking-widest text-primary text-glow-green">
                AI Training Lab
              </h1>
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                Live adaptive training · Email + Attack patterns · Real Lovable AI classification
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAutoTrain(a => !a)} size="sm" variant={autoTrain ? "default" : "outline"}
              className={cn("font-mono text-[10px] uppercase gap-1.5", autoTrain && "bg-primary/20 text-primary border-primary/40")}>
              {autoTrain ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {autoTrain ? "Pause Auto" : "Auto Train"}
            </Button>
            <Button onClick={reset} size="sm" variant="outline" className="font-mono text-[10px] uppercase border-neon-red/40 text-neon-red hover:bg-neon-red/10">
              Reset
            </Button>
          </div>
        </div>

        {/* Live metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Samples Trained", value: metrics.total.toString(), color: "text-primary", icon: Target },
            { label: "Accuracy", value: `${metrics.accuracy.toFixed(1)}%`, color: metrics.accuracy >= 80 ? "text-primary" : metrics.accuracy >= 60 ? "text-neon-amber" : "text-neon-red", icon: TrendingUp },
            { label: "Loss", value: metrics.loss.toFixed(3), color: "text-neon-amber", icon: Activity },
            { label: "Avg Confidence", value: `${metrics.avgConf.toFixed(1)}%`, color: "text-neon-blue", icon: Zap },
            { label: "Epochs", value: Math.floor(metrics.total / 3).toString(), color: "text-neon-purple", icon: Brain },
          ].map(s => (
            <div key={s.label} className="glass-card border border-primary/10 rounded p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className="w-3 h-3 text-muted-foreground" />
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
              </div>
              <div className={cn("font-mono text-xl font-bold tabular-nums", s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="glass-card border border-primary/10 bg-transparent">
            <TabsTrigger value="email" className="font-mono text-[10px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Mail className="w-3.5 h-3.5" />Email Training
            </TabsTrigger>
            <TabsTrigger value="attack" className="font-mono text-[10px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Activity className="w-3.5 h-3.5" />Attack Patterns
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="font-mono text-[10px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <TrendingUp className="w-3.5 h-3.5" />Adaptive Dashboard
            </TabsTrigger>
          </TabsList>

          {/* ----- EMAIL TAB ----- */}
          <TabsContent value="email" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card border border-primary/10 rounded-lg p-4">
                <h3 className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Labeled Email Dataset</h3>
                <div className="space-y-2 max-h-[480px] overflow-auto">
                  {emailSamples.map((em, i) => (
                    <div key={em.id} className={cn("border border-primary/10 rounded p-2 flex items-center justify-between gap-2",
                      i === emailIdx % emailSamples.length && "border-primary/40 bg-primary/5")}>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[10px] text-foreground/80 truncate">{em.displayName}</div>
                        <div className="font-mono text-[9px] text-muted-foreground truncate">{em.subject}</div>
                      </div>
                      <Badge variant="outline" className="font-mono text-[9px] uppercase border-accent/40 text-accent shrink-0">
                        {em.category}
                      </Badge>
                      <Button size="sm" disabled={training} onClick={() => trainEmail(i)}
                        className="h-6 px-2 font-mono text-[9px] uppercase bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30">
                        Train
                      </Button>
                    </div>
                  ))}
                </div>
                <Button onClick={() => trainEmail()} disabled={training} className="w-full mt-3 font-mono text-[10px] uppercase bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 gap-2">
                  {training ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Train Next Email
                </Button>
              </div>

              <div className="glass-card border border-primary/10 rounded-lg p-4">
                <h3 className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Recent Email Predictions</h3>
                <ScrollArea className="h-[510px]">
                  <div className="space-y-2">
                    {results.filter(r => r.kind === "email").length === 0 && (
                      <div className="font-mono text-xs text-muted-foreground italic text-center py-8">No predictions yet — click Train</div>
                    )}
                    {results.filter(r => r.kind === "email").map(r => <ResultCard key={r.id} r={r} />)}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* ----- ATTACK TAB ----- */}
          <TabsContent value="attack" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card border border-primary/10 rounded-lg p-4">
                <h3 className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Live Attack Pattern Stream</h3>
                <div className="space-y-2">
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {sim.isRunning
                      ? <>🔴 Live simulation: <span className="text-neon-red">{sim.attackType.toUpperCase()}</span> — feeding into training</>
                      : "Generates synthetic logs cycling through attack types. Start a simulation to feed real-time attacks."}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ATTACK_LABELS.map(l => (
                      <div key={l} className="border border-primary/10 rounded p-2 flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase text-foreground/80">{l}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {results.filter(r => r.kind === "attack" && r.expected === l).length}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button onClick={trainAttack} disabled={training} className="w-full font-mono text-[10px] uppercase bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 gap-2">
                    {training ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Train Next Attack Sample
                  </Button>
                </div>
              </div>

              <div className="glass-card border border-primary/10 rounded-lg p-4">
                <h3 className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Recent Attack Predictions</h3>
                <ScrollArea className="h-[420px]">
                  <div className="space-y-2">
                    {results.filter(r => r.kind === "attack").length === 0 && (
                      <div className="font-mono text-xs text-muted-foreground italic text-center py-8">No predictions yet</div>
                    )}
                    {results.filter(r => r.kind === "attack").map(r => <ResultCard key={r.id} r={r} />)}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* ----- DASHBOARD TAB ----- */}
          <TabsContent value="dashboard" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Training curve */}
              <div className="glass-card border border-primary/10 rounded-lg p-4">
                <h3 className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Learning Curve (Accuracy vs Epoch)</h3>
                <div className="h-64">
                  {curve.length === 0 ? (
                    <div className="h-full flex items-center justify-center font-mono text-xs text-muted-foreground italic">
                      Train at least 3 samples to see the curve
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={curve}>
                        <CartesianGrid stroke="hsl(160 100% 50% / 0.05)" />
                        <XAxis dataKey="epoch" stroke="hsl(220 10% 35%)" fontSize={10} fontFamily="JetBrains Mono" />
                        <YAxis stroke="hsl(220 10% 35%)" fontSize={10} fontFamily="JetBrains Mono" />
                        <Tooltip contentStyle={{ background: "hsl(220 30% 8% / 0.95)", border: "1px solid hsl(160 100% 50% / 0.2)", fontFamily: "JetBrains Mono", fontSize: "11px" }} />
                        <Line type="monotone" dataKey="accuracy" stroke="hsl(160 100% 50%)" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="loss" stroke="hsl(348 100% 50%)" strokeWidth={2} dot={{ r: 2 }} yAxisId={0} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Per-label metrics */}
              <div className="glass-card border border-primary/10 rounded-lg p-4">
                <h3 className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Per-Label Performance</h3>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {confusion.length === 0 ? (
                    <div className="font-mono text-xs text-muted-foreground italic text-center py-6">No data yet</div>
                  ) : confusion.map(c => (
                    <div key={c.label} className="border border-primary/10 rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-[11px] uppercase text-foreground/90">{c.label}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">n={c.total}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div>
                          <div className="text-muted-foreground">Precision</div>
                          <div className="h-1 bg-card rounded-full overflow-hidden mt-0.5">
                            <div className="h-full bg-primary" style={{ width: `${c.precision}%` }} />
                          </div>
                          <div className="text-primary mt-0.5">{c.precision.toFixed(0)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Recall</div>
                          <div className="h-1 bg-card rounded-full overflow-hidden mt-0.5">
                            <div className="h-full bg-neon-blue" style={{ width: `${c.recall}%` }} />
                          </div>
                          <div className="text-neon-blue mt-0.5">{c.recall.toFixed(0)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Combined recent feed */}
            <div className="glass-card border border-primary/10 rounded-lg p-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Unified Training Feed</h3>
              <ScrollArea className="h-64">
                <div className="space-y-1.5">
                  {results.length === 0 ? (
                    <div className="font-mono text-xs text-muted-foreground italic text-center py-6">No training activity</div>
                  ) : results.map(r => (
                    <div key={r.id} className="flex items-center gap-2 font-mono text-[10px] border-b border-primary/5 pb-1.5">
                      {r.correct
                        ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                        : <XCircle className="w-3 h-3 text-neon-red shrink-0" />}
                      <span className={cn("uppercase shrink-0", r.kind === "email" ? "text-neon-blue" : "text-neon-purple")}>{r.kind}</span>
                      <span className="text-foreground/70 truncate flex-1">{r.input}</span>
                      <span className="text-muted-foreground shrink-0">exp:<span className="text-primary">{r.expected}</span></span>
                      <span className="text-muted-foreground shrink-0">pred:<span className={r.correct ? "text-primary" : "text-neon-red"}>{r.predicted}</span></span>
                      <span className="text-muted-foreground shrink-0">{r.confidence}%</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CyberLayout>
  );
};

const ResultCard = ({ r }: { r: TrainResult }) => (
  <div className={cn("border rounded p-2", r.correct ? "border-primary/30 bg-primary/5" : "border-neon-red/30 bg-neon-red/5")}>
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-1.5">
        {r.correct ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <XCircle className="w-3 h-3 text-neon-red" />}
        <span className="font-mono text-[10px] uppercase text-muted-foreground">
          exp: <span className="text-primary">{r.expected}</span> · pred: <span className={r.correct ? "text-primary" : "text-neon-red"}>{r.predicted}</span>
        </span>
      </div>
      <span className="font-mono text-[10px] text-neon-amber">{r.confidence}%</span>
    </div>
    <div className="font-mono text-[10px] text-foreground/70 truncate">{r.input}</div>
    {r.reasoning && <div className="font-mono text-[9px] text-muted-foreground italic mt-0.5">→ {r.reasoning}</div>}
  </div>
);

export default Training;
