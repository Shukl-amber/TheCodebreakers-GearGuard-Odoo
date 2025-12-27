import React from 'react';

export interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-md border';
  
  const variants = {
    primary: 'bg-blue-950/30 text-blue-300 border-blue-800/60',
    secondary: 'bg-slate-950/30 text-slate-300 border-slate-800/60',
    success: 'bg-green-950/30 text-green-300 border-green-800/60',
    error: 'bg-red-950/30 text-red-300 border-red-800/60',
    warning: 'bg-amber-950/30 text-amber-300 border-amber-800/60',
    neutral: 'bg-neutral-800/50 text-neutral-300 border-neutral-700/60',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };
  
  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;

