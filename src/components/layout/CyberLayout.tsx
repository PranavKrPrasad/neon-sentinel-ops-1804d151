import { ReactNode } from "react";
import CyberBackground from "@/components/CyberBackground";
import NavSidebar from "@/components/layout/NavSidebar";

interface CyberLayoutProps {
  children: ReactNode;
}

const CyberLayout = ({ children }: CyberLayoutProps) => {
  return (
    <div className="min-h-screen relative">
      <CyberBackground />
      <div className="relative z-10 flex">
        <NavSidebar />
        <main className="flex-1 ml-16 lg:ml-56 p-4 lg:p-6 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default CyberLayout;
