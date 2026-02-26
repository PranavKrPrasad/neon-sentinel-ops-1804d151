import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AIAssistant from "./pages/AIAssistant";
import SimulationLab from "./pages/SimulationLab";
import SOCMode from "./pages/SOCMode";
import ThreatIntel from "./pages/ThreatIntel";
import MitreMapping from "./pages/MitreMapping";
import NetworkMonitor from "./pages/NetworkMonitor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/simulation" element={<SimulationLab />} />
          <Route path="/soc" element={<SOCMode />} />
          <Route path="/threat-intel" element={<ThreatIntel />} />
          <Route path="/mitre" element={<MitreMapping />} />
          <Route path="/network" element={<NetworkMonitor />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
