interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  category?: string;
  country?: string;
  language?: string;
  group?: string;
  region?: string;
  source?: string;
}

export async function fetchPlaylist(url: string): Promise<Channel[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch playlist");
    const content = await response.text();
    return parseM3U(content).filter(isStreamAccessible);
  } catch (error) {
    console.error("Error fetching playlist:", error);
    return [];
  }
}

function parseM3U(m3u: string): Channel[] {
  const lines = m3u
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const channels: Channel[] = [];
  let temp: Partial<Channel> = {};
  let idCounter = 1;

  for (const line of lines) {
    if (line.startsWith("#EXTINF:")) {
      const info = line.slice(8);
      temp = {
        id: extract(info, "tvg-id") || `${idCounter}`,
        name: info.split(",").pop()?.trim() || `Channel ${idCounter}`,
        logo: sanitizeLogo(extract(info, "tvg-logo")),
        category: extract(info, "group-title"),
        country: extract(info, "tvg-country"),
        language: extract(info, "tvg-language"),
        region: extract(info, "tvg-region"),
      };
    } else if (!line.startsWith("#") && temp.name && isValidUrl(line)) {
      channels.push({ ...temp, url: line } as Channel);
      idCounter++;
      temp = {};
    }
  }

  return channels;
}

function extract(info: string, key: string): string | undefined {
  return info.match(new RegExp(`${key}="([^"]*)"`))?.[1];
}

function sanitizeLogo(logo?: string): string | undefined {
  if (!logo || logo.startsWith("http://")) return;
  const blacklist = ["alternatv.png", "default_logo-150x150.png"];
  return blacklist.some((bad) => logo.includes(bad)) ? undefined : logo;
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol.startsWith("http");
  } catch {
    return false;
  }
}

function isStreamAccessible({ url }: Channel): boolean {
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.startsWith("https://") &&
    !/\d+\.\d+\.\d+\.\d+/.test(lowerUrl) &&
    !lowerUrl.includes("token=")
  );
}

export function getPlaylistUrl(type: string, value?: string): string {
  const base = "https://iptv-org.github.io/iptv";
  const safe = (s: string) => s.toLowerCase().replace(/\s+/g, "_");

  if (type === "main") return `${base}/index.m3u`;
  if (
    ["categories", "countries", "languages", "regions"].includes(type) &&
    value
  ) {
    return `${base}/${type}/${safe(value)}.m3u`;
  }

  throw new Error("Invalid type or missing value");
}
