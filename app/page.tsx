"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
} from "lucide-react";
import VideoPlayer from "./components/video-player";
import ChannelGrid from "./components/channel-grid";
import ChannelList from "./components/channel-list";
import CategoryBrowser from "./components/category-browser";
import LanguageBrowser from "./components/language-browser";
import CountryBrowser from "./components/country-browser";
import RegionBrowser from "./components/region-browser";
import { fetchPlaylist, getProxiedStreamUrl } from "./utils/m3u-parser";
import categoriesData from "../data/categories.json";
import languagesData from "../data/language.json";
import countriesData from "../data/countries.json";
import regionsData from "../data/region.json";
import {
  Category,
  Channel,
  Country,
  Language,
  Region,
} from "@/interface/interface";
import { PLAYLIST_URLS } from "./utils/playlist";
import CurrentChannelInfo from "./components/current-channel-info";

type PlaylistType =
  | "main"
  | "categories"
  | "languages"
  | "countries"
  | "regions"
  | "sources";

const CHANNELS_PER_PAGE = 50;
const INITIAL_LOAD_LIMIT = 50;

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

export default function IPTVStreaming() {
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [displayedChannels, setDisplayedChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<PlaylistType>("main");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null
  );
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [totalChannels, setTotalChannels] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCategoryBrowser, setShowCategoryBrowser] = useState(false);
  const [showLanguageBrowser, setShowLanguageBrowser] = useState(false);
  const [showCountryBrowser, setShowCountryBrowser] = useState(false);
  const [showRegionBrowser, setShowRegionBrowser] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [categories] = useState<Category[]>(categoriesData);
  const [languages] = useState<Language[]>(languagesData);
  const [countries] = useState<Country[]>(countriesData);
  const [regions] = useState<Region[]>(regionsData);
  const [availableFilters, setAvailableFilters] = useState<string[]>(["all"]);

  const playlistOptions = useMemo(
    () => [
      {
        value: "main",
        label: "All Channels",
        icon: <Database className="w-4 h-4" />,
      },
      {
        value: "categories",
        label: "By Category",
        icon: <Folder className="w-4 h-4" />,
      },
      {
        value: "languages",
        label: "By Language",
        icon: <Languages className="w-4 h-4" />,
      },
      {
        value: "countries",
        label: "By Country",
        icon: <Globe className="w-4 h-4" />,
      },
      {
        value: "regions",
        label: "By Region",
        icon: <MapPin className="w-4 h-4" />,
      },
      {
        value: "sources",
        label: "By Source",
        icon: <Radio className="w-4 h-4" />,
      },
    ],
    []
  );

  const filteredChannels = useMemo(() => {
    let filtered = allChannels;
    if (debouncedSearchTerm) {
      filtered = filtered.filter((channel) =>
        channel.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    if (selectedFilter !== "all") {
      filtered = filtered.filter((channel) => {
        switch (selectedPlaylist) {
          case "categories":
            return channel.category === selectedFilter;
          case "languages":
            return channel.language === selectedFilter;
          case "countries":
            return channel.country === selectedFilter;
          case "regions":
            return channel.region === selectedFilter;
          case "sources":
            return channel.source === selectedFilter;
          default:
            return channel.category === selectedFilter;
        }
      });
    }
    return filtered;
  }, [allChannels, debouncedSearchTerm, selectedFilter, selectedPlaylist]);

  useEffect(() => {
    setCurrentPage(1);
    setDisplayedChannels(filteredChannels.slice(0, CHANNELS_PER_PAGE));
  }, [filteredChannels]);

  const resetState = useCallback(() => {
    setSelectedCategory(null);
    setSelectedLanguage(null);
    setSelectedCountry(null);
    setSelectedRegion(null);
    setSelectedFilter("all"); // Reset filter to ensure compatibility with new playlist
    setCurrentPage(1);
    setLoading(true);
    setAllChannels([]); // Clear channels to prevent stale data
    setDisplayedChannels([]);
    setTotalChannels(0);
  }, []);

  const loadPlaylist = useCallback(
    async (playlistType: PlaylistType) => {
      resetState();
      try {
        switch (playlistType) {
          case "main":
            const channels = await fetchPlaylist(PLAYLIST_URLS.main);
            setAllChannels(channels);
            setDisplayedChannels(channels.slice(0, INITIAL_LOAD_LIMIT));
            setTotalChannels(37189);
            if (channels.length > 0) setCurrentChannel(channels[0]);
            updateAvailableFilters(channels, playlistType);
            break;
          case "categories":
            setShowCategoryBrowser(true);
            break;
          case "languages":
            setShowLanguageBrowser(true);
            break;
          case "countries":
            setShowCountryBrowser(true);
            break;
          case "regions":
            setShowRegionBrowser(true);
            break;
          case "sources":
            console.warn("Sources playlist not implemented");
            setAllChannels([]);
            setDisplayedChannels([]);
            setTotalChannels(0);
            break;
          default:
            throw new Error(`Unknown playlist type: ${playlistType}`);
        }
      } catch (error) {
        console.error(`Failed to load ${playlistType} playlist:`, error);
        alert(
          `Failed to load ${playlistType} playlist. Please try again later.`
        );
      } finally {
        setLoading(false);
      }
    },
    [resetState]
  );

  const loadCategoryPlaylist = useCallback(
    async (category: Category) => {
      resetState();
      setSelectedCategory(category);
      try {
        const channels = await fetchPlaylist(category.playlist);
        setAllChannels(channels);
        setDisplayedChannels(channels.slice(0, CHANNELS_PER_PAGE));
        setTotalChannels(category.channels);
        if (channels.length > 0) setCurrentChannel(channels[0]);
        setAvailableFilters(["all"]);
      } catch (error) {
        console.error(`Failed to load ${category.category} playlist:`, error);
        alert(
          `Failed to load ${category.category} playlist. Using fallback data.`
        );
      } finally {
        setLoading(false);
      }
    },
    [resetState]
  );

  const loadLanguagePlaylist = useCallback(
    async (language: Language) => {
      resetState();
      setSelectedLanguage(language);
      try {
        const channels = await fetchPlaylist(language.playlist_url);
        setAllChannels(channels);
        setDisplayedChannels(channels.slice(0, CHANNELS_PER_PAGE));
        setTotalChannels(language.channels);
        if (channels.length > 0) setCurrentChannel(channels[0]);
        setAvailableFilters(["all"]);
      } catch (error) {
        console.error(
          `Failed to load ${language.language_name} playlist:`,
          error
        );
        alert(
          `Failed to load ${language.language_name} playlist. Using fallback data.`
        );
      } finally {
        setLoading(false);
      }
    },
    [resetState]
  );

  const loadCountryPlaylist = useCallback(
    async (country: Country) => {
      resetState();
      setSelectedCountry(country);
      try {
        const channels = await fetchPlaylist(country.playlist_url);
        setAllChannels(channels);
        setDisplayedChannels(channels.slice(0, CHANNELS_PER_PAGE));
        setTotalChannels(country.channels);
        if (channels.length > 0) setCurrentChannel(channels[0]);
        setAvailableFilters(["all"]);
      } catch (error) {
        console.error(`Failed to load ${country.name} playlist:`, error);
        alert(`Failed to load ${country.name} playlist. Using fallback data.`);
      } finally {
        setLoading(false);
      }
    },
    [resetState]
  );

  const loadRegionPlaylist = useCallback(
    async (region: Region) => {
      resetState();
      setSelectedRegion(region);
      const regionName = region.region_name || region.name || "Unknown Region";
      try {
        const channels = await fetchPlaylist(region.playlist_url);
        setAllChannels(channels);
        setDisplayedChannels(channels.slice(0, CHANNELS_PER_PAGE));
        setTotalChannels(region.channels);
        if (channels.length > 0) setCurrentChannel(channels[0]);
        setAvailableFilters(["all"]);
      } catch (error) {
        console.error(`Failed to load ${regionName} playlist:`, error);
        alert(`Failed to load ${regionName} playlist. Using fallback data.`);
      } finally {
        setLoading(false);
      }
    },
    [resetState]
  );

  const updateAvailableFilters = useCallback(
    (channels: Channel[], playlistType: PlaylistType) => {
      const filters = new Set<string>(["all"]);
      channels.forEach((channel) => {
        const key =
          playlistType === "languages"
            ? channel.language
            : playlistType === "countries"
            ? channel.country
            : playlistType === "regions"
            ? channel.region
            : playlistType === "sources"
            ? channel.source
            : channel.category;
        if (key) filters.add(key);
      });
      setAvailableFilters(Array.from(filters));
    },
    []
  );

  const loadMoreChannels = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * CHANNELS_PER_PAGE;
    const newChannels = filteredChannels.slice(
      startIndex,
      startIndex + CHANNELS_PER_PAGE
    );
    if (newChannels.length > 0) {
      setDisplayedChannels((prev) => [...prev, ...newChannels]);
      setCurrentPage(nextPage);
    }
    setLoadingMore(false);
  }, [currentPage, filteredChannels, loadingMore]);

  const handleChannelSelect = useCallback(
    (channel: Channel) => setCurrentChannel(channel),
    []
  );

  const handleCategorySelect = useCallback(
    (category: Category) => {
      setSelectedCategory(category);
      setSelectedLanguage(null);
      setSelectedCountry(null);
      setSelectedRegion(null);
      setSelectedPlaylist("categories");
      setShowCategoryBrowser(false);
      loadCategoryPlaylist(category); // Load immediately
    },
    [loadCategoryPlaylist]
  );

  const handleLanguageSelect = useCallback(
    (language: Language) => {
      setSelectedLanguage(language);
      setSelectedCategory(null);
      setSelectedCountry(null);
      setSelectedRegion(null);
      setSelectedPlaylist("languages");
      setShowLanguageBrowser(false);
      loadLanguagePlaylist(language); // Load immediately
    },
    [loadLanguagePlaylist]
  );

  const handleCountrySelect = useCallback(
    (country: Country) => {
      setSelectedCountry(country);
      setSelectedCategory(null);
      setSelectedLanguage(null);
      setSelectedRegion(null);
      setSelectedPlaylist("countries");
      setShowCountryBrowser(false);
      loadCountryPlaylist(country); // Load immediately
    },
    [loadCountryPlaylist]
  );

  const handleRegionSelect = useCallback(
    (region: Region) => {
      setSelectedRegion(region);
      setSelectedCategory(null);
      setSelectedLanguage(null);
      setSelectedCountry(null);
      setSelectedPlaylist("regions");
      setShowRegionBrowser(false);
      loadRegionPlaylist(region); // Load immediately
    },
    [loadRegionPlaylist]
  );

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryPlaylist(selectedCategory);
    } else if (selectedLanguage) {
      loadLanguagePlaylist(selectedLanguage);
    } else if (selectedCountry) {
      loadCountryPlaylist(selectedCountry);
    } else if (selectedRegion) {
      loadRegionPlaylist(selectedRegion);
    } else {
      loadPlaylist(selectedPlaylist);
    }
  }, [
    selectedPlaylist,
    selectedCategory,
    selectedLanguage,
    selectedCountry,
    selectedRegion,
    loadPlaylist,
    loadCategoryPlaylist,
    loadLanguagePlaylist,
    loadCountryPlaylist,
    loadRegionPlaylist,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-white text-center">
          <Tv className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-lg md:text-xl mb-2">Loading IPTV Channels...</p>
          <p className="text-gray-400 text-sm md:text-base">
            {selectedCategory
              ? `Loading ${selectedCategory.category} category`
              : selectedLanguage
              ? `Loading ${selectedLanguage.language_name} language`
              : selectedCountry
              ? `Loading ${selectedCountry.name} country`
              : selectedRegion
              ? `Loading ${
                  selectedRegion.region_name || selectedRegion.name
                } region`
              : "Fetching from iptv-org repository"}
          </p>
        </div>
      </div>
    );
  }

  const SidebarContent = () => {
    const playlistValue = selectedCategory
      ? "categories"
      : selectedLanguage
      ? "languages"
      : selectedCountry
      ? "countries"
      : selectedRegion
      ? "regions"
      : selectedPlaylist;

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-800">
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Playlist Type
          </label>
          <Select
            value={playlistValue}
            onValueChange={(value: PlaylistType) => {
              setSelectedFilter("all"); // Reset filter when changing playlist type
              setSelectedPlaylist(value);
              if (value === "categories") setShowCategoryBrowser(true);
              else if (value === "languages") setShowLanguageBrowser(true);
              else if (value === "countries") setShowCountryBrowser(true);
              else if (value === "regions") setShowRegionBrowser(true);
              else loadPlaylist(value); // Load immediately for non-browser playlists
            }}
          >
            <SelectTrigger className="bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {playlistOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-gray-300 hover:bg-gray-700"
                >
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
                  <p className="text-sm font-medium text-white">
                    {selectedCategory.category}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedCategory.channels.toLocaleString()} channels
                  </p>
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
                  <p className="text-sm font-medium text-white">
                    {selectedLanguage.language_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedLanguage.channels.toLocaleString()} channels
                  </p>
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
                  <p className="text-sm font-medium text-white">
                    {selectedCountry.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedCountry.channels.toLocaleString()} channels
                  </p>
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
                  <p className="text-sm font-medium text-white">
                    {selectedRegion.region_name || selectedRegion.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedRegion.channels.toLocaleString()} channels
                  </p>
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
          {availableFilters.length > 1 &&
            !selectedCategory &&
            !selectedLanguage &&
            !selectedCountry &&
            !selectedRegion && (
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Filter
                </label>
                <Select
                  value={selectedFilter}
                  onValueChange={setSelectedFilter}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                    {availableFilters.map((filter) => (
                      <SelectItem
                        key={filter}
                        value={filter}
                        className="text-gray-300 hover:bg-gray-700"
                      >
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
            Showing {displayedChannels.length} of{" "}
            {filteredChannels.length.toLocaleString()} channels
          </p>
          <p className="text-xs text-gray-500 mt-1">Powered by iptv-org</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Sheet open={showCategoryBrowser} onOpenChange={setShowCategoryBrowser}>
        <SheetContent
          side="right"
          className="w-full sm:w-96 bg-gray-900 border-gray-800 p-0"
        >
          <SheetHeader className="p-4 border-b border-gray-800">
            <SheetTitle className="text-white">Browse Categories</SheetTitle>
          </SheetHeader>
          <CategoryBrowser
            categories={categories}
            onCategorySelect={handleCategorySelect}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={showLanguageBrowser} onOpenChange={setShowLanguageBrowser}>
        <SheetContent
          side="right"
          className="w-full sm:w-96 bg-gray-900 border-gray-800 p-0"
        >
          <SheetHeader className="p-4 border-b border-gray-800">
            <SheetTitle className="text-white">Browse Languages</SheetTitle>
          </SheetHeader>
          <LanguageBrowser
            languages={languages}
            onLanguageSelect={handleLanguageSelect}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={showCountryBrowser} onOpenChange={setShowCountryBrowser}>
        <SheetContent
          side="right"
          className="w-full sm:w-96 bg-gray-900 border-gray-800 p-0"
        >
          <SheetHeader className="p-4 border-b border-gray-800">
            <SheetTitle className="text-white">Browse Countries</SheetTitle>
          </SheetHeader>
          <CountryBrowser
            countries={countries}
            onCountrySelect={handleCountrySelect}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={showRegionBrowser} onOpenChange={setShowRegionBrowser}>
        <SheetContent
          side="right"
          className="w-full sm:w-96 bg-gray-900 border-gray-800 p-0"
        >
          <SheetHeader className="p-4 border-b border-gray-800">
            <SheetTitle className="text-white">Browse Regions</SheetTitle>
          </SheetHeader>
          <RegionBrowser
            regions={regions}
            onRegionSelect={handleRegionSelect}
          />
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
                  {selectedCategory
                    ? selectedCategory.category
                    : selectedLanguage
                    ? selectedLanguage.language_name
                    : selectedCountry
                    ? selectedCountry.name
                    : selectedRegion
                    ? selectedRegion.region_name || selectedRegion.name
                    : `${totalChannels.toLocaleString()} channels`}{" "}
                  • iptv-org
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
                <SheetContent
                  side="right"
                  className="w-full sm:w-96 bg-gray-900 border-gray-800 p-0"
                >
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
                src={getProxiedStreamUrl(currentChannel.url)}
                title={currentChannel.name}
                poster={currentChannel.logo}
              />
            )}
          </div>

          {currentChannel && (
            <CurrentChannelInfo currentChannel={currentChannel} />
          )}
        </div>

        <div className="hidden md:flex w-96 bg-gray-900 border-l border-gray-800 flex-col">
          <SidebarContent />
        </div>
      </div>
    </div>
  );
}
