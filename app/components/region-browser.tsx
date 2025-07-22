"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Play } from "lucide-react"

interface Region {
  region_name?: string
  name?: string
  channels: number
  playlist_url: string
}

interface RegionBrowserProps {
  regions: Region[]
  onRegionSelect: (region: Region) => void
}

export default function RegionBrowser({ regions, onRegionSelect }: RegionBrowserProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredRegions = regions.filter((region) => {
    const regionName = region.region_name || region.name || ""
    return regionName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const sortedRegions = filteredRegions.sort((a, b) => b.channels - a.channels)

  const getRegionIcon = (regionName: string) => {
    if (!regionName) return "🗺️"
    const name = regionName.toLowerCase()
    if (name.includes("europe")) return "🇪🇺"
    if (name.includes("america") || name.includes("north america")) return "🌎"
    if (name.includes("asia")) return "🌏"
    if (name.includes("africa")) return "🌍"
    if (name.includes("oceania")) return "🇦🇺"
    if (name.includes("middle east")) return "🕌"
    if (name.includes("caribbean")) return "🏝️"
    if (name.includes("nordic")) return "❄️"
    if (name.includes("balkan")) return "⛰️"
    if (name.includes("arab")) return "🕌"
    if (name.includes("latin")) return "🌮"
    if (name.includes("gulf")) return "🏜️"
    if (name.includes("maghreb")) return "🐪"
    if (name.includes("worldwide") || name.includes("international")) return "🌐"
    return "🗺️"
  }

  const getChannelColor = (channels: number) => {
    if (channels > 2000) return "bg-red-500"
    if (channels > 1000) return "bg-orange-500"
    if (channels > 500) return "bg-yellow-500"
    if (channels > 200) return "bg-green-500"
    if (channels > 100) return "bg-blue-500"
    return "bg-gray-500"
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search regions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>

      {/* Regions List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {sortedRegions.map((region) => {
            const regionName = region.region_name || region.name || "Unknown Region"
            return (
              <div
                key={regionName}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-800 active:bg-gray-700 bg-gray-800/50 touch-manipulation"
                onClick={() => onRegionSelect(region)}
              >
                <div className="text-2xl flex-shrink-0">{getRegionIcon(regionName)}</div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{regionName}</h3>
                  <p className="text-xs text-gray-400">{region.channels.toLocaleString()} channels</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`w-3 h-3 rounded-full ${getChannelColor(region.channels)}`}
                    title={`${region.channels} channels`}
                  />
                  <Play className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Stats */}
      <div className="p-4 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-400">
          {filteredRegions.length} regions •{" "}
          {filteredRegions.reduce((sum, region) => sum + region.channels, 0).toLocaleString()} total channels
        </p>
      </div>
    </div>
  )
}
