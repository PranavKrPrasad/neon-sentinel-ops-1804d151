import { useEffect, useState } from "react";

interface AttackLine {
  id: number;
  x1: number; y1: number;
  x2: number; y2: number;
  color: string;
}

// Simplified world map path (continents outline)
const WORLD_PATH = "M125,55 L130,50 L140,48 L150,50 L155,55 L160,52 L170,50 L175,48 L180,50 L190,48 L200,52 L210,50 L220,55 L225,60 L230,65 L225,75 L220,80 L210,85 L200,82 L195,78 L190,80 L185,85 L180,90 L170,88 L165,85 L160,80 L155,78 L150,80 L145,82 L140,78 L135,75 L130,70 L125,65 Z M250,45 L260,42 L280,40 L300,42 L320,40 L340,42 L360,45 L370,50 L375,55 L380,60 L385,70 L380,80 L375,85 L370,90 L360,95 L350,92 L340,90 L330,92 L320,95 L310,90 L300,85 L290,88 L280,90 L270,85 L265,80 L260,70 L255,60 L250,50 Z M400,30 L420,28 L440,30 L460,28 L480,30 L500,35 L510,40 L515,50 L520,60 L515,70 L510,80 L500,85 L490,90 L480,92 L470,90 L460,88 L450,85 L440,80 L430,70 L425,60 L420,50 L415,40 L410,35 Z M550,50 L570,48 L590,50 L610,55 L620,60 L625,70 L620,80 L610,90 L600,95 L590,92 L580,88 L570,85 L560,80 L555,70 L550,60 Z M300,140 L310,135 L330,130 L350,135 L360,140 L355,150 L350,160 L340,170 L330,175 L320,170 L310,165 L305,155 L300,145 Z M470,120 L490,115 L510,118 L525,125 L530,140 L525,155 L515,170 L500,180 L485,185 L475,180 L465,170 L460,155 L458,140 L465,125 Z";

const mockAttacks: AttackLine[] = [
  { id: 1, x1: 280, y1: 60, x2: 500, y2: 50, color: "hsl(348 100% 50%)" },
  { id: 2, x1: 450, y1: 40, x2: 300, y2: 70, color: "hsl(348 100% 50%)" },
  { id: 3, x1: 570, y1: 60, x2: 350, y2: 55, color: "hsl(160 100% 50%)" },
  { id: 4, x1: 150, y1: 60, x2: 300, y2: 50, color: "hsl(160 100% 50%)" },
  { id: 5, x1: 490, y1: 130, x2: 350, y2: 60, color: "hsl(348 100% 50%)" },
];

const AttackMap = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="glass-card rounded-lg border border-primary/20 p-4">
      <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
        Global Attack Map
      </h3>
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "2.5/1" }}>
        <svg viewBox="0 0 700 200" className="w-full h-full">
          {/* Map outline */}
          <path
            d={WORLD_PATH}
            fill="none"
            stroke="hsl(160 100% 50% / 0.15)"
            strokeWidth="1"
          />
          <path
            d={WORLD_PATH}
            fill="hsl(160 100% 50% / 0.03)"
          />

          {/* Attack lines */}
          {visible && mockAttacks.map((attack) => (
            <g key={attack.id}>
              <line
                x1={attack.x1} y1={attack.y1}
                x2={attack.x2} y2={attack.y2}
                stroke={attack.color}
                strokeWidth="1"
                opacity="0.6"
                strokeDasharray="4 4"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="8;0"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </line>
              {/* Origin point */}
              <circle cx={attack.x1} cy={attack.y1} r="3" fill={attack.color} opacity="0.8">
                <animate attributeName="r" values="2;5;2" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Target point */}
              <circle cx={attack.x2} cy={attack.y2} r="3" fill={attack.color} opacity="0.8">
                <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default AttackMap;
