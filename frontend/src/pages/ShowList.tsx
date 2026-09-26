import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Show {
  id: string;
  nytRank: number;
  title: string;
  yearStart: number;
  yearEnd: number | null;
}

const STATUS_LABELS: Record<string, string> = {
  seen_it: "Seen it",
  seen_part_of_it: "Seen part of it",
  interested: "Interested in seeing it",
  not_interested: "Not interested",
};

function formatYears(show: Show) {
  if (show.yearEnd === null) return `${show.yearStart}–present`;
  if (show.yearEnd === show.yearStart) return `${show.yearStart}`;
  return `${show.yearStart}–${show.yearEnd}`;
}

export default function ShowList() {
  const [shows, setShows] = useState<Show[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listShows(), api.getMyStatuses()]).then(([showsRes, statusesRes]) => {
      setShows(showsRes.shows);
      const map: Record<string, string> = {};
      for (const s of statusesRes.statuses) map[s.showId] = s.status;
      setStatuses(map);
      setLoading(false);
    });
  }, []);

  async function setStatus(showId: string, status: string) {
    setStatuses((prev) => ({ ...prev, [showId]: status }));
    await api.setStatus(showId, status);
  }

  if (loading) return <p>Loading…</p>;

  return (
    <table className="shows">
      <thead>
        <tr>
          <th>#</th>
          <th>Show</th>
          <th>Years</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {shows.map((show) => (
          <tr key={show.id}>
            <td>{show.nytRank}</td>
            <td>{show.title}</td>
            <td>{formatYears(show)}</td>
            <td>
              <select
                value={statuses[show.id] ?? ""}
                onChange={(e) => setStatus(show.id, e.target.value)}
              >
                <option value="">Unranked</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
