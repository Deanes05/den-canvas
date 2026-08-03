import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Music, 
  Video as VideoIcon, 
  Image as ImageIcon, 
  FileText, 
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sliders
} from 'lucide-react';

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: 'audio' | 'video' | 'image' | 'text' | 'file';
  title: string;
  url?: string;
  text?: string;
}

export function MediaPreviewModal({
  isOpen,
  onClose,
  mediaType,
  title,
  url,
  text,
}: MediaPreviewModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageFilter, setImageFilter] = useState<string>('none');

  const mediaRef = useRef<HTMLMediaElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Pause all background audio/video elements when preview modal opens
      document.querySelectorAll('audio, video').forEach((el) => {
        if (el instanceof HTMLMediaElement && el !== mediaRef.current) {
          el.pause();
        }
      });
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
      setImageZoom(1);
      setImageFilter('none');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (!mediaRef.current || !url) return;
    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      // Pause any other playing media elements before playing preview
      document.querySelectorAll('audio, video').forEach((el) => {
        if (el instanceof HTMLMediaElement && el !== mediaRef.current) {
          el.pause();
        }
      });
      const playPromise = mediaRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Playback interrupted or prevented:', err);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (mediaRef.current) {
      mediaRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!mediaRef.current) return;
    if (isMuted) {
      mediaRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      mediaRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackSpeed(rate);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = rate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none">
      <div className="bg-[#25262b] border border-[#383a40] rounded-xl max-w-3xl w-full text-[#e1e1e1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#1d1e22] px-5 py-3 border-b border-[#333] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-[#373a40] text-[#4c6ef5]">
              {mediaType === 'audio' && <Music size={16} />}
              {mediaType === 'video' && <VideoIcon size={16} />}
              {mediaType === 'image' && <ImageIcon size={16} />}
              {(mediaType === 'text' || mediaType === 'file') && <FileText size={16} />}
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#4c6ef5] block">
                Quick Preview Mode
              </span>
              <h3 className="text-sm font-bold text-white truncate max-w-sm">{title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#909296] hover:text-white hover:bg-[#373a40] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Display */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-[#1a1b1e]">
          
          {/* 1. IMAGE PREVIEW */}
          {mediaType === 'image' && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="relative overflow-hidden rounded-lg border border-[#333] max-h-[50vh] flex items-center justify-center bg-black/40 p-2">
                {url ? (
                  <img
                    src={url}
                    alt={title}
                    style={{
                      transform: `scale(${imageZoom})`,
                      filter: imageFilter,
                      transition: 'transform 0.2s ease, filter 0.2s ease',
                    }}
                    className="max-h-[45vh] object-contain rounded"
                  />
                ) : (
                  <div className="p-12 text-center text-[#5c5f66] space-y-2">
                    <ImageIcon size={36} className="mx-auto" />
                    <p className="text-xs">No image source URL loaded</p>
                  </div>
                )}
              </div>

              {/* Image Controls */}
              <div className="flex items-center gap-4 bg-[#25262b] px-4 py-2 rounded-full border border-[#333] text-xs text-[#909296]">
                <div className="flex items-center gap-1">
                  <button onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.2))} className="p-1 hover:text-white"><ZoomOut size={14} /></button>
                  <span className="font-mono text-[11px] w-12 text-center">{Math.round(imageZoom * 100)}%</span>
                  <button onClick={() => setImageZoom(Math.min(3, imageZoom + 0.2))} className="p-1 hover:text-white"><ZoomIn size={14} /></button>
                </div>
                <div className="h-4 w-[1px] bg-[#333]"></div>
                <div className="flex items-center gap-2">
                  <Sliders size={13} />
                  <select
                    value={imageFilter}
                    onChange={(e) => setImageFilter(e.target.value)}
                    className="bg-[#1a1b1e] border border-[#383a40] text-xs text-white rounded px-2 py-0.5 outline-none"
                  >
                    <option value="none">Normal</option>
                    <option value="grayscale(100%)">Grayscale</option>
                    <option value="sepia(80%)">Vintage Sepia</option>
                    <option value="contrast(150%)">High Contrast</option>
                    <option value="invert(100%)">Inverted</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. AUDIO PREVIEW */}
          {mediaType === 'audio' && (
            <div className="w-full max-w-xl space-y-6">
              <div className="bg-[#25262b] p-6 rounded-xl border border-[#333] flex flex-col items-center gap-4 text-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Music size={28} />
                </div>
                
                {/* Waveform graphic placeholder animation */}
                <div className="flex items-center justify-center gap-1 h-10 w-full px-8">
                  {[40, 70, 30, 90, 60, 100, 50, 80, 45, 95, 30, 85, 60, 40, 75, 90, 50, 30].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-300 ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-[#373a40]'}`}
                      style={{ height: isPlaying ? `${Math.max(15, (h * (i % 2 === 0 ? 0.9 : 1.1)))}%` : '20%' }}
                    ></div>
                  ))}
                </div>

                {url ? (
                  <audio
                    ref={mediaRef as any}
                    src={url}
                    onTimeUpdate={() => {
                      if (mediaRef.current) setCurrentTime(mediaRef.current.currentTime);
                    }}
                    onLoadedMetadata={() => {
                      if (mediaRef.current && isFinite(mediaRef.current.duration)) {
                        setDuration(mediaRef.current.duration);
                      }
                    }}
                    onEnded={() => setIsPlaying(false)}
                    onError={(e) => {
                      e.currentTarget.removeAttribute('src');
                      setIsPlaying(false);
                    }}
                  />
                ) : (
                  <div className="text-xs text-[#8b8d93] italic">No audio source URL available</div>
                )}
              </div>

              {/* Progress Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-[#909296]">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Media Controls Bar */}
              <div className="flex items-center justify-between bg-[#25262b] p-3 rounded-lg border border-[#333]">
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="text-[#909296] hover:text-white">
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-16 accent-emerald-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (mediaRef.current) mediaRef.current.currentTime -= 5;
                    }}
                    className="text-[#909296] hover:text-white text-xs flex items-center gap-0.5"
                  >
                    <RotateCcw size={14} /> -5s
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center font-bold transition-transform active:scale-95 shadow-md"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                </div>

                <div className="flex gap-1 text-[10px] font-mono">
                  {[0.75, 1, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      className={`px-1.5 py-0.5 rounded ${playbackSpeed === rate ? 'bg-emerald-500 text-black font-bold' : 'bg-[#1a1b1e] text-[#909296]'}`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. VIDEO PREVIEW */}
          {mediaType === 'video' && (
            <div className="w-full max-w-2xl space-y-4">
              <div className="relative aspect-video bg-black rounded-xl border border-[#333] overflow-hidden flex items-center justify-center group">
                {url ? (
                  <video
                    ref={mediaRef as any}
                    src={url}
                    className="w-full h-full object-contain"
                    onTimeUpdate={() => {
                      if (mediaRef.current) setCurrentTime(mediaRef.current.currentTime);
                    }}
                    onLoadedMetadata={() => {
                      if (mediaRef.current && isFinite(mediaRef.current.duration)) {
                        setDuration(mediaRef.current.duration);
                      }
                    }}
                    onEnded={() => setIsPlaying(false)}
                    onError={(e) => {
                      e.currentTarget.removeAttribute('src');
                      setIsPlaying(false);
                    }}
                    onClick={togglePlay}
                  />
                ) : (
                  <div className="text-xs text-[#8b8d93] italic">No video source URL available</div>
                )}
              </div>

              {/* Video Scrubber & Play Bar */}
              <div className="space-y-2 bg-[#25262b] p-3 rounded-lg border border-[#333]">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full accent-blue-400 cursor-pointer"
                />

                <div className="flex items-center justify-between text-xs text-[#909296]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="p-1.5 bg-[#4c6ef5] text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <span className="font-mono text-[11px]">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Volume2 size={14} />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-16 accent-blue-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. TEXT / FILE PREVIEW */}
          {(mediaType === 'text' || mediaType === 'file') && (
            <div className="w-full max-w-xl space-y-3">
              <div className="bg-[#1d1e22] p-4 rounded-lg border border-[#383a40] font-mono text-xs text-[#e1e1e1] whitespace-pre-wrap max-h-[40vh] overflow-y-auto leading-relaxed select-text">
                {text || 'No text content loaded.'}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
