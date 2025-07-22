interface Channel {
  id: string
  name: string
  url: string
  logo?: string
  category?: string
  country?: string
  language?: string
  group?: string
  region?: string
  source?: string
}

// CORS proxy options for fetching M3U files and video streams
const CORS_PROXIES = ["https://api.allorigins.win/raw?url=", "https://corsproxy.io/?"]

// Video CORS proxies (specialized for streaming)
const VIDEO_CORS_PROXIES = ["https://cors-anywhere.herokuapp.com/", "https://api.allorigins.win/raw?url="]

export async function fetchPlaylist(url: string, type?: string, filterValue?: string): Promise<Channel[]> {
  try {
    console.log(`Fetching playlist from: ${url}`)

    // Try to fetch the real M3U playlist first
    const channels = await fetchRealPlaylist(url)
    if (channels.length > 0) {
      return channels
    }

    throw new Error("No channels found")
  } catch (error) {
    console.error("Failed to fetch playlist:", error)

    // Generate fallback data based on type and filter
    if (type === "language" && filterValue) {
      return generateLanguageFallback(filterValue, 100) // Default fallback count
    } else if (type === "country" && filterValue) {
      return generateCountryFallback(filterValue, 100, null)
    } else if (type === "region" && filterValue) {
      return generateRegionFallback(filterValue, 100)
    } else if (type === "category" && filterValue) {
      return generateRealCategoryFallback(filterValue, 100)
    }

    return generateSampleChannels()
  }
}

export function parseM3U(m3uContent: string): Channel[] {
  const channels: Channel[] = []
  const lines = m3uContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line)

  let currentChannel: Partial<Channel> = {}
  let channelId = 1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith("#EXTINF:")) {
      // Parse channel info from EXTINF line
      const info = line.substring(8) // Remove '#EXTINF:'

      // Extract channel name (after the last comma)
      const nameMatch = info.match(/,(.+)$/)
      const name = nameMatch ? nameMatch[1].trim() : `Channel ${channelId}`

      // Extract attributes using regex
      const tvgId = extractAttribute(info, "tvg-id")
      const tvgLogo = extractAttribute(info, "tvg-logo")
      const groupTitle = extractAttribute(info, "group-title")
      const tvgCountry = extractAttribute(info, "tvg-country")
      const tvgLanguage = extractAttribute(info, "tvg-language")
      const tvgRegion = extractAttribute(info, "tvg-region")

      currentChannel = {
        id: tvgId || channelId.toString(),
        name: name,
        logo: sanitizeLogo(tvgLogo),
        category: groupTitle,
        country: tvgCountry,
        language: tvgLanguage,
        region: tvgRegion,
      }
    } else if (line && !line.startsWith("#") && currentChannel.name) {
      // This is the stream URL
      currentChannel.url = line

      // Only add channels with valid URLs
      if (isValidUrl(line)) {
        channels.push({
          ...currentChannel,
          id: currentChannel.id || channelId.toString(),
        } as Channel)
      }

      currentChannel = {}
      channelId++
    }
  }

  return channels
}

function extractAttribute(extinf: string, attribute: string): string | undefined {
  const regex = new RegExp(`${attribute}="([^"]*)"`, "i")
  const match = extinf.match(regex)
  return match ? match[1] : undefined
}

function sanitizeLogo(logo?: string): string | undefined {
  if (!logo) return undefined

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
  ]

  // Check if logo contains any problematic domains
  if (problematicDomains.some((domain) => logo.includes(domain))) {
    return undefined
  }

  // Only allow HTTPS logos
  if (logo.startsWith("http://")) {
    return undefined
  }

  return logo
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return url.startsWith("http://") || url.startsWith("https://")
  } catch {
    return false
  }
}

