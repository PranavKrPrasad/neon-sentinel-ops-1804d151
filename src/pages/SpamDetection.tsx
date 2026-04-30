import { useState, useEffect, useMemo, useRef } from "react";
import { Mail, Shield, AlertTriangle, CheckCircle2, XCircle, Loader2, Sparkles, Inbox, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CyberLayout from "@/components/layout/CyberLayout";
import { cn } from "@/lib/utils";
import { emailSamples, analyzeHeuristics, EmailSample, HeuristicResult } from "@/data/spam-samples";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIResult {
  verdict?: string;
  category?: string;
  confidence?: number;
  risk_score?: number;
  summary?: string;
  indicators?: { type: string; severity: string; detail: string }[];
  spoofing_signals?: string[];
  social_engineering_tactics?: string[];
  iocs?: { urls?: string[]; domains?: string[]; ips?: string[]; emails?: string[] };
  recommended_actions?: string[];
  mitre_techniques?: string[];
  error?: string;
}

const verdictStyle = (v?: string) => {
  if (v === "MALICIOUS") return "bg-neon-red/15 text-neon-red border-neon-red/40";
  if (v === "SUSPICIOUS") return "bg-neon-amber/15 text-neon-amber border-neon-amber/40";
  if (v === "CLEAN") return "bg-primary/15 text-primary border-primary/40";
  return "bg-muted/30 text-muted-foreground border-muted";
};

const authPill = (status: string) => {
  const ok = status === "pass";
  const warn = status === "softfail" || status === "neutral";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] uppercase border",
      ok && "border-primary/40 text-primary bg-primary/10",
      warn && "border-neon-amber/40 text-neon-amber bg-neon-amber/10",
      !ok && !warn && "border-neon-red/40 text-neon-red bg-neon-red/10",
    )}>
      {ok ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
      {status}
    </span>
  );
};

// Live feed counter for cinematic dashboard feel
const useLiveFeed = () => {
  const [stats, setStats] = useState({ scanned: 14823, blocked: 2147, phishing: 891, bec: 47, spoofed: 312 });
  useEffect(() => {
    const i = setInterval(() => {
      setStats(s => ({
        scanned: s.scanned + Math.floor(Math.random() * 8 + 2),
        blocked: s.blocked + (Math.random() > 0.6 ? 1 : 0),
        phishing: s.phishing + (Math.random() > 0.85 ? 1 : 0),
        bec: s.bec + (Math.random() > 0.95 ? 1 : 0),
        spoofed: s.spoofed + (Math.random() > 0.8 ? 1 : 0),
      }));
    }, 1500);
    return () => clearInterval(i);
  }, []);
  return stats;
};

