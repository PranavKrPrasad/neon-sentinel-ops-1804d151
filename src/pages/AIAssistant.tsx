import { useState, useRef, useEffect, useMemo, memo, useCallback } from "react";
import CyberLayout from "@/components/layout/CyberLayout";
import { Bot, Send, Zap, Map, FileText, Shield, Bug, Network, Search, Trash2, Download, Copy, Cpu, AlertTriangle, BookOpen, Target, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { useSimulation } from "@/contexts/SimulationContext";
import { threatIndicators, mitreTechniques } from "@/data/mock-data";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const MAX_HISTORY = 10; // cap messages sent to model to control tokens & latency

const MODELS = [
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (Fastest)" },
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (Balanced)" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (Deep)" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  { value: "openai/gpt-5", label: "GPT-5 (Powerful)" },
  { value: "openai/gpt-5.2", label: "GPT-5.2 (Reasoning)" },
];

// Memoized message bubble — prevents re-rendering completed messages on every token
const MessageBubble = memo(({ m, onCopy }: { m: Msg; onCopy: (c: string) => void }) => (
  <div className={`flex group ${m.role === "user" ? "justify-end" : "justify-start"}`}>
    <div
      className={`max-w-[85%] rounded-lg px-4 py-3 font-mono text-sm relative ${
        m.role === "user"
          ? "bg-primary/15 border border-primary/30 text-foreground"
          : "bg-muted/50 border border-muted text-foreground"
      }`}
    >
      {m.role === "assistant" ? (
        <div className="prose prose-sm prose-invert max-w-none [&_h2]:text-primary [&_h2]:text-sm [&_h2]:font-mono [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-neon-blue [&_h3]:text-xs [&_h3]:font-mono [&_strong]:text-primary [&_code]:text-neon-amber [&_code]:bg-background/50 [&_code]:px-1 [&_code]:rounded [&_li]:text-foreground [&_p]:text-foreground [&_pre]:bg-background/70 [&_pre]:border [&_pre]:border-primary/20">
          <ReactMarkdown>{m.content}</ReactMarkdown>
        </div>
      ) : (
        <span dangerouslySetInnerHTML={{ __html: highlightKeywords(m.content) }} />
      )}
      <button
        onClick={() => onCopy(m.content)}
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-primary/30 rounded p-1 text-primary hover:bg-primary/10"
        title="Copy message"
      >
        <Copy className="w-3 h-3" />
      </button>
    </div>
  </div>
));
MessageBubble.displayName = "MessageBubble";

// Pick only the context slices relevant to the user's query — saves tokens & latency
function buildSmartContext(query: string, sim: any) {
  const q = query.toLowerCase();
  const ctx: any = {
    timestamp: new Date().toISOString(),
    soc_status: sim.isRunning ? "ACTIVE_INCIDENT" : "MONITORING",
    metrics: {
      total_threats_24h: sim.totalThreats,
      blocked_attacks: sim.blockedAttacks,
      active_alerts: sim.activeAlerts,
      block_rate_pct: ((sim.blockedAttacks / Math.max(1, sim.totalThreats)) * 100).toFixed(1),
      defense_score: sim.defenseScore,
    },
  };
  if (sim.isRunning) ctx.active_simulation = { attack_type: sim.attackType, intensity: sim.intensity };

  const wantsMitre = /mitre|t\d{4}|ttp|tactic|technique|attack/i.test(q);
  const wantsIOC = /ioc|indicator|ip|domain|hash|malicious|threat intel/i.test(q);
  const wantsNetwork = /network|node|topology|lateral|segment|firewall/i.test(q);
  const wantsLogs = /log|recent|event|activity|forensic|hunt/i.test(q);
  const wantsThreat = /threat|attack|incident|explain|analyze|risk/i.test(q);

  if (wantsMitre || wantsThreat) {
    ctx.detected_mitre_techniques = sim.detectedTechniques.slice(0, 12).map((id: string) => {
      const t = mitreTechniques.find((x) => x.id === id);
      return t ? { id: t.id, name: t.name, tactic: t.tactic, severity: t.severity } : { id };
    });
  }
  if (wantsIOC || wantsThreat) {
    ctx.top_threat_indicators = threatIndicators.slice(0, 5).map((t) => ({
      type: t.type, value: t.value, severity: t.severity, source: t.source, status: t.status,
    }));
  }
  if (wantsNetwork) {
    ctx.network_nodes = sim.nodes.map((n: any) => ({ id: n.id, ip: n.ip, type: n.type, status: n.status }));
  }
  if (wantsLogs || sim.isRunning) {
    ctx.recent_logs = sim.logs.slice(0, 6);
  }
  return ctx;
}

const highlightKeywords = (text: string) => {
  return text
    .replace(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g, '<span class="text-neon-red font-bold">$1</span>')
    .replace(/(CVE-\d{4}-\d+)/g, '<span class="text-neon-amber font-bold">$1</span>')
    .replace(/(T\d{4}(?:\.\d+)?)/g, '<span class="text-neon-purple font-bold">$1</span>')
    .replace(/\b(Critical|High|Medium|Low)\b/gi, (m) => {
      const colors: Record<string, string> = { critical: "text-neon-red", high: "text-neon-amber", medium: "text-neon-blue", low: "text-neon-green" };
      return `<span class="${colors[m.toLowerCase()] || ""} font-bold">${m}</span>`;
    });
};

const AIAssistant = () => {
  const sim = useSimulation();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState(MODELS[0].value);
  const [includeContext, setIncludeContext] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const vp = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
      if (vp) vp.scrollTop = vp.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (allMessages: Msg[]) => {
    setIsLoading(true);
    abortRef.current = new AbortController();

    // History trim — only send the last N turns to model (saves tokens & latency)
    const trimmed = allMessages.slice(-MAX_HISTORY);
    const lastUserMsg = [...trimmed].reverse().find(m => m.role === "user")?.content || "";
    const smartCtx = includeContext ? buildSmartContext(lastUserMsg, sim) : null;

    // rAF-batched UI updates: accumulate tokens, flush once per frame (~60fps max)
    let assistantSoFar = "";
    let pending = false;
    let assistantStarted = false;
    const flush = () => {
      pending = false;
      setMessages(prev => {
        if (!assistantStarted) {
          assistantStarted = true;
          return [...prev, { role: "assistant", content: assistantSoFar }];
        }
        const next = prev.slice();
        next[next.length - 1] = { ...next[next.length - 1], content: assistantSoFar };
        return next;
      });
    };
    const schedule = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(flush);
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        signal: abortRef.current.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: trimmed, systemContext: smartCtx, model }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        if (resp.status === 429) toast.error("Rate limited — slow down a bit");
        else if (resp.status === 402) toast.error("AI credits depleted");
        else toast.error(err.error || "Chat error");
        setMessages(prev => [...prev, { role: "assistant", content: `⚠ Error: ${err.error || "Unknown error"}` }]);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              schedule();
            }
          } catch { /* partial json */ }
        }
      }
      // Final flush to ensure last tokens render
      if (pending || assistantSoFar) flush();
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error(e);
        setMessages(prev => [...prev, { role: "assistant", content: "⚠ Connection error. Please try again." }]);
      }
    }
    setIsLoading(false);
    abortRef.current = null;
  };

  const send = useCallback((text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    streamChat([...messages, userMsg]);
  }, [isLoading, messages, model, includeContext, sim]);

  const stopGeneration = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Conversation cleared");
  };

  const exportChat = () => {
    const md = messages.map(m => `## ${m.role === "user" ? "👤 User" : "🤖 AI-IDS Sentinel"}\n\n${m.content}`).join("\n\n---\n\n");
    const blob = new Blob([`# AI-IDS Conversation Export\n_${new Date().toISOString()}_\n\n---\n\n${md}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ai-ids-chat-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported");
  };

  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  }, []);

  const quickActions = [
    { icon: Zap, label: "Explain Active Threat", prompt: "Analyze the most recent active threat in the live system context. Provide full threat summary, confidence score, MITRE mapping, IOCs, and prioritized mitigation steps." },
    { icon: Map, label: "MITRE ATT&CK Map", prompt: "Map all currently detected MITRE ATT&CK techniques from the live system context. For each technique, explain the tactic, sub-techniques, real-world APT groups using it, and detection opportunities." },
    { icon: FileText, label: "Incident Report", prompt: "Generate a formal NIST SP 800-61 incident report based on the live system telemetry. Include: Detection & Analysis, Containment, Eradication, Recovery, Post-Incident Activity, and Lessons Learned." },
    { icon: Shield, label: "Defense Posture", prompt: "Audit the current defensive posture using the live metrics. Score us against NIST CSF (Identify, Protect, Detect, Respond, Recover) and recommend top 5 improvements." },
    { icon: Bug, label: "Threat Hunt", prompt: "Initiate a proactive threat hunt. Generate 5 hypothesis-driven hunt queries (with KQL/SPL/EQL syntax) based on the detected techniques and IOCs in the live system." },
    { icon: Code2, label: "Generate Sigma Rule", prompt: "Generate a production-ready Sigma detection rule for the most critical attack pattern in the current system context. Include full YAML with logsource, detection, condition, and falsepositives." },
    { icon: Network, label: "Network Forensics", prompt: "Perform network forensics analysis on the current network nodes and logs. Identify lateral movement paths, suspicious flows, and recommend network segmentation changes." },
    { icon: Target, label: "Attribute Threat Actor", prompt: "Based on the detected TTPs and IOCs, attribute this activity to known threat actor groups (APT/cybercrime). Compare TTPs against MITRE Groups database." },
    { icon: BookOpen, label: "IR Playbook", prompt: "Generate a step-by-step incident response playbook for the current active attack type. Include roles (IC, scribe, comms), decision trees, and escalation criteria." },
    { icon: AlertTriangle, label: "Risk Assessment", prompt: "Perform a quantitative risk assessment for the current threats. Calculate CVSS v3.1 scores, business impact (financial/operational/reputational), and prioritize by ALE." },
    { icon: Search, label: "IOC Enrichment", prompt: "Enrich the top threat indicators from the live system. For each IP/domain/hash, provide context: ASN, geolocation, known associations, threat feed presence, and recommended action." },
    { icon: Cpu, label: "AI Confidence Audit", prompt: "Audit the AI-IDS detection confidence. Explain how the defense score and detection time are calculated, identify potential false positive/negative risks, and suggest model tuning." },
  ];

  return (
    <CyberLayout>
      <div className="flex flex-col h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="p-2 rounded-lg bg-primary/10 neon-glow-green">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-mono text-lg uppercase tracking-widest text-primary text-glow-green">AI-IDS Sentinel</h1>
            <p className="font-mono text-xs text-muted-foreground">Threat Analysis Terminal · Live SOC Context</p>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-[10px] border-primary/30 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow mr-1.5" />
              {sim.isRunning ? "INCIDENT" : "ONLINE"}
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px] border-neon-purple/30 text-neon-purple">
              {sim.detectedTechniques.length} TTPs
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px] border-neon-amber/30 text-neon-amber">
              {sim.activeAlerts} ALERTS
            </Badge>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[200px] h-8 font-mono text-xs border-primary/30 bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map(m => <SelectItem key={m.value} value={m.value} className="font-mono text-xs">{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant="outline" size="sm"
              className={`font-mono text-xs h-8 ${includeContext ? "border-primary/50 text-primary bg-primary/10" : "border-muted text-muted-foreground"}`}
              onClick={() => setIncludeContext(v => !v)}
              title="Toggle live SOC context injection"
            >
              CTX {includeContext ? "ON" : "OFF"}
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 border-primary/30" onClick={exportChat} disabled={messages.length === 0} title="Export chat as Markdown">
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 border-neon-red/30 text-neon-red hover:bg-neon-red/10" onClick={clearChat} disabled={messages.length === 0} title="Clear conversation">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <ScrollArea className="mb-4 max-h-24">
          <div className="flex gap-2 flex-wrap pb-1">
            {quickActions.map(a => (
              <Button
                key={a.label}
                variant="outline"
                size="sm"
                className="font-mono text-xs border-primary/30 hover:border-primary/60 hover:bg-primary/10 text-primary h-8"
                onClick={() => send(a.prompt)}
                disabled={isLoading}
              >
                <a.icon className="w-3.5 h-3.5 mr-1.5" />
                {a.label}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Chat Area */}
        <div className="flex-1 glass-card rounded-lg border border-primary/10 flex flex-col overflow-hidden min-h-0">
          <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-50 py-12 text-center">
                <Bot className="w-12 h-12 text-primary mb-3 animate-pulse-glow" />
                <p className="font-mono text-sm text-primary mb-1">AI-IDS Sentinel ready</p>
                <p className="font-mono text-xs text-muted-foreground max-w-md">
                  Connected to live SOC telemetry · {sim.detectedTechniques.length} active TTPs · {sim.totalThreats} threats tracked
                </p>
                <p className="font-mono text-xs text-muted-foreground mt-2">Use a quick action above or ask anything about the live system.</p>
              </div>
            )}
            <div className="space-y-4">
              {messages.map((m, i) => (
                <MessageBubble key={i} m={m} onCopy={copyMessage} />
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-muted/50 border border-muted rounded-lg px-4 py-3">
                    <span className="font-mono text-sm text-primary blink-cursor">Analyzing threat data</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-primary/10 flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask the AI-IDS Sentinel... (Shift+Enter for newline)"
              className="flex-1 bg-background/50 border border-primary/20 rounded-md px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 resize-none max-h-32"
              disabled={isLoading}
            />
            {isLoading ? (
              <Button
                size="icon"
                onClick={stopGeneration}
                className="bg-neon-red/20 hover:bg-neon-red/30 border border-neon-red/30 text-neon-red"
                title="Stop generation"
              >
                <span className="w-3 h-3 bg-neon-red" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={() => send(input)}
                disabled={!input.trim()}
                className="bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </CyberLayout>
  );
};

export default AIAssistant;
