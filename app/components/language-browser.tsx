"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Play } from "lucide-react"

interface Language {
  language_name: string
  channels: number
  playlist_url: string
}

interface LanguageBrowserProps {
  languages: Language[]
  onLanguageSelect: (language: Language) => void
}

export default function LanguageBrowser({ languages, onLanguageSelect }: LanguageBrowserProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredLanguages = languages.filter((language) =>
    language.language_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedLanguages = filteredLanguages.sort((a, b) => b.channels - a.channels)

  const getLanguageIcon = (languageName: string) => {
    const name = languageName.toLowerCase()
    if (name.includes("english")) return "🇬🇧"
    if (name.includes("spanish")) return "🇪🇸"
    if (name.includes("french")) return "🇫🇷"
    if (name.includes("german")) return "🇩🇪"
    if (name.includes("italian")) return "🇮🇹"
    if (name.includes("portuguese")) return "🇵🇹"
    if (name.includes("russian")) return "🇷🇺"
    if (name.includes("chinese")) return "🇨🇳"
    if (name.includes("japanese")) return "🇯🇵"
    if (name.includes("korean")) return "🇰🇷"
    if (name.includes("arabic")) return "🇸🇦"
    if (name.includes("hindi")) return "🇮🇳"
    if (name.includes("turkish")) return "🇹🇷"
    if (name.includes("dutch")) return "🇳🇱"
    if (name.includes("polish")) return "🇵🇱"
    if (name.includes("persian")) return "🇮🇷"
    if (name.includes("urdu")) return "🇵🇰"
    if (name.includes("bengali")) return "🇧🇩"
    if (name.includes("vietnamese")) return "🇻🇳"
    if (name.includes("thai")) return "🇹🇭"
    return "🌐"
  }

  const getChannelColor = (channels: number) => {
    if (channels > 1000) return "bg-red-500"
    if (channels > 500) return "bg-orange-500"
    if (channels > 200) return "bg-yellow-500"
    if (channels > 100) return "bg-green-500"
    if (channels > 50) return "bg-blue-500"
    return "bg-gray-500"
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search languages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>

      {/* Languages List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {sortedLanguages.map((language) => (
            <div
              key={language.language_name}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-800 active:bg-gray-700 bg-gray-800/50 touch-manipulation"
              onClick={() => onLanguageSelect(language)}
            >
              <div className="text-2xl flex-shrink-0">{getLanguageIcon(language.language_name)}</div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">{language.language_name}</h3>
                <p className="text-xs text-gray-400">{language.channels.toLocaleString()} channels</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`w-3 h-3 rounded-full ${getChannelColor(language.channels)}`}
                  title={`${language.channels} channels`}
                />
                <Play className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Stats */}
      <div className="p-4 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-400">
          {filteredLanguages.length} languages •{" "}
          {filteredLanguages.reduce((sum, lang) => sum + lang.channels, 0).toLocaleString()} total channels
        </p>
      </div>
    </div>
  )
}