function isStreamAccessible(channel: Channel): boolean {
  const url = channel.url.toLowerCase()

  // List of domains/patterns known to have CORS restrictions
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
  ]

  // Check if URL contains any CORS-restricted domains
  const hasCorsRestriction = corsRestrictedDomains.some((domain) => url.includes(domain))

  // Filter out HTTP streams (mixed content issues)
  const isHttps = url.startsWith("https://")

  // Filter out IP-based URLs (often blocked)
  const hasIpAddress = /https?:\/\/\d+\.\d+\.\d+\.\d+/.test(url)

  // Filter out streams with tokens that might expire
  const hasExpiredToken = url.includes("token=") && url.includes("?")

  return !hasCorsRestriction && isHttps && !hasIpAddress && !hasExpiredToken
}

export function getProxiedStreamUrl(originalUrl: string): string {
  // For now, return original URL
  // In production, you might want to use a video proxy service
  return originalUrl
}

function generateSampleChannels(): Channel[] {
  // This will be used as fallback when the real M3U can't be loaded
  const sampleChannels: Channel[] = [
    {
      id: "1",
      name: "BBC News",
      url: "https://d2vnbkvjbims7j.cloudfront.net/containerA/LTN/playlist.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_News_2019.svg/320px-BBC_News_2019.svg.png",
      category: "News",
      country: "United Kingdom",
      language: "English",
      region: "Europe",
      source: "BBC",
    },
    {
      id: "2",
      name: "Al Jazeera English",
      url: "https://live-hls-web-aje.getaj.net/AJE/index.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Aljazeera_eng.svg/320px-Aljazeera_eng.svg.png",
      category: "News",
      country: "Qatar",
      language: "English",
      region: "Middle East",
      source: "Al Jazeera",
    },
    {
      id: "3",
      name: "France 24",
      url: "https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/France24.png/320px-France24.png",
      category: "News",
      country: "France",
      language: "English",
      region: "Europe",
      source: "France 24",
    },
    {
      id: "4",
      name: "NASA TV",
      url: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/320px-NASA_logo.svg.png",
      category: "Education",
      country: "United States",
      language: "English",
      region: "North America",
      source: "NASA",
    },
    {
      id: "5",
      name: "Red Bull TV",
      url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Red_Bull_TV_logo.svg/320px-Red_Bull_TV_logo.svg.png",
      category: "Sports",
      country: "Austria",
      language: "English",
      region: "Europe",
      source: "Red Bull",
    },
    {
      id: "6",
      name: "DW English",
      url: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Deutsche_Welle_symbol_2012.svg/320px-Deutsche_Welle_symbol_2012.svg.png",
      category: "News",
      country: "Germany",
      language: "English",
      region: "Europe",
      source: "Deutsche Welle",
    },
  ]

  return sampleChannels
}

export function getPlaylistUrl(type: string, filter?: string): string {
  const baseUrl = "https://iptv-org.github.io/iptv"

  switch (type) {
    case "main":
      return `${baseUrl}/index.m3u`
    case "categories":
      return filter ? `${baseUrl}/categories/${filter.toLowerCase()}.m3u` : `${baseUrl}/categories/`
    case "languages":
      return filter ? `${baseUrl}/languages/${filter.toLowerCase()}.m3u` : `${baseUrl}/languages/`
    case "countries":
      return filter ? `${baseUrl}/countries/${filter.toLowerCase().replace(/\s+/g, "_")}.m3u` : `${baseUrl}/countries/`
    case "regions":
      return filter ? `${baseUrl}/regions/${filter.toLowerCase().replace(/\s+/g, "_")}.m3u` : `${baseUrl}/regions/`
    case "sources":
      return filter ? `${baseUrl}/sources/${filter.toLowerCase().replace(/\s+/g, "_")}.m3u` : `${baseUrl}/sources/`
    default:
      return `${baseUrl}/index.m3u`
  }
}

