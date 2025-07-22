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

// Updated CORS proxy options with more reliable services
const CORS_PROXIES = [
  "https://api.allorigins.win/raw?url=",
  "https://corsproxy.io/?",
  "https://cors-anywhere.herokuapp.com/",
  "https://thingproxy.freeboard.io/fetch/",
];

export async function fetchPlaylist(url: string): Promise<Channel[]> {
  try {
    console.log(`Fetching playlist from: ${url}`);

    // Try server-side proxy first (most reliable)
    const channels = await fetchViaServerProxy(url);
    if (channels.length > 0) {
      return channels;
    }

    // Fallback to client-side CORS proxies
    const corsChannels = await fetchRealPlaylist(url);
    if (corsChannels.length > 0) {
      return corsChannels;
    }

    throw new Error("No channels found");
  } catch (error) {
    console.error("Failed to fetch playlist:", error);
    throw error;
  }
}

// New function to use server-side proxy
async function fetchViaServerProxy(url: string): Promise<Channel[]> {
  try {
    const response = await fetch("/api/proxy/playlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.content) {
        const channels = parseM3U(data.content);
        console.log(`Server proxy: Parsed ${channels.length} channels`);
        return channels.filter(isStreamAccessible);
      }
    }
  } catch (error) {
    console.log("Server proxy failed:", error);
  }

  return [];
}

export function parseM3U(m3uContent: string): Channel[] {
  const channels: Channel[] = [];
  const lines = m3uContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  let currentChannel: Partial<Channel> = {};
  let channelId = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("#EXTINF:")) {
      // Parse channel info from EXTINF line
      const info = line.substring(8); // Remove '#EXTINF:'

      // Extract channel name (after the last comma)
      const nameMatch = info.match(/,(.+)$/);
      const name = nameMatch ? nameMatch[1].trim() : `Channel ${channelId}`;

      // Extract attributes using regex
      const tvgId = extractAttribute(info, "tvg-id");
      const tvgLogo = extractAttribute(info, "tvg-logo");
      const groupTitle = extractAttribute(info, "group-title");
      const tvgCountry = extractAttribute(info, "tvg-country");
      const tvgLanguage = extractAttribute(info, "tvg-language");
      const tvgRegion = extractAttribute(info, "tvg-region");

      currentChannel = {
        id: tvgId || channelId.toString(),
        name: name,
        logo: sanitizeLogo(tvgLogo),
        category: groupTitle,
        country: tvgCountry,
        language: tvgLanguage,
        region: tvgRegion,
      };
    } else if (line && !line.startsWith("#") && currentChannel.name) {
      // This is the stream URL
      currentChannel.url = line;

      // Only add channels with valid URLs
      if (isValidUrl(line)) {
        channels.push({
          ...currentChannel,
          id: currentChannel.id || channelId.toString(),
        } as Channel);
      }

      currentChannel = {};
      channelId++;
    }
  }

  return channels;
}

function extractAttribute(
  extinf: string,
  attribute: string
): string | undefined {
  const regex = new RegExp(`${attribute}="([^"]*)"`, "i");
  const match = extinf.match(regex);
  return match ? match[1] : undefined;
}

function sanitizeLogo(logo?: string): string | undefined {
  if (!logo) return undefined;

  // Filter out problematic logo URLs
  const problematicDomains = [
    "alternatv.png",
    "cropped-LOGO-NEW.png",
    "5ba5a4abe66dd.png",
    "TBK-logo-2021.png",
    "Logo-BLTV-B-c-Li-u.png",
    "btv-Bac-Ninh-2021.png",
    "KULINAR_TEMP.png",
    "logo-square.png",
    "f-1.png",
    "default_logo-150x150.png",
    "tANAElTS_400x400.jpg",
    "IMG-20230706-142136.jpg",
    "20190716074123890vav.png",
    "go2-logo.png",
    "quran-radio-logo-h-rtl.png",
    "logo-ozhsm5mqi0zh2wnf8es5jbyh39ztnqmbbn9tbey0hw.png",
    "dunya-tv-az.png",
    "Persiana-HD.png",
    "Persiana-Rap.png",
    "logod.jpg",
    "qdtv1.jpg",
    "5fc81016d98cab623846a4f3",
    "IMG-20230629-152623.jpg",
    "6rj9aw.jpg",
    "8v2y8m.png",
    "1-210414213-U60-L.jpg",
    "s202038d.png",
    "Picture1111123.png",
  ];

  // Check if logo contains any problematic domains
  if (problematicDomains.some((domain) => logo.includes(domain))) {
    return undefined;
  }

  // Only allow HTTPS logos
  if (logo.startsWith("http://")) {
    return undefined;
  }

  return logo;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith("http://") || url.startsWith("https://");
  } catch {
    return false;
  }
}

