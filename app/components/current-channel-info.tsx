import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Languages, Play } from "lucide-react";
import type { Channel } from "@/interface/interface";

export default function CurrentChannelInfo({
  currentChannel,
}: {
  currentChannel: Channel;
}) {
  return (
    <div className="bg-gray-900 p-3 md:p-4 border-t border-gray-800">
      <div className="flex items-center gap-3 md:gap-4">
        <img
          src={currentChannel.logo || "/placeholder.svg"}
          alt={currentChannel.name}
          className="w-12 h-8 md:w-16 md:h-10 object-contain bg-gray-800 rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "/placeholder.svg?height=60&width=100&text=TV";
          }}
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-bold truncate">
            {currentChannel.name}
          </h2>
          <div className="flex gap-1 md:gap-2 mt-1 flex-wrap">
            {currentChannel.category && (
              <Badge variant="secondary" className="text-xs">
                {currentChannel.category}
              </Badge>
            )}
            {currentChannel.country && (
              <Badge
                variant="outline"
                className="text-gray-300 text-xs hidden sm:flex"
              >
                <Globe className="w-3 h-3 mr-1" />
                {currentChannel.country}
              </Badge>
            )}
            {currentChannel.language && (
              <Badge
                variant="outline"
                className="text-gray-300 text-xs hidden md:flex"
              >
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
  );
}
