import CyberLayout from "@/components/layout/CyberLayout";
import { Bot } from "lucide-react";

const AIAssistant = () => (
  <CyberLayout>
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <Bot className="w-16 h-16 text-primary mb-4 opacity-50" />
      <h1 className="font-mono text-2xl uppercase tracking-widest text-primary text-glow-green mb-2">
        AI Assistant
      </h1>
      <p className="font-mono text-sm text-muted-foreground">AI-powered threat analysis terminal — coming soon</p>
    </div>
  </CyberLayout>
);

export default AIAssistant;