const SpamDetection = () => {
  const stats = useLiveFeed();
  const [selected, setSelected] = useState<EmailSample>(emailSamples[0]);
  const [customMode, setCustomMode] = useState(false);
  const [custom, setCustom] = useState({ sender: "", subject: "", body: "", headers: "", spf: "fail" as const, dkim: "fail" as const, dmarc: "fail" as const });
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [tab, setTab] = useState("inbox");
  const abortRef = useRef<AbortController | null>(null);

  const activeEmail = customMode
    ? { ...custom, id: "custom", displayName: "Custom Input", verdict: "SUSPICIOUS" as const, category: "spam" as const, receivedAt: "now" }
    : selected;

  // Instant local heuristics — runs every change, no AI cost
  const heuristics: HeuristicResult = useMemo(
    () => analyzeHeuristics(activeEmail),
    [activeEmail],
  );

  const runAIAnalysis = async () => {
    setAnalyzing(true);
    setAiResult(null);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const { data, error } = await supabase.functions.invoke("spam-analyze", {
        body: {
          sender: activeEmail.sender,
          subject: activeEmail.subject,
          body: activeEmail.body,
          headers: activeEmail.headers,
          authResults: { spf: activeEmail.spf, dkim: activeEmail.dkim, dmarc: activeEmail.dmarc },
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setAiResult({ error: data.error });
      } else {
        setAiResult(data as AIResult);
        toast.success("AI analysis complete");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      toast.error(msg);
      setAiResult({ error: msg });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <CyberLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="glass-card border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-mono text-lg font-bold uppercase tracking-widest text-primary text-glow-green">
                Spam & Spoofing Detection
              </h1>
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                AI-powered email security · SPF/DKIM/DMARC · BEC · Homoglyph defense
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-primary uppercase tracking-widest">Live Engine</span>
          </div>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Scanned (24h)", value: stats.scanned.toLocaleString(), color: "text-primary" },
            { label: "Blocked", value: stats.blocked.toLocaleString(), color: "text-neon-red" },
            { label: "Phishing", value: stats.phishing.toLocaleString(), color: "text-neon-amber" },
            { label: "BEC Attempts", value: stats.bec.toLocaleString(), color: "text-neon-purple" },
            { label: "Spoofed Senders", value: stats.spoofed.toLocaleString(), color: "text-neon-blue" },
          ].map(s => (
            <div key={s.label} className="glass-card border border-primary/10 rounded p-3">
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
              <div className={cn("font-mono text-xl font-bold mt-1", s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Inbox / Custom */}
          <div className="lg:col-span-4 glass-card border border-primary/10 rounded-lg overflow-hidden flex flex-col" style={{ minHeight: 600 }}>
            <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full">
              <TabsList className="rounded-none border-b border-primary/10 bg-transparent p-0 h-auto">
                <TabsTrigger value="inbox" className="flex-1 rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-mono text-[10px] uppercase tracking-widest gap-1.5">
                  <Inbox className="w-3.5 h-3.5" />Inbox ({emailSamples.length})
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex-1 rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-mono text-[10px] uppercase tracking-widest gap-1.5" onClick={() => setCustomMode(true)}>
                  <FileText className="w-3.5 h-3.5" />Custom
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inbox" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-[600px]">
                  <div className="divide-y divide-primary/5">
                    {emailSamples.map(em => {
                      const active = !customMode && selected.id === em.id;
                      return (
                        <button
                          key={em.id}
                          onClick={() => { setSelected(em); setCustomMode(false); setAiResult(null); }}
                          className={cn(
                            "w-full text-left p-3 transition-colors hover:bg-primary/5",
                            active && "bg-primary/10 border-l-2 border-l-primary",
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[11px] text-foreground/90 truncate max-w-[60%]">{em.displayName}</span>
                            <span className={cn("font-mono text-[9px] px-1.5 py-0.5 rounded border uppercase", verdictStyle(em.verdict))}>
                              {em.verdict}
                            </span>
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground truncate mb-1">{em.sender}</div>
                          <div className="font-mono text-[11px] text-foreground/70 line-clamp-2">{em.subject}</div>
                          <div className="font-mono text-[9px] text-muted-foreground mt-1">{em.receivedAt}</div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="custom" className="flex-1 m-0 p-3 space-y-2 overflow-auto">
                <Input placeholder="From: sender@domain.com" value={custom.sender}
                  onChange={e => { setCustom({ ...custom, sender: e.target.value }); setCustomMode(true); }}
                  className="font-mono text-xs bg-card/50 border-primary/20" />
                <Input placeholder="Subject" value={custom.subject}
                  onChange={e => { setCustom({ ...custom, subject: e.target.value }); setCustomMode(true); }}
                  className="font-mono text-xs bg-card/50 border-primary/20" />
                <Textarea placeholder="Email body..." value={custom.body} rows={6}
                  onChange={e => { setCustom({ ...custom, body: e.target.value }); setCustomMode(true); }}
                  className="font-mono text-xs bg-card/50 border-primary/20 resize-none" />
                <Textarea placeholder="Raw headers (optional)" value={custom.headers} rows={4}
                  onChange={e => { setCustom({ ...custom, headers: e.target.value }); setCustomMode(true); }}
                  className="font-mono text-xs bg-card/50 border-primary/20 resize-none" />
                <div className="grid grid-cols-3 gap-1">
                  {(["spf", "dkim", "dmarc"] as const).map(k => (
                    <select key={k} value={custom[k]} onChange={e => { setCustom({ ...custom, [k]: e.target.value as any }); setCustomMode(true); }}
                      className="font-mono text-[10px] bg-card/50 border border-primary/20 rounded px-1 py-1.5 uppercase">
                      <option value="pass">{k}: pass</option>
                      <option value="softfail">{k}: softfail</option>
                      <option value="fail">{k}: fail</option>
                      <option value="none">{k}: none</option>
                    </select>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Analysis */}
          <div className="lg:col-span-8 space-y-4">
            {/* Email preview */}
            <div className="glass-card border border-primary/10 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11px] text-muted-foreground uppercase mb-1">From</div>
                  <div className="font-mono text-sm text-foreground/90 break-all">{activeEmail.sender || "(empty)"}</div>
                  <div className="font-mono text-[11px] text-muted-foreground uppercase mt-2 mb-1">Subject</div>
                  <div className="font-mono text-sm text-foreground/90">{activeEmail.subject || "(empty)"}</div>
                </div>
                <div className="flex flex-col gap-1.5 items-end">
                  {authPill(`SPF ${activeEmail.spf}`)}
                  {authPill(`DKIM ${activeEmail.dkim}`)}
                  {authPill(`DMARC ${activeEmail.dmarc}`)}
                </div>
              </div>
              <div className="border-t border-primary/10 pt-3">
                <div className="font-mono text-[11px] text-muted-foreground uppercase mb-1">Body</div>
                <div className="font-mono text-xs text-foreground/80 bg-card/40 rounded p-2 max-h-32 overflow-auto whitespace-pre-wrap">
                  {activeEmail.body || "(empty)"}
                </div>
              </div>
            </div>

            {/* Heuristic risk score */}
            <div className="glass-card border border-primary/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h3 className="font-mono text-xs uppercase tracking-widest text-primary">Heuristic Risk Engine</h3>
                  <span className="font-mono text-[9px] text-muted-foreground">(instant · local)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-2xl font-bold tabular-nums" style={{
                    color: heuristics.score >= 70 ? "hsl(var(--neon-red))" : heuristics.score >= 40 ? "hsl(var(--neon-amber))" : "hsl(var(--primary))",
                  }}>
                    {heuristics.score}
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">/ 100</span>
                </div>
              </div>
              <div className="h-1.5 bg-card rounded-full overflow-hidden mb-3">
                <div className="h-full transition-all duration-500" style={{
                  width: `${heuristics.score}%`,
                  background: heuristics.score >= 70 ? "hsl(var(--neon-red))" : heuristics.score >= 40 ? "hsl(var(--neon-amber))" : "hsl(var(--primary))",
                }} />
              </div>
              <div className="space-y-1.5 max-h-48 overflow-auto">
                {heuristics.signals.length === 0 ? (
                  <div className="font-mono text-xs text-primary flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />No suspicious signals detected
                  </div>
                ) : heuristics.signals.map((s, i) => (
                  <div key={i} className={cn(
                    "flex items-start gap-2 p-2 rounded border-l-2",
                    s.severity === "high" && "border-l-neon-red bg-neon-red/5",
                    s.severity === "medium" && "border-l-neon-amber bg-neon-amber/5",
                    s.severity === "low" && "border-l-muted bg-card/30",
                  )}>
                    <AlertTriangle className={cn("w-3.5 h-3.5 mt-0.5 shrink-0",
                      s.severity === "high" && "text-neon-red",
                      s.severity === "medium" && "text-neon-amber",
                      s.severity === "low" && "text-muted-foreground",
                    )} />
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] font-bold uppercase tracking-wide text-foreground/90">{s.label}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{s.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI deep analysis */}
            <div className="glass-card border border-accent/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <h3 className="font-mono text-xs uppercase tracking-widest text-accent">AI Deep Analysis</h3>
                  <span className="font-mono text-[9px] text-muted-foreground">(Gemini · MITRE-aware)</span>
                </div>
                <Button onClick={runAIAnalysis} disabled={analyzing} size="sm"
                  className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 font-mono text-[10px] uppercase tracking-wider gap-1.5">
                  {analyzing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing</> : <><Send className="w-3.5 h-3.5" />Run AI Analysis</>}
                </Button>
              </div>

              {!aiResult && !analyzing && (
                <div className="font-mono text-xs text-muted-foreground italic py-6 text-center border border-dashed border-accent/20 rounded">
                  Click "Run AI Analysis" for deep contextual threat classification
                </div>
              )}

              {aiResult?.error && (
                <div className="font-mono text-xs text-neon-red bg-neon-red/10 border border-neon-red/30 rounded p-3">
                  Error: {aiResult.error}
                </div>
              )}

              {aiResult && !aiResult.error && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("font-mono text-[11px] px-2 py-1 rounded border uppercase font-bold", verdictStyle(aiResult.verdict))}>
                      {aiResult.verdict}
                    </span>
                    {aiResult.category && (
                      <Badge variant="outline" className="font-mono text-[10px] uppercase border-accent/40 text-accent">
                        {aiResult.category}
                      </Badge>
                    )}
                    {typeof aiResult.confidence === "number" && (
                      <span className="font-mono text-[10px] text-muted-foreground">Confidence: <span className="text-foreground">{aiResult.confidence}%</span></span>
                    )}
                    {typeof aiResult.risk_score === "number" && (
                      <span className="font-mono text-[10px] text-muted-foreground">Risk: <span className="text-neon-red">{aiResult.risk_score}/100</span></span>
                    )}
                  </div>

                  {aiResult.summary && (
                    <div className="font-mono text-xs text-foreground/90 bg-card/40 border-l-2 border-accent/50 p-2 rounded-r">
                      {aiResult.summary}
                    </div>
                  )}

                  {aiResult.indicators && aiResult.indicators.length > 0 && (
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Indicators</div>
                      <div className="space-y-1">
                        {aiResult.indicators.map((ind, i) => (
                          <div key={i} className="font-mono text-[11px] text-foreground/80 flex items-start gap-2">
                            <span className={cn("uppercase text-[9px] px-1 rounded shrink-0 mt-0.5",
                              ind.severity === "high" && "bg-neon-red/20 text-neon-red",
                              ind.severity === "medium" && "bg-neon-amber/20 text-neon-amber",
                              ind.severity === "low" && "bg-muted/40 text-muted-foreground",
                            )}>{ind.type}</span>
                            <span>{ind.detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiResult.spoofing_signals && aiResult.spoofing_signals.length > 0 && (
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Spoofing Signals</div>
                      <div className="flex flex-wrap gap-1">
                        {aiResult.spoofing_signals.map((s, i) => (
                          <span key={i} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neon-red/10 text-neon-red border border-neon-red/30">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiResult.social_engineering_tactics && aiResult.social_engineering_tactics.length > 0 && (
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Social Engineering Tactics</div>
                      <div className="flex flex-wrap gap-1">
                        {aiResult.social_engineering_tactics.map((s, i) => (
                          <span key={i} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neon-amber/10 text-neon-amber border border-neon-amber/30 uppercase">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiResult.mitre_techniques && aiResult.mitre_techniques.length > 0 && (
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">MITRE ATT&CK</div>
                      <div className="flex flex-wrap gap-1">
                        {aiResult.mitre_techniques.map((t, i) => (
                          <span key={i} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/40">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiResult.recommended_actions && aiResult.recommended_actions.length > 0 && (
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Recommended Actions</div>
                      <ol className="space-y-1 list-decimal list-inside">
                        {aiResult.recommended_actions.map((a, i) => (
                          <li key={i} className="font-mono text-[11px] text-foreground/80">{a}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CyberLayout>
  );
};

export default SpamDetection;
