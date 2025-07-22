"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  AlertCircle,
  RotateCcw,
  Wifi,
} from "lucide-react";

interface VideoPlayerProps {
  src: string;
  title: string;
  poster?: string;
}

declare global {
  interface Window {
    Hls: any;
  }
}

export default function VideoPlayer({ src, title, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([100]);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{
    message: string;
    type?: "cors" | "network" | "media" | "hls";
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [hlsLoaded, setHlsLoaded] = useState(false);

  // Load HLS.js dynamically
  useEffect(() => {
    const loadHls = async () => {
      if (window.Hls) {
        setHlsLoaded(true);
        return;
      }
      try {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js";
        script.onload = () => setHlsLoaded(true);
        script.onerror = () => {
          console.error("Failed to load HLS.js");
          setHlsLoaded(false);
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error("Error loading HLS.js:", error);
        setHlsLoaded(false);
      }
    };
    loadHls();
  }, []);

  // Detect mobile device
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize video player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsLoaded) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Reset states
    setError(null);
    setRetryCount(0);
    setIsLoading(true);

    const isHls = /\.m3u8$/i.test(src);
    initializeStream(video, src, isHls);

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };
    const handleError = (e: Event) => {
      const videoElement = e.target as HTMLVideoElement;
      const errorCode = videoElement.error?.code;
      const errorMessage = videoElement.error?.message || "Unknown error";
      setIsLoading(false);

      if (
        errorMessage.includes("CORS") ||
        errorMessage.includes("cross-origin")
      ) {
        setError({ message: "Stream blocked by CORS policy", type: "cors" });
      } else if (errorCode === 2) {
        setError({
          message: "Network error - stream not found",
          type: "network",
        });
      } else if (errorCode === 3) {
        setError({ message: "Stream decoding error", type: "media" });
      } else if (errorCode === 4 || errorMessage.includes("DEMUXER_ERROR")) {
        setError({ message: "HLS stream format error", type: "hls" });
      } else {
        setError({ message: "Stream temporarily unavailable", type: "hls" });
      }

      if (retryCount < 3) {
        setTimeout(() => setRetryCount((prev) => prev + 1), 3000);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, hlsLoaded, retryCount]);

  const initializeStream = (
    video: HTMLVideoElement,
    streamUrl: string,
    isHls: boolean
  ) => {
    try {
      if (isHls && window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 3,
          maxFragLookUpTolerance: 0.25,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
          manifestLoadingTimeOut: 10000,
          manifestLoadingMaxRetry: 1,
          manifestLoadingRetryDelay: 1000,
          levelLoadingTimeOut: 10000,
          levelLoadingMaxRetry: 4,
          levelLoadingRetryDelay: 1000,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 6,
          fragLoadingRetryDelay: 1000,
        });

        hlsRef.current = hls;

        hls.on(window.Hls.Events.MANIFEST_PARSED, () => setIsLoading(false));
        hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
          setIsLoading(false);
          if (data.fatal) {
            switch (data.type) {
              case window.Hls.ErrorTypes.NETWORK_ERROR:
                setError({
                  message: "Network error loading stream",
                  type:
                    data.details === window.Hls.ErrorDetails.MANIFEST_LOAD_ERROR
                      ? "cors"
                      : "network",
                });
                hls.startLoad();
                break;
              case window.Hls.ErrorTypes.MEDIA_ERROR:
                setError({
                  message: "Media error - stream format issue",
                  type: "media",
                });
                hls.recoverMediaError();
                break;
              default:
                setError({ message: "Stream playback error", type: "hls" });
                break;
            }
          }
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else {
        video.src = streamUrl;
        video.load();
      }
    } catch (err) {
      console.error("Error initializing stream:", err);
      setError({ message: "Invalid stream URL", type: "network" });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.volume = volume[0] / 100;
  }, [volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  const retryStream = () => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setIsLoading(true);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    initializeStream(video, src, /\.m3u8$/i.test(src));
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((err) => {
        console.error("Play failed:", err);
        setError({ message: "Playback failed", type: "media" });
      });
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video
        .requestFullscreen()
        .catch((err) => console.error("Fullscreen failed:", err));
    }
  };

  const handleMouseMove = () => {
    if (!isMobile) {
      setShowControls(true);
      setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handleTouchStart = () => setShowControls(!showControls);

  const getStreamInfo = () => {
    const isHls = /\.m3u8$/i.test(src);
    return {
      icon: isHls ? (
        <Wifi className="w-3 h-3 text-blue-400" />
      ) : (
        <Play className="w-3 h-3 text-green-400" />
      ),
      label: isHls ? "HLS Stream" : "Direct Stream",
    };
  };

  return (
    <div className="relative w-full h-full bg-black aspect-video overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        autoPlay
        playsInline
        crossOrigin="anonymous"
        controls={false}
        preload="metadata"
      />

      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center p-4 max-w-md">
            <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-sm md:text-base">
              Loading {title}...
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              {getStreamInfo().icon}
              <span className="text-gray-400 text-xs">
                {getStreamInfo().label}
              </span>
            </div>
            {retryCount > 0 && (
              <p className="text-gray-400 text-xs mt-2">
                Retry attempt {retryCount}/3
              </p>
            )}
            {!hlsLoaded && (
              <p className="text-yellow-400 text-xs mt-2">Loading HLS.js...</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 max-w-full max-h-full">
          <div className="text-center p-4 max-w-md w-full">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
            </div>
            <p className="text-white text-base md:text-lg mb-2">
              {error.type === "cors" ? "Stream Blocked" : "Stream Error"}
            </p>
            <p className="text-gray-400 text-sm mb-4">{error.message}</p>
            {error.type === "cors" ? (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <p className="text-yellow-400 text-xs">
                  This stream is protected by CORS policy. Try selecting a
                  different channel or contact support.
                  {/* TODO: Uncomment if proxy is implemented: Use <a href="/api/proxy?url={encodeURIComponent(src)}" className="underline">proxy</a> to bypass CORS. */}
                </p>
              </div>
            ) : (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getStreamInfo().icon}
                  <span className="text-blue-400 text-xs">
                    {getStreamInfo().label}
                  </span>
                </div>
                <p className="text-blue-400 text-xs">
                  {error.type === "hls" || error.type === "media"
                    ? "Stream requires compatible browser or codec"
                    : "Check your network connection or try another channel"}
                </p>
              </div>
            )}
            <Button
              onClick={retryStream}
              className="bg-red-600 hover:bg-red-700"
              size={isMobile ? "sm" : "default"}
              disabled={retryCount >= 3}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {retryCount >= 3 ? "Max Retries Reached" : "Retry"}
            </Button>
          </div>
        </div>
      )}

      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
          showControls || isMobile ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              size={isMobile ? "sm" : "sm"}
              onClick={togglePlay}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              disabled={!!error}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                size={isMobile ? "sm" : "sm"}
                variant="ghost"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
                disabled={!!error}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <div className="w-16 md:w-20">
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                  disabled={!!error}
                />
              </div>
            </div>
            <div className="flex-1" />
            <div className="hidden md:flex items-center gap-1 text-xs text-gray-400">
              {getStreamInfo().icon}
              <span>{getStreamInfo().label.toUpperCase()}</span>
            </div>
            <Button
              size={isMobile ? "sm" : "sm"}
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
              disabled={!!error}
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="lg"
            onClick={togglePlay}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-600 hover:bg-red-700 shadow-2xl"
          >
            <Play className="w-6 h-6 md:w-8 md:h-8 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
