"use client";

import { useState, useMemo, JSX } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FaNewspaper,
  FaFootballBall,
  FaMusic,
  FaFilm,
  FaChild,
  FaBook,
  FaTheaterMasks,
  FaPray,
  FaUtensils,
  FaPlane,
  FaCloudSun,
  FaBriefcase,
  FaFlask,
  FaCar,
  FaUsers,
  FaShoppingCart,
  FaPaintBrush,
  FaVideo,
  FaTv,
  FaGlobe,
  FaLaugh,
  FaUniversity,
  FaSpa,
  FaCircle,
} from "react-icons/fa";
import { MdSearch, MdPlayArrow } from "react-icons/md";

interface Category {
  category: string;
  channels: number;
  playlist: string;
}

interface Props {
  categories: Category[];
  onCategorySelect: (category: Category) => void;
}

const ICON_MAP: Record<string, JSX.Element> = {
  news: <FaNewspaper />,
  sports: <FaFootballBall />,
  music: <FaMusic />,
  movies: <FaFilm />,
  kids: <FaChild />,
  education: <FaBook />,
  entertainment: <FaTheaterMasks />,
  religious: <FaPray />,
  cooking: <FaUtensils />,
  travel: <FaPlane />,
  weather: <FaCloudSun />,
  business: <FaBriefcase />,
  science: <FaFlask />,
  auto: <FaCar />,
  family: <FaUsers />,
  lifestyle: <FaGlobe />,
  outdoor: <FaCloudSun />,
  shop: <FaShoppingCart />,
  animation: <FaPaintBrush />,
  documentary: <FaVideo />,
  series: <FaTv />,
  culture: <FaGlobe />,
  classic: <FaTheaterMasks />,
  comedy: <FaLaugh />,
  legislative: <FaUniversity />,
  relax: <FaSpa />,
};

const getCategoryIcon = (name: string) => {
  const key = Object.keys(ICON_MAP).find((k) => name.toLowerCase().includes(k));
  return key ? ICON_MAP[key] : <FaTv />;
};

const getCategoryColor = (count: number) =>
  count > 1000
    ? "bg-red-500"
    : count > 500
    ? "bg-orange-500"
    : count > 200
    ? "bg-yellow-500"
    : count > 100
    ? "bg-green-500"
    : count > 50
    ? "bg-blue-500"
    : "bg-gray-500";

export default function CategoryBrowser({
  categories,
  onCategorySelect,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return categories
      .filter((c) => c.category.toLowerCase().includes(s))
      .sort((a, b) => b.channels - a.channels);
  }, [categories, search]);

  const totalChannels = useMemo(
    () => filtered.reduce((sum, c) => sum + c.channels, 0),
    [filtered]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <MdSearch className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>

      {/* Category List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filtered.map((cat) => (
            <div
              key={cat.category}
              onClick={() => onCategorySelect(cat)}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition hover:bg-gray-800 active:bg-gray-700 bg-gray-800/50"
            >
              <div className="text-2xl text-white">
                {getCategoryIcon(cat.category)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">
                  {cat.category}
                </h3>
                <p className="text-xs text-gray-400">
                  {cat.channels.toLocaleString()} channels
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FaCircle
                  className={`w-3 h-3 ${getCategoryColor(
                    cat.channels
                  )} rounded-full`}
                  title={`${cat.channels} channels`}
                />
                <MdPlayArrow className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-800 text-center text-xs text-gray-400">
        {filtered.length} categories • {totalChannels.toLocaleString()} total
        channels
      </div>
    </div>
  );
}
