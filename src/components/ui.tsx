import React from 'react';
import { cn } from '../lib/utils';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-slate-900/60 border border-slate-700/50 backdrop-blur-md rounded-2xl overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-6 py-4 border-b border-slate-700/50", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn("font-display font-bold text-slate-300 uppercase tracking-widest text-xs", className)}>{children}</h3>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export function Button({ 
  className, variant = 'primary', size = 'default', ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost',
  size?: 'default' | 'sm' | 'lg' | 'icon'
}) {
  const variants = {
    primary: "bg-cyan-600 text-white hover:bg-cyan-500",
    secondary: "bg-slate-800 text-slate-200 hover:bg-slate-700",
    outline: "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400"
  };
  
  const sizes = {
    default: "h-10 px-4 py-2 text-sm font-semibold",
    sm: "h-8 px-3 text-xs font-semibold",
    lg: "h-12 px-8 text-base font-semibold",
    icon: "h-10 w-10 flex items-center justify-center"
  };

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
