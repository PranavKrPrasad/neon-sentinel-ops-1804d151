interface ConfidenceGaugeProps {
  value: number; // 0-100
}

const ConfidenceGauge = ({ value }: ConfidenceGaugeProps) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="glass-card rounded-lg border border-primary/20 p-6 flex flex-col items-center justify-center">
      <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
        AI Confidence Score
      </h3>
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke="hsl(220 20% 15%)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke="hsl(160 100% 50%)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: "drop-shadow(0 0 6px hsl(160 100% 50% / 0.5))",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-mono font-bold text-primary text-glow-green">
            {value}%
          </span>
          <span className="text-xs font-mono text-muted-foreground uppercase">Accuracy</span>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceGauge;
