import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const generateData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, "0")}:00`,
    traffic: Math.floor(Math.random() * 400 + 200),
    threats: Math.floor(Math.random() * 50),
  }));
};

const TrafficChart = () => {
  const [data, setData] = useState(generateData);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const next = [...prev.slice(1)];
        const last = prev[prev.length - 1];
        const hour = (parseInt(last.time) + 1) % 24;
        next.push({
          time: `${String(hour).padStart(2, "0")}:00`,
          traffic: Math.floor(Math.random() * 400 + 200),
          threats: Math.floor(Math.random() * 50),
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card rounded-lg border border-primary/20 p-4">
      <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
        Live Network Traffic
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(160 100% 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(160 100% 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(348 100% 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(348 100% 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              stroke="hsl(220 10% 35%)"
              fontSize={10}
              fontFamily="JetBrains Mono"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(220 10% 35%)"
              fontSize={10}
              fontFamily="JetBrains Mono"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(220 30% 8% / 0.95)",
                border: "1px solid hsl(160 100% 50% / 0.2)",
                borderRadius: "8px",
                fontFamily: "JetBrains Mono",
                fontSize: "11px",
                color: "hsl(160 100% 80%)",
              }}
            />
            <Area
              type="monotone"
              dataKey="traffic"
              stroke="hsl(160 100% 50%)"
              fill="url(#trafficGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="threats"
              stroke="hsl(348 100% 50%)"
              fill="url(#threatGradient)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrafficChart;
