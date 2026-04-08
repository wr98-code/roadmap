import { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function SectionCard({ title, children, className = "", icon }: Props) {
  return (
    <div className={`bg-card border border-border rounded-lg p-5 ${className}`}>
      <h3 className="font-heading text-sm uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}
