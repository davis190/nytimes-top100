export type ShowStatus = "seen_it" | "seen_part_of_it" | "interested" | "not_interested";

export const VALID_STATUSES: ShowStatus[] = [
  "seen_it",
  "seen_part_of_it",
  "interested",
  "not_interested",
];

export interface WatchProvider {
  name: string;
  logoUrl: string;
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
