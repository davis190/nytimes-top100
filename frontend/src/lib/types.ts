export type ShowStatus = "seen_it" | "seen_part_of_it" | "interested" | "not_interested";

export interface WatchProvider {
  name: string;
  logoUrl: string | null;
}

export interface WatchProviders {
  link: string | null;
  flatrate: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

export interface Show {
  id: string;
  nytRank: number;
  title: string;
  yearStart: number;
  yearEnd: number | null;
  overview: string | null;
  genres: string[];
  network: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  imdbId: string | null;
  watchProviders: WatchProviders | null;
  enrichedAt: string | null;
}

export const STATUS_ORDER: ShowStatus[] = [
  "seen_it",
  "seen_part_of_it",
  "interested",
  "not_interested",
];

export const STATUS_LABELS: Record<ShowStatus, string> = {
  seen_it: "Seen it",
  seen_part_of_it: "Seen part",
  interested: "Interested",
  not_interested: "Not interested",
};

export const STATUS_SHORT_LABELS: Record<ShowStatus, string> = {
  seen_it: "Seen",
  seen_part_of_it: "Partial",
  interested: "Interested",
  not_interested: "Skip",
};

export function formatYears(show: Pick<Show, "yearStart" | "yearEnd">) {
  if (show.yearEnd === null) return `${show.yearStart}–present`;
  if (show.yearEnd === show.yearStart) return `${show.yearStart}`;
  return `${show.yearStart}–${show.yearEnd}`;
}

export function imdbUrl(show: Pick<Show, "imdbId" | "title">) {
  if (show.imdbId) return `https://www.imdb.com/title/${show.imdbId}/`;
  return `https://www.imdb.com/find/?q=${encodeURIComponent(show.title)}`;
}