function isStreamAccessible(channel: Channel): boolean {
  const url = channel.url.toLowerCase();

  // Expanded list of domains/patterns known to have CORS restrictions
  const corsRestrictedDomains = [
    "pluto.tv",
    "plutotv.com",
    "cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv",
    "service-stitcher.clusters.pluto.tv",
    "alkassdigital.net",
    "vo-live-media.cdb.cdn.orange.com",
    "dev.aftermind.xyz",
    "raycom-accdn-firetv.amagi.tv",
    "bl.webcaster.pro",
    "webstreaming.viewmedia.tv",
    "aasthaott.akamaized.net",
    "live20.bozztv.com",
    "9now-livestreams.akamaized.net",
    "amg01117-amg01117c1-amgplt0165.playout.now3.amagi.tv",
    "mtlivestream.site",
    "bloomberg.com",
    "www.btvlive.gov.bd",
    "youtube.com",
    "youtu.be",
    "facebook.com",
    "fb.com",
    "instagram.com",
    "twitter.com",
    "tiktok.com",
    "twitch.tv",
    "dailymotion.com",
    "vimeo.com",
    "tv.cdn.xsg.ge",
    "stream.oursnetworktv.com"

  ];

  // Check if URL contains any CORS-restricted domains
  const hasCorsRestriction = corsRestrictedDomains.some((domain) =>
    url.includes(domain)
  );

  // Prefer HTTPS streams (mixed content issues)
  const isHttps = url.startsWith("https://");

  // Filter out IP-based URLs (often blocked)
  const hasIpAddress = /https?:\/\/\d+\.\d+\.\d+\.\d+/.test(url);

  // Filter out streams with tokens that might expire
  const hasExpiredToken = url.includes("token=") && url.includes("?");

  return !hasCorsRestriction && isHttps && !hasIpAddress && !hasExpiredToken;
}

// Updated function to get proxied stream URL
export function getProxiedStreamUrl(originalUrl: string): string {
  // Use server-side proxy for streaming
  return `/api/proxy/stream?url=${encodeURIComponent(originalUrl)}`;
}

async function fetchRealPlaylist(url: string): Promise<Channel[]> {
  let m3uContent = "";
  let fetchSuccess = false;

  // Try direct fetch first with proper CORS headers
  try {
    const response = await fetch(url, {
      mode: "cors",
      headers: {
        Accept:
          "application/x-mpegURL, application/vnd.apple.mpegurl, application/octet-stream, */*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Origin: window.location.origin,
      },
    });

    if (response.ok) {
      m3uContent = await response.text();
      fetchSuccess = true;
      console.log("Direct fetch successful");
    }
  } catch (error) {
    console.log("Direct fetch failed, trying CORS proxies...");
  }

  // If direct fetch failed, try CORS proxies with better error handling
  if (!fetchSuccess) {
    for (const proxy of CORS_PROXIES) {
      try {
        const proxyUrl = proxy + encodeURIComponent(url);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          m3uContent = await response.text();
          fetchSuccess = true;
          console.log(`Fetch successful via proxy: ${proxy}`);
          break;
        }
      } catch (error) {
        console.log(`Proxy ${proxy} failed:`, error);
        continue;
      }
    }
  }

  if (fetchSuccess && m3uContent) {
    const channels = parseM3U(m3uContent);
    console.log(`Parsed ${channels.length} channels from M3U`);

    // Filter out CORS-restricted channels
    const accessibleChannels = channels.filter(isStreamAccessible);
    console.log(`Filtered to ${accessibleChannels.length} accessible channels`);

    return accessibleChannels;
  }

  throw new Error("Failed to fetch real playlist");
}

export function getPlaylistUrl(type: string, filter?: string): string {
  const baseUrl = "https://iptv-org.github.io/iptv";

  switch (type) {
    case "main":
      return `${baseUrl}/index.m3u`;
    case "categories":
      return filter
        ? `${baseUrl}/categories/${filter.toLowerCase()}.m3u`
        : `${baseUrl}/categories/`;
    case "languages":
      return filter
        ? `${baseUrl}/languages/${filter.toLowerCase()}.m3u`
        : `${baseUrl}/languages/`;
    case "countries":
      return filter
        ? `${baseUrl}/countries/${filter
            .toLowerCase()
            .replace(/\s+/g, "_")}.m3u`
        : `${baseUrl}/countries/`;
    case "regions":
      return filter
        ? `${baseUrl}/regions/${filter.toLowerCase().replace(/\s+/g, "_")}.m3u`
        : `${baseUrl}/regions/`;
    case "sources":
      return filter
        ? `${baseUrl}/sources/${filter.toLowerCase().replace(/\s+/g, "_")}.m3u`
        : `${baseUrl}/sources/`;
    default:
      return `${baseUrl}/index.m3u`;
  }
}
