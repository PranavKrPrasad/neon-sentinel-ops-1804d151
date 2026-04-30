import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SimulationProvider } from "@/contexts/SimulationContext";
import Index from "./pages/Index";
import AIAssistant from "./pages/AIAssistant";
import SimulationLab from "./pages/SimulationLab";
import SOCMode from "./pages/SOCMode";
import ThreatIntel from "./pages/ThreatIntel";
import MitreMapping from "./pages/MitreMapping";
import NetworkMonitor from "./pages/NetworkMonitor";
import SpamDetection from "./pages/SpamDetection";
import Training from "./pages/Training";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit" className="min-h-screen">
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/simulation" element={<SimulationLab />} />
          <Route path="/soc" element={<SOCMode />} />
          <Route path="/threat-intel" element={<ThreatIntel />} />
          <Route path="/mitre" element={<MitreMapping />} />
          <Route path="/network" element={<NetworkMonitor />} />
          <Route path="/spam" element={<SpamDetection />} />
          <Route path="/training" element={<Training />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SimulationProvider>
          <AnimatedRoutes />
        </SimulationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