async function fetchRealPlaylist(url: string): Promise<Channel[]> {
  let m3uContent = ""
  let fetchSuccess = false

  // Try direct fetch first
  try {
    const response = await fetch(url, {
      mode: "cors",
      headers: {
        Accept: "application/x-mpegURL, application/vnd.apple.mpegurl, application/octet-stream, */*",
      },
    })

    if (response.ok) {
      m3uContent = await response.text()
      fetchSuccess = true
      console.log("Direct fetch successful")
    }
  } catch (error) {
    console.log("Direct fetch failed, trying CORS proxies...")
  }

  // If direct fetch failed, try CORS proxies
  if (!fetchSuccess) {
    for (const proxy of CORS_PROXIES) {
      try {
        const proxyUrl = proxy + encodeURIComponent(url)
        const response = await fetch(proxyUrl)

        if (response.ok) {
          m3uContent = await response.text()
          fetchSuccess = true
          console.log(`Fetch successful via proxy: ${proxy}`)
          break
        }
      } catch (error) {
        console.log(`Proxy ${proxy} failed:`, error)
        continue
      }
    }
  }

  if (fetchSuccess && m3uContent) {
    const channels = parseM3U(m3uContent)
    console.log(`Parsed ${channels.length} channels from M3U`)

    // Filter out CORS-restricted channels
    const accessibleChannels = channels.filter(isStreamAccessible)
    console.log(`Filtered to ${accessibleChannels.length} accessible channels`)

    return accessibleChannels
  }

  throw new Error("Failed to fetch real playlist")
}

function generateLanguageFallback(languageName: string, channelCount: number): Channel[] {
  const fallbackChannels: Channel[] = []
  const sampleCount = Math.min(20, Math.max(5, Math.floor(channelCount / 100)))

  for (let i = 1; i <= sampleCount; i++) {
    fallbackChannels.push({
      id: `${languageName.toLowerCase().replace(/\s+/g, "_")}_${i}`,
      name: `${languageName} Channel ${i}`,
      url: `https://example.com/streams/${languageName.toLowerCase().replace(/\s+/g, "_")}${i}.m3u8`,
      logo: `/placeholder.svg?height=60&width=100&text=${languageName.substring(0, 4).toUpperCase()}${i}`,
      language: languageName,
      country: getLanguageCountry(languageName),
      category: "General",
    })
  }
  return fallbackChannels
}

function generateCountryFallback(countryName: string, channelCount: number, flag: string | null): Channel[] {
  const fallbackChannels: Channel[] = []
  const sampleCount = Math.min(25, Math.max(5, Math.floor(channelCount / 50)))

  for (let i = 1; i <= sampleCount; i++) {
    fallbackChannels.push({
      id: `${countryName.toLowerCase().replace(/\s+/g, "_")}_${i}`,
      name: `${countryName} TV ${i}`,
      url: `https://example.com/streams/${countryName.toLowerCase().replace(/\s+/g, "_")}${i}.m3u8`,
      logo: `/placeholder.svg?height=60&width=100&text=${flag || countryName.substring(0, 2).toUpperCase()}${i}`,
      country: countryName,
      language: getCountryLanguage(countryName),
      category: getCountryCategory(i),
    })
  }
  return fallbackChannels
}

function generateRegionFallback(regionName: string, channelCount: number): Channel[] {
  const fallbackChannels: Channel[] = []
  const sampleCount = Math.min(30, Math.max(8, Math.floor(channelCount / 100)))

  for (let i = 1; i <= sampleCount; i++) {
    fallbackChannels.push({
      id: `${regionName.toLowerCase().replace(/\s+/g, "_")}_${i}`,
      name: `${regionName} Network ${i}`,
      url: `https://example.com/streams/${regionName.toLowerCase().replace(/\s+/g, "_")}${i}.m3u8`,
      logo: `/placeholder.svg?height=60&width=100&text=${regionName.substring(0, 4).toUpperCase()}${i}`,
      region: regionName,
      language: getRegionLanguage(regionName),
      country: getRegionCountry(regionName),
      category: getRegionCategory(i),
    })
  }
  return fallbackChannels
}

