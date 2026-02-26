import { ShieldAlert, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import CyberLayout from "@/components/layout/CyberLayout";
import TopBanner from "@/components/dashboard/TopBanner";
import StatCard from "@/components/dashboard/StatCard";
import ConfidenceGauge from "@/components/dashboard/ConfidenceGauge";
import AttackMap from "@/components/dashboard/AttackMap";
import TrafficChart from "@/components/dashboard/TrafficChart";

const Index = () => {
  return (
    <CyberLayout>
      <div className="space-y-6 animate-fade-in">
        <TopBanner />

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ShieldAlert} label="Total Threats" value="1,247" trend="+12% last 24h" color="red" />
          <StatCard icon={ShieldCheck} label="Blocked Attacks" value="1,183" trend="94.8% blocked" color="green" />
          <StatCard icon={AlertTriangle} label="Active Alerts" value="23" trend="5 critical" color="amber" />
          <StatCard icon={Clock} label="System Uptime" value="99.97%" trend="47 days" color="blue" />
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <AttackMap />
          </div>
          <ConfidenceGauge value={94} />
        </div>

        {/* Traffic chart */}
        <TrafficChart />
      </div>
    </CyberLayout>
  );
};

export default Index;
