"use client"

import { useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Globe, Languages, Loader2 } from "lucide-react"

interface Channel {
  id: string
  name: string
  url: string
  logo?: string
  category?: string
  country?: string
  language?: string
}

interface ChannelListProps {
  channels: Channel[]
  currentChannel: Channel | null
  onChannelSelect: (channel: Channel) => void
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
}

export default function ChannelList({
  channels,
  currentChannel,
  onChannelSelect,
  onLoadMore,
  hasMore = false,
  loading = false,
}: ChannelListProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore || loading || !onLoadMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 0.1 },
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, onLoadMore])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-800 active:bg-gray-700 touch-manipulation ${
              currentChannel?.id === channel.id ? "bg-red-900/20 border border-red-500" : "bg-gray-800/50"
            }`}
            onClick={() => onChannelSelect(channel)}
          >
            <div className="relative flex-shrink-0">
              <img
                src={channel.logo || "/placeholder.svg?height=60&width=100&text=TV"}
                alt={channel.name}
                className="w-10 h-6 sm:w-12 sm:h-8 object-contain bg-gray-900 rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=60&width=100&text=TV"
                }}
                loading="lazy"
              />
              {currentChannel?.id === channel.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                  <Play className="w-3 h-3 text-red-500" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-white truncate">{channel.name}</h3>
              <div className="flex gap-1 mt-1 flex-wrap">
                {channel.category && (
                  <Badge variant="secondary" className="text-xs">
                    {channel.category}
                  </Badge>
                )}
              </div>
            </div>

            <div className="hidden sm:flex flex-col gap-1 text-xs text-gray-400 flex-shrink-0">
              {channel.country && (
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span className="truncate max-w-20">{channel.country}</span>
                </div>
              )}
              {channel.language && (
                <div className="flex items-center gap-1">
                  <Languages className="w-3 h-3" />
                  <span className="truncate max-w-20">{channel.language}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading more channels...</span>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={onLoadMore}
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              Load More Channels
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
