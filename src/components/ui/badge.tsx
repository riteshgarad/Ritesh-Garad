import React from "react";
import { cn } from "../../lib/utils";

export const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border", className)}>
    {children}
  </div>
);
