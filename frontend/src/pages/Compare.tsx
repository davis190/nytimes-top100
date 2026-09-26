import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";

interface Show {
  id: string;
  nytRank: number;
  title: string;
}

interface CompareResult {
  mine: { showId: string; status: string }[];
  theirs: { showId: string; status: string }[];
  summary: { bothSeen: number; matching: number; totalCompared: number };
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

  if (!data) return <p>Loading…</p>;

  const mineMap = new Map(data.mine.map((s) => [s.showId, s.status]));
  const theirsMap = new Map(data.theirs.map((s) => [s.showId, s.status]));

  return (
    <div>
      <p>
        {data.summary.bothSeen} shows you've both seen, {data.summary.matching} matching statuses
        overall.
      </p>
      <table className="compare">
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
              <td>{show.nytRank}</td>
              <td>{show.title}</td>
              <td>{mineMap.get(show.id) ?? "—"}</td>
              <td>{theirsMap.get(show.id) ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
