import type { Show, ShowStatus } from "../lib/types";
import { formatYears } from "../lib/types";
import StatusControl from "./StatusControl";

export default function ShowCard({
  show,
  status,
  onOpen,
  onStatusChange,
}: {
  show: Show;
  status: ShowStatus | null;
  onOpen: () => void;
  onStatusChange: (status: ShowStatus) => void;
}) {
  return (
    <div className={`show-card${status ? ` show-card--${status}` : ""}`} onClick={onOpen}>
      <div className="show-card__poster">
        {show.posterUrl ? (
          <img src={show.posterUrl} alt={show.title} loading="lazy" />
        ) : (
          <div className="show-card__poster-fallback">
            <span>{show.title}</span>
          </div>
        )}
        <span className="show-card__rank">#{show.nytRank}</span>
      </div>
      <div className="show-card__body">
        <h3 className="show-card__title">{show.title}</h3>
        <p className="show-card__meta">
          {formatYears(show)}
          {show.network ? ` · ${show.network}` : ""}
        </p>
        <StatusControl value={status} onChange={onStatusChange} compact />
      </div>
    </div>
  );
}
