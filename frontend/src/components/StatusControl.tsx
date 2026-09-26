import { STATUS_ORDER, STATUS_SHORT_LABELS, type ShowStatus } from "../lib/types";

export default function StatusControl({
  value,
  onChange,
  compact = false,
}: {
  value: ShowStatus | null;
  onChange: (status: ShowStatus) => void;
  compact?: boolean;
}) {
  return (
    <div className={`status-control${compact ? " status-control--compact" : ""}`} onClick={(e) => e.stopPropagation()}>
      {STATUS_ORDER.map((status) => (
        <button
          key={status}
          type="button"
          className={`status-pill status-pill--${status}${value === status ? " is-active" : ""}`}
          onClick={() => onChange(status)}
          title={STATUS_SHORT_LABELS[status]}
        >
          {STATUS_SHORT_LABELS[status]}
        </button>
      ))}
    </div>
  );
}
