export default function ProgressBar({ seen, total }: { seen: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((seen / total) * 100);
  return (
    <div className="progress">
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress__label">
        {seen} / {total} seen ({pct}%)
      </span>
    </div>
  );
}
