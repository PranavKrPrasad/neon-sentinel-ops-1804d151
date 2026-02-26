const TopBanner = () => {
  return (
    <div className="glass-card border border-primary/20 neon-glow-green px-6 py-3 flex items-center justify-center gap-3">
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
      <h1 className="font-mono text-sm md:text-base font-bold uppercase tracking-[0.3em] text-primary text-glow-green">
        AI-IDS Cyber Defense Active
      </h1>
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
    </div>
  );
};

export default TopBanner;
