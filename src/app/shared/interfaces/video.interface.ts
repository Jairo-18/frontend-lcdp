export interface Video {
  id: string;
  title: string;
  url: string;
  description: string | null;
  youtubeId: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
}
