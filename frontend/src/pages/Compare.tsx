import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { STATUS_LABELS, type Show, type ShowStatus } from "../lib/types";

interface CompareResult {
  mine: { showId: string; status: ShowStatus }[];
  theirs: { showId: string; status: ShowStatus }[];
  summary: { bothSeen: number; matching: number; totalCompared: number };
}

function StatusBadge({ status }: { status: ShowStatus | undefined }) {
  if (!status) return <span className="status-badge status-badge--empty">—</span>;
  return <span className={`status-badge status-badge--${status}`}>{STATUS_LABELS[status]}</span>;
}

export default function Compare() {
  const { userId } = useParams();
  const [data, setData] = useState<CompareResult | null>(null);
  const [shows, setShows] = useState<Show[]>([]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([api.compare(userId), api.listShows()]).then(([cmp, showsRes]) => {
      setData(cmp);
      setShows(showsRes.shows);
    });
  }, [userId]);

  if (!data) return <p className="loading">Loading…</p>;

  const mineMap = new Map(data.mine.map((s) => [s.showId, s.status]));
  const theirsMap = new Map(data.theirs.map((s) => [s.showId, s.status]));

  return (
    <div className="compare">
      <p className="compare__summary">
        <strong>{data.summary.bothSeen}</strong> shows you've both seen, {" "}
        <strong>{data.summary.matching}</strong> matching statuses overall.
      </p>
      <table className="compare-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Show</th>
            <th>You</th>
            <th>Them</th>
          </tr>
        </thead>
        <tbody>
          {shows.map((show) => (
            <tr key={show.id}>
              <td className="compare-table__rank">{show.nytRank}</td>
              <td className="compare-table__title">
                {show.posterUrl && <img src={show.posterUrl} alt="" className="compare-table__thumb" />}
                {show.title}
              </td>
              <td>
                <StatusBadge status={mineMap.get(show.id)} />
              </td>
              <td>
                <StatusBadge status={theirsMap.get(show.id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
