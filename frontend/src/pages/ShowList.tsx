import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { STATUS_ORDER, STATUS_LABELS, type Show, type ShowStatus } from "../lib/types";
import ShowCard from "../components/ShowCard";
import ShowDetailModal from "../components/ShowDetailModal";
import ProgressBar from "../components/ProgressBar";

type StatusFilter = "all" | "unranked" | ShowStatus;
type SortBy = "rank" | "title" | "year";

export default function ShowList() {
  const [shows, setShows] = useState<Show[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ShowStatus>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("rank");
  const [openShowId, setOpenShowId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listShows(), api.getMyStatuses()]).then(([showsRes, statusesRes]) => {
      setShows(showsRes.shows);
      const map: Record<string, ShowStatus> = {};
      for (const s of statusesRes.statuses) map[s.showId] = s.status;
      setStatuses(map);
      setLoading(false);
    });
  }, []);

  async function setStatus(showId: string, status: ShowStatus) {
    setStatuses((prev) => ({ ...prev, [showId]: status }));
    await api.setStatus(showId, status);
  }

  const seenCount = useMemo(
    () => Object.values(statuses).filter((s) => s === "seen_it").length,
    [statuses]
  );

  const visibleShows = useMemo(() => {
    let result = shows;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((s) => s.title.toLowerCase().includes(q));
    }

    if (statusFilter === "unranked") {
      result = result.filter((s) => !statuses[s.id]);
    } else if (statusFilter !== "all") {
      result = result.filter((s) => statuses[s.id] === statusFilter);
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "year") return a.yearStart - b.yearStart;
      return a.nytRank - b.nytRank;
    });

    return result;
  }, [shows, search, statusFilter, sortBy, statuses]);

  const openShow = shows.find((s) => s.id === openShowId) ?? null;

  if (loading) return <p className="loading">Loading…</p>;

  return (
    <div className="show-list">
      <div className="show-list__header">
        <ProgressBar seen={seenCount} total={shows.length} />
      </div>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search shows…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-bar__search"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="all">All shows</option>
          <option value="unranked">Unranked</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
          <option value="rank">Sort: NYT rank</option>
          <option value="title">Sort: Title</option>
          <option value="year">Sort: Year</option>
        </select>
      </div>

      {visibleShows.length === 0 ? (
        <p className="empty-state">No shows match your filters.</p>
      ) : (
        <div className="show-grid">
          {visibleShows.map((show) => (
            <ShowCard
              key={show.id}
              show={show}
              status={statuses[show.id] ?? null}
              onOpen={() => setOpenShowId(show.id)}
              onStatusChange={(status) => setStatus(show.id, status)}
            />
          ))}
        </div>
      )}

      {openShow && (
        <ShowDetailModal
          show={openShow}
          status={statuses[openShow.id] ?? null}
          onClose={() => setOpenShowId(null)}
          onStatusChange={(status) => setStatus(openShow.id, status)}
        />
      )}
    </div>
  );
}
