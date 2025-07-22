"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tv,
  Search,
  Play,
  Grid3X3,
  List,
  Globe,
  Languages,
  Folder,
  Radio,
  MapPin,
  Menu,
  Database,
} from "lucide-react"
import VideoPlayer from "./components/video-player"
import ChannelGrid from "./components/channel-grid"
import ChannelList from "./components/channel-list"
import CategoryBrowser from "./components/category-browser"
import LanguageBrowser from "./components/language-browser"
import CountryBrowser from "./components/country-browser"
import RegionBrowser from "./components/region-browser"
import { fetchPlaylist } from "./utils/m3u-parser"
import categoriesData from "../data/categories.json"
import languagesData from "../data/language.json"
import countriesData from "../data/countries.json"
import regionsData from "../data/region.json"

interface Channel {
  id: string
  name: string
  url: string
  logo?: string
  category?: string
  country?: string
  language?: string
  region?: string
  source?: string
}

interface Category {
  category: string
  channels: number
  playlist: string
}

interface Language {
  language_name: string
  channels: number
  playlist_url: string
}

interface Country {
  name: string
  flag: string | null
  channels: number
  playlist_url: string
  subdivisions: any[]
}

interface Region {
  region_name?: string
  name?: string
  channels: number
  playlist_url: string
}

const PLAYLIST_URLS = {
  main: "https://iptv-org.github.io/iptv/index.m3u",
  categories: "https://iptv-org.github.io/iptv/categories/",
  languages: "https://iptv-org.github.io/iptv/languages/",
  countries: "https://iptv-org.github.io/iptv/countries/",
  regions: "https://iptv-org.github.io/iptv/regions/",
  sources: "https://iptv-org.github.io/iptv/sources/", // TODO: Replace with valid source URL or implement SourceBrowser
}

const CHANNELS_PER_PAGE = 50
const INITIAL_LOAD_LIMIT = 100

