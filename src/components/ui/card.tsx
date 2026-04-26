import React from "react";
import { cn } from "../../lib/utils";

export const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn("bg-white border border-slate-200 rounded-[2rem] shadow-sm", className)} 
    {...props}
  >
    {children}
  </div>
);
