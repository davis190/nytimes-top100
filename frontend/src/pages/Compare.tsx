import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { STATUS_LABELS, type Show, type ShowStatus } from "../lib/types";

interface CompareResult {
  mine: { showId: string; status: ShowStatus }[];
  theirs: { showId: string; status: ShowStatus }[];
  summary: { bothSeen: number; matching: number; totalCompared: number };
}

type CompareFilter =
  | "all"
  | "both_seen"
  | "you_only_seen"
  | "them_only_seen"
  | "both_interested"
  | "different";

const FILTER_LABELS: Record<CompareFilter, string> = {
  all: "All shows",
  both_seen: "Both have seen it",
  you_only_seen: "You've seen, they haven't",
  them_only_seen: "They've seen, you haven't",
  both_interested: "Both want to watch",
  different: "Different statuses",
};

function matchesFilter(mine: ShowStatus | undefined, theirs: ShowStatus | undefined, filter: CompareFilter) {
  switch (filter) {
    case "both_seen":
      return mine === "seen_it" && theirs === "seen_it";
    case "you_only_seen":
      return mine === "seen_it" && theirs !== "seen_it";
    case "them_only_seen":
      return theirs === "seen_it" && mine !== "seen_it";
    case "both_interested":
      return mine === "interested" && theirs === "interested";
    case "different":
      return (mine ?? null) !== (theirs ?? null);
    default:
      return true;
  }
}

function StatusBadge({ status }: { status: ShowStatus | undefined }) {
  if (!status) return <span className="status-badge status-badge--empty">—</span>;
  return <span className={`status-badge status-badge--${status}`}>{STATUS_LABELS[status]}</span>;
}

export default function Compare() {
  const { userId } = useParams();
  const [data, setData] = useState<CompareResult | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CompareFilter>("all");

  useEffect(() => {
    if (!userId) return;
    Promise.all([api.compare(userId), api.listShows()]).then(([cmp, showsRes]) => {
      setData(cmp);
      setShows(showsRes.shows);
    });
  }, [userId]);

  const mineMap = useMemo(() => new Map(data?.mine.map((s) => [s.showId, s.status]) ?? []), [data]);
  const theirsMap = useMemo(() => new Map(data?.theirs.map((s) => [s.showId, s.status]) ?? []), [data]);

  const visibleShows = useMemo(() => {
    let result = shows;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((s) => s.title.toLowerCase().includes(q));
    }

    if (filter !== "all") {
      result = result.filter((s) => matchesFilter(mineMap.get(s.id), theirsMap.get(s.id), filter));
    }

    return result;
  }, [shows, search, filter, mineMap, theirsMap]);

  if (!data) return <p className="loading">Loading…</p>;

  return (
    <div className="compare">
      <p className="compare__summary">
        <strong>{data.summary.bothSeen}</strong> shows you've both seen,{" "}
        <strong>{data.summary.matching}</strong> matching statuses overall.
      </p>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search shows…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-bar__search"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value as CompareFilter)}>
          {(Object.keys(FILTER_LABELS) as CompareFilter[]).map((key) => (
            <option key={key} value={key}>
              {FILTER_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {visibleShows.length === 0 ? (
        <p className="empty-state">No shows match your filters.</p>
      ) : (
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
            {visibleShows.map((show) => (
              <tr key={show.id}>
                <td className="compare-table__rank">{show.nytRank}</td>
                <td className="compare-table__title">{show.title}</td>
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
      )}
    </div>
  );
}
