// shared project types
export interface SpriteConfig {
  src: string;
  sheetWidth: number;
  sheetHeight: number;
  cellWidth: number;
  cellHeight: number;
}

/** Full row from the content table with joined author and aggregated ratings. */
export interface ChallengeRow {
  id: number;
  type: string;
  code: string;
  author_id: string | null;
  guest_id: string | null;
  name: string;
  description: string | null;
  tags: string[];
  json_data: Record<string, unknown>;
  sprite_url: string | null;
  status: "draft" | "published";
  downloads: number;
  plays: number;
  wins: number;
  losses: number;
  created_at: string;
  updated_at: string;
  author: string | null;
  avg_rating: number;
  rating_count: number;
}
