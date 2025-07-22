"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Loader2 } from "lucide-react"

interface Channel {
  id: string
  name: string
  url: string
  logo?: string
  category?: string
  country?: string
  language?: string
}

interface ChannelGridProps {
  channels: Channel[]
  currentChannel: Channel | null
  onChannelSelect: (channel: Channel) => void
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
}

export default function ChannelGrid({
  channels,
  currentChannel,
  onChannelSelect,
  onLoadMore,
  hasMore = false,
  loading = false,
}: ChannelGridProps) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {channels.map((channel) => (
          <Card
            key={channel.id}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 bg-gray-800 border-gray-700 hover:border-red-500 touch-manipulation ${
              currentChannel?.id === channel.id ? "ring-2 ring-red-500 bg-red-900/20" : ""
            }`}
            onClick={() => onChannelSelect(channel)}
          >
            <CardContent className="p-3">
              <div className="relative mb-2">
                <img
                  src={channel.logo || "/placeholder.svg?height=60&width=100&text=TV"}
                  alt={channel.name}
                  className="w-full h-12 sm:h-16 object-contain bg-gray-900 rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=60&width=100&text=TV"
                  }}
                  loading="lazy"
                />
                {currentChannel?.id === channel.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium text-white truncate mb-1">{channel.name}</h3>
              <div className="flex gap-1 mb-1 flex-wrap">
                {channel.category && (
                  <Badge variant="secondary" className="text-xs">
                    {channel.category}
                  </Badge>
                )}
              </div>
              {channel.country && <p className="text-xs text-gray-400 truncate">{channel.country}</p>}
            </CardContent>
          </Card>
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