export default function IPTVStreaming() {
  const [allChannels, setAllChannels] = useState<Channel[]>([])
  const [displayedChannels, setDisplayedChannels] = useState<Channel[]>([])
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedPlaylist, setSelectedPlaylist] = useState("main")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [loading, setLoading] = useState(true)
  const [totalChannels, setTotalChannels] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showCategoryBrowser, setShowCategoryBrowser] = useState(false)
  const [showLanguageBrowser, setShowLanguageBrowser] = useState(false)
  const [showCountryBrowser, setShowCountryBrowser] = useState(false)
  const [showRegionBrowser, setShowRegionBrowser] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const [categories] = useState<Category[]>(categoriesData)
  const [languages] = useState<Language[]>(languagesData)
  const [countries] = useState<Country[]>(countriesData)
  const [regions] = useState<Region[]>(regionsData)
  const [availableFilters, setAvailableFilters] = useState<string[]>(["all"])

  const playlistOptions = [
    { value: "main", label: "All Channels", icon: <Database className="w-4 h-4" /> },
    { value: "categories", label: "By Category", icon: <Folder className="w-4 h-4" /> },
    { value: "languages", label: "By Language", icon: <Languages className="w-4 h-4" /> },
    { value: "countries", label: "By Country", icon: <Globe className="w-4 h-4" /> },
    { value: "regions", label: "By Region", icon: <MapPin className="w-4 h-4" /> },
    { value: "sources", label: "By Source", icon: <Radio className="w-4 h-4" /> },
  ]

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Load playlist based on selection
  useEffect(() => {
    if (selectedCategory) {
      loadCategoryPlaylist(selectedCategory)
    } else if (selectedLanguage) {
      loadLanguagePlaylist(selectedLanguage)
    } else if (selectedCountry) {
      loadCountryPlaylist(selectedCountry)
    } else if (selectedRegion) {
      loadRegionPlaylist(selectedRegion)
    } else {
      loadPlaylist(selectedPlaylist)
    }
  }, [selectedPlaylist, selectedCategory, selectedLanguage, selectedCountry, selectedRegion])

  // Filter and paginate channels
  const filteredChannels = useMemo(() => {
    let filtered = allChannels
    if (debouncedSearchTerm) {
      filtered = filtered.filter((channel) =>
        channel.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    }
    if (selectedFilter !== "all") {
      filtered = filtered.filter((channel) => {
        switch (selectedPlaylist) {
          case "categories":
            return channel.category === selectedFilter
          case "languages":
            return channel.language === selectedFilter
          case "countries":
            return channel.country === selectedFilter
          case "regions":
            return channel.region === selectedFilter
          case "sources":
            return channel.source === selectedFilter
          default:
            return channel.category === selectedFilter
        }
      })
    }
    return filtered
  }, [allChannels, debouncedSearchTerm, selectedFilter, selectedPlaylist])

  useEffect(() => {
    setCurrentPage(1)
    setDisplayedChannels(filteredChannels.slice(0, CHANNELS_PER_PAGE))
  }, [filteredChannels])

  const resetState = () => {
    setSelectedCategory(null)
    setSelectedLanguage(null)
    setSelectedCountry(null)
    setSelectedRegion(null)
    setCurrentPage(1)
    setLoading(true)
  }

  const loadPlaylist = async (playlistType: string) => {
    resetState()
    try {
      switch (playlistType) {
        case "main":
          const channels = await fetchPlaylist(PLAYLIST_URLS.main)
          setAllChannels(channels)
          setDisplayedChannels(channels.slice(0, INITIAL_LOAD_LIMIT))
          setTotalChannels(37189) // Real total from iptv-org
          if (channels.length > 0) setCurrentChannel(channels[0])
          updateAvailableFilters(channels, playlistType)
          break
        case "categories":
          setShowCategoryBrowser(true)
          break
        case "languages":
          setShowLanguageBrowser(true)
          break
        case "countries":
          setShowCountryBrowser(true)
          break
        case "regions":
          setShowRegionBrowser(true)
          break
        case "sources":
          // TODO: Implement SourceBrowser or use valid source playlist URL
          console.warn("Sources playlist not implemented")
          setAllChannels([])
          setDisplayedChannels([])
          setTotalChannels(0)
          break
        default:
          throw new Error(`Unknown playlist type: ${playlistType}`)
      }
    } catch (error) {
      console.error(`Failed to load ${playlistType} playlist:`, error)
      alert(`Failed to load ${playlistType} playlist. Please try again later.`)
    } finally {
      setLoading(false)
    }
  }

  const loadCategoryPlaylist = async (category: Category) => {
    resetState()
    setSelectedCategory(category)
    try {
      const channels = await fetchPlaylist(category.playlist, "category", category.category)
      setAllChannels(channels)
      setDisplayedChannels(channels.slice(0, CHANNELS_PER_PAGE))
      setTotalChannels(category.channels)
      if (channels.length > 0) setCurrentChannel(channels[0])
      setAvailableFilters(["all"])
      setSelectedFilter("all")
    } catch (error) {
      console.error(`Failed to load ${category.category} playlist:`, error)
      alert(`Failed to load ${category.category} playlist. Using fallback data.`)
      const fallback = generateFallbackChannels("category", category.category, category.channels)
      setAllChannels(fallback)
      setDisplayedChannels(fallback.slice(0, CHANNELS_PER_PAGE))
      setTotalChannels(category.channels)
      if (fallback.length > 0) setCurrentChannel(fallback[0])
    } finally {
      setLoading(false)
    }
  }

  const loadLanguagePlaylist = async (language: Language) => {
    resetState()
    setSelectedLanguage(language)
    try {
      const channels = await fetchPlaylist(language.playlist_url, "language", language.language_name)
      setAllChannels(channels)
      setDisplayedChannels(channels.slice(0, CHANNELS_PER_PAGE))
      setTotalChannels(language.channels)
      if (channels.length > 0) setCurrentChannel(channels[0])
      setAvailableFilters(["all"])
      setSelectedFilter("all")
    } catch (error) {
      console.error(`Failed to load ${language.language_name} playlist:`, error)
      alert(`Failed to load ${language.language_name} playlist. Using fallback data.`)
      const fallback = generateFallbackChannels("language", language.language_name, language.channels)
      setAllChannels(fallback)
      setDisplayedChannels(fallback.slice(0, CHANNELS_PER_PAGE))
      setTotalChannels(language.channels)
      if (fallback.length > 0) setCurrentChannel(fallback[0])
    } finally {
      setLoading(false)
    }
  }

  const loadCountryPlaylist = async (country: Country) => {
    resetState()
    setSelectedCountry(country)
    try {
      const channels = await fetchPlaylist(country.playlist_url, "country", country.name)
      setAllChannels(channels)
      setDisplayedChannels(channels.slice(0, CHANNELS_PER_PAGE))
      setTotalChannels(country.channels)
      if (channels.length > 0) setCurrentChannel(channels[0])
      setAvailableFilters(["all"])
      setSelectedFilter("all")
    } catch (error) {
      console.error(`Failed to load ${country.name} playlist:`, error)
      alert(`Failed to load ${country.name} playlist. Using fallback data.`)
      const fallback = generateFallbackChannels("country", country.name, country.channels, country.flag)
      setAllChannels(fallback)
      setDisplayedChannels(fallback.slice(0, CHANNELS_PER_PAGE))
      setTotalChannels(country.channels)
      if (fallback.length > 0) setCurrentChannel(fallback[0])
    } finally {
      setLoading(false)
    }
  }

  const loadRegionPlaylist = async (region: Region) => {
    resetState()
    setSelectedRegion(region)
    const regionName = region.region_name || region.name || "Unknown Region"
    try {
      const channels = await fetchPlaylist(region.playlist_url, "region", regionName)
      setAllChannels(channels)
      setDisplayedChannels(channels.slice(0, CHANNELS_PER_PAGE))
      setTotalChannels(region.channels)
      if (channels.length > 0) setCurrentChannel(channels[0])
      setAvailableFilters(["all"])
      setSelectedFilter("all")
    } catch (error) {
      console.error(`Failed to load ${regionName} playlist:`, error)
      alert(`Failed to load ${regionName} playlist. Using fallback data.`)
      const fallback = generateFallbackChannels("region", regionName, region.channels)
      setAllChannels(fallback)
      setDisplayedChannels(fallback.slice(0, CHANNELS_PER_PAGE))
      setTotalChannels(region.channels)
      if (fallback.length > 0) setCurrentChannel(fallback[0])
    } finally {
      setLoading(false)
    }
  }

  const generateFallbackChannels = (
    type: "category" | "language" | "country" | "region",
    name: string,
    channelCount: number,
    flag?: string | null
  ): Channel[] => {
    const sampleCount = Math.min(30, Math.max(5, Math.floor(channelCount / 50)))
    const channels: Channel[] = []
    const prefix = name.toLowerCase().replace(/\s+/g, "_")

    for (let i = 1; i <= sampleCount; i++) {
      const channel: Channel = {
        id: `${prefix}_${i}`,
        name: `${name} Channel ${i}`,
        url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8", // Replace with valid .m3u8 URL
        logo: `/placeholder.svg?height=60&width=100&text=${(flag || name.substring(0, 4)).toUpperCase()}${i}`,
      }
      if (type === "category") channel.category = name
      if (type === "language") {
        channel.language = name
        channel.country = getLanguageCountry(name)
        channel.category = "General"
      }
      if (type === "country") {
        channel.country = name
        channel.language = getCountryLanguage(name)
        channel.category = getCountryCategory(i)
      }
      if (type === "region") {
        channel.region = name
        channel.country = getRegionCountry(name)
        channel.language = getRegionLanguage(name)
        channel.category = getRegionCategory(i)
      }
      channels.push(channel)
    }
    return channels
  }

  const getLanguageCountry = (language: string): string => {
    const map: { [key: string]: string } = {
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
    return map[language] || "Various"
  }

  const getCountryLanguage = (country: string): string => {
    const map: { [key: string]: string } = {
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
    return map[country] || "Local"
  }

  const getCountryCategory = (index: number): string => {
    const categories = ["News", "Entertainment", "Sports", "Music", "Movies", "Education", "Kids", "Documentary"]
    return categories[index % categories.length]
  }

  const getRegionLanguage = (region: string): string => {
    if (region.includes("Europe")) return "Various European"
    if (region.includes("America")) return "English/Spanish"
    if (region.includes("Asia")) return "Various Asian"
    if (region.includes("Africa")) return "Various African"
    if (region.includes("Middle East") || region.includes("Arab")) return "Arabic"
    return "Various"
  }

  const getRegionCountry = (region: string): string => {
    if (region.includes("North America")) return "United States"
    if (region.includes("Europe")) return "Germany"
    if (region.includes("Asia")) return "China"
    if (region.includes("Africa")) return "South Africa"
    if (region.includes("Middle East")) return "Saudi Arabia"
    return "Various"
  }

  const getRegionCategory = (index: number): string => {
    const categories = ["General", "News", "Entertainment", "Sports", "Culture", "Education", "Music", "Movies"]
    return categories[index % categories.length]
  }

  const updateAvailableFilters = (channels: Channel[], playlistType: string) => {
    const filters = new Set<string>(["all"])
    channels.forEach((channel) => {
      const key = playlistType === "languages" ? channel.language :
                  playlistType === "countries" ? channel.country :
                  playlistType === "regions" ? channel.region :
                  playlistType === "sources" ? channel.source :
                  channel.category
      if (key) filters.add(key)
    })
    setAvailableFilters(Array.from(filters))
  }

  const loadMoreChannels = useCallback(() => {
    if (loadingMore) return
    setLoadingMore(true)
    const nextPage = currentPage + 1
    const startIndex = (nextPage - 1) * CHANNELS_PER_PAGE
    const newChannels = filteredChannels.slice(startIndex, startIndex + CHANNELS_PER_PAGE)
    if (newChannels.length > 0) {
      setDisplayedChannels((prev) => [...prev, ...newChannels])
      setCurrentPage(nextPage)
    }
    setLoadingMore(false)
  }, [currentPage, filteredChannels, loadingMore])

  const handleChannelSelect = (channel: Channel) => setCurrentChannel(channel)
  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category)
    setShowCategoryBrowser(false)
  }
  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language)
    setShowLanguageBrowser(false)
  }
  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setShowCountryBrowser(false)
  }
  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region)
    setShowRegionBrowser(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-white text-center">
          <Tv className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-lg md:text-xl mb-2">Loading IPTV Channels...</p>
          <p className="text-gray-400 text-sm md:text-base">
            {selectedCategory ? `Loading ${selectedCategory.category} category` :
             selectedLanguage ? `Loading ${selectedLanguage.language_name} language` :
             selectedCountry ? `Loading ${selectedCountry.name} country` :
             selectedRegion ? `Loading ${selectedRegion.region_name || selectedRegion.name} region` :
             "Fetching from iptv-org repository"}
          </p>
        </div>
      </div>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <label className="text-sm font-medium text-gray-300 mb-2 block">Playlist Type</label>
        <Select
          value={selectedCategory ? "categories" :
                 selectedLanguage ? "languages" :
                 selectedCountry ? "countries" :
                 selectedRegion ? "regions" :
                 selectedPlaylist}
          onValueChange={(value) => {
            setSelectedFilter("all")
            if (value === "categories") setShowCategoryBrowser(true)
            else if (value === "languages") setShowLanguageBrowser(true)
            else if (value === "countries") setShowCountryBrowser(true)
            else if (value === "regions") setShowRegionBrowser(true)
            else setSelectedPlaylist(value)
          }}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {playlistOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-gray-300 hover:bg-gray-700">
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCategory && (
          <div className="mt-3 bg-gray-800 rounded-lg p-3 border border-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{selectedCategory.category}</p>
                <p className="text-xs text-gray-400">{selectedCategory.channels.toLocaleString()} channels</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCategoryBrowser(true)}
                className="text-red-400 hover:text-red-300"
              >
                Change
              </Button>
            </div>
          </div>
        )}

        {selectedLanguage && (
          <div className="mt-3 bg-gray-800 rounded-lg p-3 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{selectedLanguage.language_name}</p>
                <p className="text-xs text-gray-400">{selectedLanguage.channels.toLocaleString()} channels</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLanguageBrowser(true)}
                className="text-blue-400 hover:text-blue-300"
              >
                Change
              </Button>
            </div>
          </div>
        )}

        {selectedCountry && (
          <div className="mt-3 bg-gray-800 rounded-lg p-3 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{selectedCountry.name}</p>
                <p className="text-xs text-gray-400">{selectedCountry.channels.toLocaleString()} channels</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCountryBrowser(true)}
                className="text-green-400 hover:text-green-300"
              >
                Change
              </Button>
            </div>
          </div>
        )}

        {selectedRegion && (
          <div className="mt-3 bg-gray-800 rounded-lg p-3 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{selectedRegion.region_name || selectedRegion.name}</p>
                <p className="text-xs text-gray-400">{selectedRegion.channels.toLocaleString()} channels</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRegionBrowser(true)}
                className="text-purple-400 hover:text-purple-300"
              >
                Change
              </Button>
            </div>
          </div>
        )}

        {availableFilters.length > 1 && !selectedCategory && !selectedLanguage && !selectedCountry && !selectedRegion && (
          <div className="mt-3">
            <label className="text-sm font-medium text-gray-300 mb-2 block">Filter</label>
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                {availableFilters.map((filter) => (
                  <SelectItem key={filter} value={filter} className="text-gray-300 hover:bg-gray-700">
                    {filter === "all" ? "All" : filter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {viewMode === "grid" ? (
            <ChannelGrid
              channels={displayedChannels}
              currentChannel={currentChannel}
              onChannelSelect={handleChannelSelect}
              onLoadMore={loadMoreChannels}
              hasMore={displayedChannels.length < filteredChannels.length}
              loading={loadingMore}
            />
          ) : (
            <ChannelList
              channels={displayedChannels}
              currentChannel={currentChannel}
              onChannelSelect={handleChannelSelect}
              onLoadMore={loadMoreChannels}
              hasMore={displayedChannels.length < filteredChannels.length}
              loading={loadingMore}
            />
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-400">
          Showing {displayedChannels.length} of {filteredChannels.length.toLocaleString()} channels
        </p>
        <p className="text-xs text-gray-500 mt-1">Powered by iptv-org</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <Sheet open={showCategoryBrowser} onOpenChange={setShowCategoryBrowser}>
        <SheetContent side="right" className="w-full sm:w-96 bg-gray-900 border-gray-800 p-0">
          <SheetHeader className="p-4 border-b border-gray-800">
            <SheetTitle className="text-white">Browse Categories</SheetTitle>
          </SheetHeader>
          <CategoryBrowser categories={categories} onCategorySelect={handleCategorySelect} />
        </SheetContent>
      </Sheet>

      <Sheet open={showLanguageBrowser} onOpenChange={setShowLanguageBrowser}>
        <SheetContent side="right" className="w-full sm:w-96 bg-gray-900 border-gray-800 p-0">
          <SheetHeader className="p-4 border-b border-gray-800">
            <SheetTitle className="text-white">Browse Languages</SheetTitle>
          </SheetHeader>
          <LanguageBrowser languages={languages} onLanguageSelect={handleLanguageSelect} />
        </SheetContent>
      </Sheet>

      <Sheet open={showCountryBrowser} onOpenChange={setShowCountryBrowser}>
        <SheetContent side="right" className="w-full sm:w-96 bg-gray-900 border-gray-800 p-0">
          <SheetHeader className="p-4 border-b border-gray-800">
            <SheetTitle className="text-white">Browse Countries</SheetTitle>
          </SheetHeader>
          <CountryBrowser countries={countries} onCountrySelect={handleCountrySelect} />
        </SheetContent>
      </Sheet>

      <Sheet open={showRegionBrowser} onOpenChange={setShowRegionBrowser}>
        <SheetContent side="right" className="w-full sm:w-96 bg-gray-900 border-gray-800 p-0">
          <SheetHeader className="p-4 border-b border-gray-800">
            <SheetTitle className="text-white">Browse Regions</SheetTitle>
          </SheetHeader>
          <RegionBrowser regions={regions} onRegionSelect={handleRegionSelect} />
        </SheetContent>
      </Sheet>

      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                <Tv className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold">IPTV Stream</h1>
                <p className="text-xs text-white hidden sm:block">
                  {selectedCategory ? selectedCategory.category :
                   selectedLanguage ? selectedLanguage.language_name :
                   selectedCountry ? selectedCountry.name :
                   selectedRegion ? selectedRegion.region_name || selectedRegion.name :
                   `${totalChannels.toLocaleString()} channels`} • iptv-org
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
                className="md:hidden"
              >
                <Search className="w-4 h-4" />
              </Button>

              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white" />
                <Input
                  placeholder="Search channels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white w-64"
                />
              </div>

              <div className="hidden md:flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-96 bg-gray-900 border-gray-800 p-0">
                  <SheetHeader className="p-4 border-b border-gray-800">
                    <SheetTitle className="text-white flex items-center justify-between">
                      Channels
                      <div className="flex gap-2">
                        <Button
                          variant={viewMode === "grid" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("list")}
                        >
                          <List className="w-4 h-4" />
                        </Button>
                      </div>
                    </SheetTitle>
                  </SheetHeader>
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {showSearch && (
            <div className="mt-3 md:hidden">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search channels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white w-full"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-80px)]">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-black relative">
            {currentChannel && (
              <VideoPlayer
                src={currentChannel.url}
                title={currentChannel.name}
                poster={currentChannel.logo}
              />
            )}
          </div>

          {currentChannel && (
            <div className="bg-gray-900 p-3 md:p-4 border-t border-gray-800">
              <div className="flex items-center gap-3 md:gap-4">
                <img
                  src={currentChannel.logo || "/placeholder.svg"}
                  alt={currentChannel.name}
                  className="w-12 h-8 md:w-16 md:h-10 object-contain bg-gray-800 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg?height=60&width=100&text=TV"
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg md:text-xl font-bold truncate">{currentChannel.name}</h2>
                  <div className="flex gap-1 md:gap-2 mt-1 flex-wrap">
                    {currentChannel.category && (
                      <Badge variant="secondary" className="text-xs">{currentChannel.category}</Badge>
                    )}
                    {currentChannel.country && (
                      <Badge variant="outline" className="text-gray-300 text-xs hidden sm:flex">
                        <Globe className="w-3 h-3 mr-1" />
                        {currentChannel.country}
                      </Badge>
                    )}
                    {currentChannel.language && (
                      <Badge variant="outline" className="text-gray-300 text-xs hidden md:flex">
                        <Languages className="w-3 h-3 mr-1" />
                        {currentChannel.language}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button className="bg-red-600 hover:bg-red-700 text-xs md:text-sm px-3 md:px-4">
                  <Play className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Live
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex w-96 bg-gray-900 border-l border-gray-800 flex-col">
          <SidebarContent />
        </div>
      </div>
    </div>
  )
}