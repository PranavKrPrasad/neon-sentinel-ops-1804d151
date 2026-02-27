import { useState, useRef, useEffect } from "react";
import CyberLayout from "@/components/layout/CyberLayout";
import { Bot, Send, Zap, Map, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

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
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const streamChat = async (allMessages: Msg[]) => {
    setIsLoading(true);
    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
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
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { /* partial json */ }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "assistant", content: "⚠ Connection error. Please try again." }]);
    }
    setIsLoading(false);
  };

  const send = (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    streamChat(updated);
  };

  const quickActions = [
    { icon: Zap, label: "Explain Attack", prompt: "Explain the most recent attack detected by the IDS. Include threat summary, confidence score, severity, MITRE ATT&CK mapping, and mitigation steps." },
    { icon: Map, label: "MITRE Mapping", prompt: "Show the MITRE ATT&CK mapping for all currently detected techniques in the system. Explain each technique and its relationship to recent threats." },
    { icon: FileText, label: "Incident Report", prompt: "Generate a formal incident report for the current security situation. Include timeline, affected systems, threat analysis, and recommended actions." },
  ];

  return (
    <CyberLayout>
      <div className="flex flex-col h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 neon-glow-green">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-mono text-lg uppercase tracking-widest text-primary text-glow-green">AI Assistant</h1>
            <p className="font-mono text-xs text-muted-foreground">Threat Analysis Terminal</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="font-mono text-xs text-primary">ONLINE</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {quickActions.map(a => (
            <Button
              key={a.label}
              variant="outline"
              size="sm"
              className="font-mono text-xs border-primary/30 hover:border-primary/60 hover:bg-primary/10 text-primary"
              onClick={() => send(a.prompt)}
              disabled={isLoading}
            >
              <a.icon className="w-3.5 h-3.5 mr-1.5" />
              {a.label}
            </Button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-card rounded-lg border border-primary/10 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-40 py-20">
                <Bot className="w-12 h-12 text-primary mb-3" />
                <p className="font-mono text-sm text-muted-foreground">AI-IDS ready. Ask a question or use quick actions.</p>
              </div>
            )}
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 font-mono text-sm ${
                      m.role === "user"
                        ? "bg-primary/15 border border-primary/30 text-foreground"
                        : "bg-muted/50 border border-muted text-foreground"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&_h2]:text-primary [&_h2]:text-sm [&_h2]:font-mono [&_h2]:mt-3 [&_h2]:mb-1 [&_strong]:text-primary [&_code]:text-neon-amber [&_li]:text-foreground [&_p]:text-foreground">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: highlightKeywords(m.content) }} />
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-muted/50 border border-muted rounded-lg px-4 py-3">
                    <span className="font-mono text-sm text-primary blink-cursor">Analyzing</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-primary/10 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send(input)}
              placeholder="Ask the AI assistant..."
              className="flex-1 bg-background/50 border border-primary/20 rounded-md px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={() => send(input)}
              disabled={isLoading || !input.trim()}
              className="bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </CyberLayout>
  );
};

export default AIAssistant;
