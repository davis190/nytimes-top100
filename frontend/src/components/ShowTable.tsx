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
    <table className="show-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Show</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {shows.map((show) => (
          <tr key={show.id} onClick={() => onOpen(show.id)}>
            <td className="show-table__rank">{show.nytRank}</td>
            <td className="show-table__title">
              {show.title}
              <span className="show-table__meta">
                {formatYears(show)}
                {show.network ? ` · ${show.network}` : ""}
              </span>
            </td>
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
  );
}
