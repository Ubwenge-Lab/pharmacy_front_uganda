'use client';

export type StatusValue =
  | 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'READY_FOR_PICKUP'
  | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'
  | 'APPROVED' | 'REJECTED' | 'CLOCKED_OUT'
  | 'ACTIVE' | 'INACTIVE'
  | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  | 'OPEN' | 'CLOSED';

interface StatusStyle {
  classes: string;
  dot: string;
}

const STATUS_STYLES: Record<string, StatusStyle> = {
  PENDING:          { classes: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   },
  ACCEPTED:         { classes: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500'    },
  PREPARING:        { classes: 'bg-purple-50 text-purple-700 border-purple-200',    dot: 'bg-purple-500'  },
  OUT_FOR_DELIVERY: { classes: 'bg-cyan-50 text-cyan-700 border-cyan-200',          dot: 'bg-cyan-500'    },
  READY_FOR_PICKUP: { classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  DELIVERED:        { classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  COMPLETED:        { classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  CANCELLED:        { classes: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500'     },
  REJECTED:         { classes: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500'     },
  APPROVED:         { classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  CLOCKED_OUT:      { classes: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500'    },
  ACTIVE:           { classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  INACTIVE:         { classes: 'bg-gray-100 text-gray-600 border-gray-200',         dot: 'bg-gray-400'    },
  IN_STOCK:         { classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  LOW_STOCK:        { classes: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   },
  OUT_OF_STOCK:     { classes: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500'     },
  OPEN:             { classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  CLOSED:           { classes: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500'     },
};

const DEFAULT_STYLE: StatusStyle = {
  classes: 'bg-gray-100 text-gray-600 border-gray-200',
  dot:     'bg-gray-400',
};

interface StatusBadgeProps {
  /** Status string. Unknown values fall back to a neutral gray badge. */
  status: StatusValue | string;
  /** Optional human-readable label override. Defaults to the status with underscores stripped. */
  label?: string;
  /** Visual size — defaults to `sm`. */
  size?: 'sm' | 'md';
  /** Show the leading dot indicator. Defaults to true. */
  withDot?: boolean;
  /** Extra classes for outer span. */
  className?: string;
}

export default function StatusBadge({
  status,
  label,
  size = 'sm',
  withDot = true,
  className = '',
}: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE;
  const sizeClasses = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  const displayLabel = label ?? String(status).replace(/_/g, ' ').toLowerCase();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizeClasses} ${style.classes} ${className}`}
    >
      {withDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />}
      <span className="capitalize whitespace-nowrap">{displayLabel}</span>
    </span>
  );
}
