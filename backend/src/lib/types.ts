export type ShowStatus = "seen_it" | "seen_part_of_it" | "interested" | "not_interested";

export const VALID_STATUSES: ShowStatus[] = [
  "seen_it",
  "seen_part_of_it",
  "interested",
  "not_interested",
];

export interface Show {
  id: string;
  nytRank: number;
  title: string;
  yearStart: number;
  yearEnd: number | null;
}
