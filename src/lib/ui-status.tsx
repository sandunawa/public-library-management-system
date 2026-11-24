import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Archive,
  BookCheck,
  UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type StatusCategory =
  | 'member'
  | 'copy'
  | 'loan'
  | 'request'
  | 'audit';

export interface StatusBadgeConfig {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'default';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export function getStatusBadgeConfig(status: string): StatusBadgeConfig {
  const norm = (status || '').toUpperCase().trim();

  switch (norm) {
    // Active / Available / Issued / Returned
    case 'ACTIVE':
    case 'APPROVED':
    case 'AVAILABLE':
    case 'PAID':
    case 'CLEARED':
      return {
        variant: 'success',
        icon: CheckCircle2,
        label: status,
      };

    // Pending / In Review / Due Soon
    case 'PENDING':
    case 'REQUESTED':
    case 'PENDING_APPROVAL':
    case 'RESERVED':
    case 'HELD':
    case 'UNDER_REVIEW':
      return {
        variant: 'warning',
        icon: Clock,
        label: status,
      };

    // Issued / Borrowed
    case 'ISSUED':
    case 'BORROWED':
    case 'ACTIVE_LOAN':
      return {
        variant: 'info',
        icon: BookCheck,
        label: status,
      };

    // Overdue / Danger
    case 'OVERDUE':
    case 'LATE':
      return {
        variant: 'danger',
        icon: AlertTriangle,
        label: status,
      };

    // Suspended / Lost / Damaged / Withdrawn
    case 'SUSPENDED':
    case 'BLOCKED':
      return {
        variant: 'danger',
        icon: ShieldAlert,
        label: status,
      };

    case 'DAMAGED':
    case 'MISSING':
    case 'LOST':
      return {
        variant: 'danger',
        icon: XCircle,
        label: status,
      };

    case 'WITHDRAWN':
    case 'ARCHIVED':
    case 'EXPIRED':
    case 'CANCELLED':
    case 'WAIVED':
      return {
        variant: 'muted',
        icon: Archive,
        label: status,
      };

    default:
      return {
        variant: 'default',
        icon: CheckCircle2,
        label: status || 'Unknown',
      };
  }
}

export interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  size = 'default',
  className,
}) => {
  const config = getStatusBadgeConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} size={size} className={className}>
      <Icon className="h-3 w-3 shrink-0 stroke-[2.2]" />
      <span className="font-medium tracking-tight">
        {customLabel || config.label}
      </span>
    </Badge>
  );
};
