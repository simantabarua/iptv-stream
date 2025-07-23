export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  category?: string;
  country?: string;
  language?: string;
  region?: string;
  source?: string;
}

export interface Category {
  category: string;
  channels: number;
  playlist: string;
}

export interface Language {
  language_name: string;
  channels: number;
  playlist_url: string;
}

export interface Country {
  name: string;
  flag: string | null;
  channels: number;
  playlist_url: string;
  subdivisions: any[];
}

export interface Region {
  region_name?: string;
  name?: string;
  channels: number;
  playlist_url: string;
}