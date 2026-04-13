import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'accent' | 'warning' | 'success';
}

export function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend,
}: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-primary">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              "text-xs font-medium flex items-center gap-1",
              trend.isPositive ? "text-accent" : "text-destructive"
            )}>
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              {Math.abs(trend.value)}% vs mes anterior
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
