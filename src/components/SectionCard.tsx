import { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function SectionCard({ title, children, className = "", icon, actions }: Props) {
  return (
    <div className={`bg-card border border-border rounded-lg p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm uppercase tracking-wider text-primary flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </div>
  );
}