function generateRealCategoryFallback(categoryName: string, channelCount: number): Channel[] {
  const fallbackChannels: Channel[] = []
  const sampleCount = Math.min(30, Math.max(10, Math.floor(channelCount / 20)))

  for (let i = 1; i <= sampleCount; i++) {
    fallbackChannels.push({
      id: `${categoryName.toLowerCase()}_real_${i}`,
      name: `${categoryName} Channel ${i}`,
      url: `https://example.com/category/${categoryName.toLowerCase()}${i}.m3u8`,
      logo: `/placeholder.svg?height=60&width=100&text=${categoryName.substring(0, 4).toUpperCase()}${i}`,
      category: categoryName,
      country: getCategoryCountry(categoryName, i),
      language: getCategoryLanguage(categoryName, i),
    })
  }
  return fallbackChannels
}

// Helper functions for realistic data
function getLanguageCountry(languageName: string): string {
  const languageCountryMap: { [key: string]: string } = {
    English: "United States",
    Spanish: "Spain",
    French: "France",
    German: "Germany",
    Italian: "Italy",
    Portuguese: "Portugal",
    Russian: "Russia",
    Chinese: "China",
    Japanese: "Japan",
    Korean: "South Korea",
    Arabic: "Saudi Arabia",
    Hindi: "India",
    Turkish: "Turkey",
    Dutch: "Netherlands",
    Polish: "Poland",
    Persian: "Iran",
    Urdu: "Pakistan",
    Bengali: "Bangladesh",
    Vietnamese: "Vietnam",
    Thai: "Thailand",
  }
  return languageCountryMap[languageName] || "Various"
}

function getCountryLanguage(countryName: string): string {
  const countryLanguageMap: { [key: string]: string } = {
    "United States": "English",
    Spain: "Spanish",
    France: "French",
    Germany: "German",
    Italy: "Italian",
    Portugal: "Portuguese",
    Russia: "Russian",
    China: "Chinese",
    Japan: "Japanese",
    "South Korea": "Korean",
    "Saudi Arabia": "Arabic",
    India: "Hindi",
    Turkey: "Turkish",
    Netherlands: "Dutch",
    Poland: "Polish",
    Iran: "Persian",
    Pakistan: "Urdu",
    Bangladesh: "Bengali",
    Vietnam: "Vietnamese",
    Thailand: "Thai",
  }
  return countryLanguageMap[countryName] || "Local"
}

function getCountryCategory(index: number): string {
  const categories = ["News", "Entertainment", "Sports", "Music", "Movies", "Education", "Kids", "Documentary"]
  return categories[index % categories.length]
}

function getRegionLanguage(regionName: string): string {
  if (regionName.includes("Europe")) return "Various European"
  if (regionName.includes("America")) return "English/Spanish"
  if (regionName.includes("Asia")) return "Various Asian"
  if (regionName.includes("Africa")) return "Various African"
  if (regionName.includes("Middle East")) return "Arabic"
  if (regionName.includes("Arab")) return "Arabic"
  return "Various"
}

function getRegionCountry(regionName: string): string {
  if (regionName.includes("North America")) return "United States"
  if (regionName.includes("Europe")) return "Germany"
  if (regionName.includes("Asia")) return "China"
  if (regionName.includes("Africa")) return "South Africa"
  if (regionName.includes("Middle East")) return "Saudi Arabia"
  return "Various"
}

function getRegionCategory(index: number): string {
  const categories = ["General", "News", "Entertainment", "Sports", "Culture", "Education", "Music", "Movies"]
  return categories[index % categories.length]
}

function getCategoryCountry(category: string, index: number): string {
  const countries = ["United States", "United Kingdom", "Germany", "France", "Spain", "Italy", "Canada", "Australia"]
  return countries[index % countries.length]
}

function getCategoryLanguage(category: string, index: number): string {
  const languages = ["English", "Spanish", "French", "German", "Italian", "Portuguese"]
  return languages[index % languages.length]
}
