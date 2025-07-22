"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FiSearch, FiPlay, FiChevronRight } from "react-icons/fi";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Subdivision {
  name: string;
  channels: number;
  playlist_url: string;
}

interface Country {
  name: string;
  flag: string | null;
  channels: number;
  playlist_url: string;
  subdivisions: Subdivision[];
}

interface CountryBrowserProps {
  countries: Country[];
  onCountrySelect: (country: Country) => void;
  onSubdivisionSelect?: (subdivision: Subdivision, country: Country) => void;
}

export default function CountryBrowser({
  countries,
  onCountrySelect,
  onSubdivisionSelect,
}: CountryBrowserProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set()
  );

  const filteredCountries = useMemo(() => {
    return countries.filter((country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [countries, searchTerm]);

  const sortedCountries = useMemo(() => {
    return [...filteredCountries].sort((a, b) => b.channels - a.channels);
  }, [filteredCountries]);

  const toggleCountryExpansion = (countryName: string) => {
    setExpandedCountries((prev) => {
      const newSet = new Set(prev);
      newSet.has(countryName)
        ? newSet.delete(countryName)
        : newSet.add(countryName);
      return newSet;
    });
  };

  const getChannelColor = (channels: number) => {
    if (channels > 1000) return "bg-red-500";
    if (channels > 500) return "bg-orange-500";
    if (channels > 200) return "bg-yellow-500";
    if (channels > 100) return "bg-green-500";
    if (channels > 50) return "bg-blue-500";
    return "bg-gray-500";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <FiSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>

      {/* Countries List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {sortedCountries.map((country) => (
            <Collapsible
              key={country.name}
              open={expandedCountries.has(country.name)}
            >
              <div className="bg-gray-800/50 rounded-lg">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 hover:bg-gray-800 active:bg-gray-700"
                  onClick={() => onCountrySelect(country)}
                >
                  <div className="text-2xl flex-shrink-0">
                    {country.flag || "🌍"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">
                      {country.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {country.channels.toLocaleString()} channels
                      {country.subdivisions.length > 0 &&
                        ` • ${country.subdivisions.length} regions`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className={`w-3 h-3 rounded-full ${getChannelColor(
                        country.channels
                      )}`}
                      title={`${country.channels} channels`}
                    />
                    {country.subdivisions.length > 0 && (
                      <CollapsibleTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCountryExpansion(country.name);
                          }}
                          className="p-1 hover:bg-gray-700 rounded"
                          aria-label="Toggle subdivisions"
                        >
                          <FiChevronRight
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              expandedCountries.has(country.name)
                                ? "rotate-90"
                                : ""
                            }`}
                          />
                        </button>
                      </CollapsibleTrigger>
                    )}
                    <FiPlay className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Subdivisions */}
                {country.subdivisions.length > 0 && (
                  <CollapsibleContent>
                    <div className="pl-6 pb-2 space-y-1">
                      {country.subdivisions.map((sub) => (
                        <div
                          key={sub.name}
                          className="flex items-center gap-3 p-2 rounded cursor-pointer transition-all duration-200 hover:bg-gray-700 active:bg-gray-600"
                          onClick={() => onSubdivisionSelect?.(sub, country)}
                        >
                          <div className="w-4 h-4 flex-shrink-0 bg-gray-600 rounded-full"></div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium text-gray-300 truncate">
                              {sub.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {sub.channels} channels
                            </p>
                          </div>
                          <FiPlay className="w-3 h-3 text-gray-500" />
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                )}
              </div>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      {/* Stats */}
      <div className="p-4 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-400">
          {filteredCountries.length} countries •{" "}
          {filteredCountries
            .reduce((sum, c) => sum + c.channels, 0)
            .toLocaleString()}{" "}
          total channels
        </p>
      </div>
    </div>
  );
}
