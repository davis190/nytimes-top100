import type { Show, ShowStatus } from "../lib/types";
import { formatYears } from "../lib/types";
import StatusControl from "./StatusControl";

export default function ShowTable({
  shows,
  statuses,
  onOpen,
  onStatusChange,
}: {
  shows: Show[];
  statuses: Record<string, ShowStatus>;
  onOpen: (showId: string) => void;
  onStatusChange: (showId: string, status: ShowStatus) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="show-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Show</th>
            <th>Years</th>
            <th>Network</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {shows.map((show) => (
            <tr key={show.id} onClick={() => onOpen(show.id)}>
              <td className="show-table__rank">{show.nytRank}</td>
              <td className="show-table__title">
                {show.posterUrl ? (
                  <img src={show.posterUrl} alt="" className="show-table__thumb" />
                ) : (
                  <div className="show-table__thumb" />
                )}
                {show.title}
              </td>
              <td className="show-table__meta">{formatYears(show)}</td>
              <td className="show-table__meta">{show.network ?? "—"}</td>
              <td>
                <StatusControl
                  value={statuses[show.id] ?? null}
                  onChange={(status) => onStatusChange(show.id, status)}
                  compact
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
