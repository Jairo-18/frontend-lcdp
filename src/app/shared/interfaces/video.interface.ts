export interface Video {
  id: string;
  title: string;
  url: string;
  description: string | null;
  youtubeId: string | null;
  thumbnailUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface VideoDto {
  title: string;
  url: string;
  isActive?: boolean;
}
