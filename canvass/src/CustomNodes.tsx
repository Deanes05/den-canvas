import React, { useRef, useEffect } from 'react';
import { Handle, Position, BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow } from '@xyflow/react';
import { 
  FileText, 
  Music, 
  Video, 
  Image as ImageIcon, 
  Upload 
} from 'lucide-react';
import { cn } from './lib/utils';

interface NodeWrapperProps {
  icon?: React.ElementType;
  title: string;
  badge?: string;
  iconColor?: string;
  className?: string;
  children: React.ReactNode;
}

function NodeWrapper({
  icon: Icon,
  title,
  badge,
  iconColor = "text-[#4c6ef5]",
  className,
  children,
}: NodeWrapperProps) {
  return (
    <div className={cn("bg-[#1a1b1e] border border-[#2d2f36] hover:border-[#4c6ef5]/60 rounded-xl shadow-xl min-w-[200px] max-w-[250px] font-sans text-[#e1e1e1] select-none transition-all duration-150 relative group", className)}>
      {/* Node Header */}
      <div className="px-3 py-2 border-b border-[#2d2f36] flex items-center justify-between bg-[#212226] rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon size={14} className={cn("shrink-0", iconColor)} />}
          <span className="text-xs font-semibold text-[#e1e1e1] truncate">{title}</span>
        </div>
        
        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#2a2b30] text-[#8b8d93] border border-[#33353c]">
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* Node Body */}
      <div className="p-2.5 space-y-2">
        {children}
      </div>

      {/* ReactFlow Input & Output Handles */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 rounded-full !bg-[#4c6ef5] !border-2 !border-[#1a1b1e] -ml-1.5 hover:scale-125 transition-transform cursor-crosshair" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 rounded-full !bg-[#4c6ef5] !border-2 !border-[#1a1b1e] -mr-1.5 hover:scale-125 transition-transform cursor-crosshair" 
      />
    </div>
  );
}

export const TextNode = React.memo(({ id, data }: any) => {
  const { setNodes } = useReactFlow();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              text: newText,
            },
          };
        }
        return n;
      })
    );
  };

  return (
    <NodeWrapper
      icon={FileText}
      title={data.label || 'Text Display'}
      badge="Text"
      iconColor="text-amber-400"
      className="min-w-[280px] max-w-[360px]"
    >
      <div className="space-y-1.5">
        <textarea
          className="w-full bg-[#121315] p-2.5 text-xs text-[#e1e1e1] rounded-lg border border-[#2d2f36] focus:border-[#4c6ef5] focus:bg-[#16171a] focus:outline-none resize-y min-h-[100px] leading-relaxed break-words whitespace-pre-wrap placeholder-[#5c5f66] select-text cursor-text font-sans transition-all"
          placeholder="Type your text here..."
          value={data.text || ''}
          onChange={handleTextChange}
          rows={4}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />
        <div className="flex justify-between items-center text-[9px] font-mono text-[#5c5f66] px-0.5">
          <span>{data.text ? `${data.text.length} chars` : 'Empty text'}</span>
          <span className="text-[#71737c]">Live Synced</span>
        </div>
      </div>
    </NodeWrapper>
  );
});

export const AudioNode = React.memo(({ data }: any) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current && typeof data.volume === 'number') {
      audioRef.current.volume = Math.max(0, Math.min(1, data.volume));
    }
  }, [data.volume]);

  return (
    <NodeWrapper
      icon={Music}
      title={data.label || 'Audio Stream'}
      badge="Audio"
      iconColor="text-emerald-400"
    >
      <div 
        className="space-y-1.5"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {data.fileName && (
          <div className="text-[10px] text-[#8b8d93] font-mono truncate px-0.5">
            {data.fileName}
          </div>
        )}
        {data.url ? (
          <audio
            ref={audioRef}
            controls
            preload="metadata"
            className="w-full h-7 outline-none rounded"
            src={data.url}
            onPlay={(e) => {
              document.querySelectorAll('audio, video').forEach((el) => {
                if (el instanceof HTMLMediaElement && el !== e.currentTarget) {
                  el.pause();
                }
              });
            }}
            onError={(e) => {
              e.currentTarget.removeAttribute('src');
            }}
          />
        ) : (
          <div className="text-[10px] text-[#5c5f66] italic py-1 px-0.5">
            No audio source loaded
          </div>
        )}
      </div>
    </NodeWrapper>
  );
});

export const VideoNode = React.memo(({ data }: any) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && typeof data.volume === 'number') {
      videoRef.current.volume = Math.max(0, Math.min(1, data.volume));
    }
  }, [data.volume]);

  return (
    <NodeWrapper
      icon={Video}
      title={data.label || 'Video Stream'}
      badge="Video"
      iconColor="text-blue-400"
    >
      <div 
        className="aspect-video bg-[#121315] rounded-lg border border-[#2d2f36] flex items-center justify-center relative overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {data.url ? (
          <video
            ref={videoRef}
            controls
            preload="metadata"
            className="w-full h-full object-contain"
            src={data.url}
            onPlay={(e) => {
              document.querySelectorAll('audio, video').forEach((el) => {
                if (el instanceof HTMLMediaElement && el !== e.currentTarget) {
                  el.pause();
                }
              });
            }}
            onError={(e) => {
              e.currentTarget.removeAttribute('src');
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-[#5c5f66]">
            <Video size={20} className="text-[#8b8d93]" />
            <span className="text-[10px] font-mono">{data.fileName || 'No video loaded'}</span>
          </div>
        )}
      </div>
    </NodeWrapper>
  );
});

export const MediaNode = React.memo(({ data }: any) => {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const isAudioOnly = data.mediaType === 'audio' || (data.fileName && /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(data.fileName));

  useEffect(() => {
    if (mediaRef.current && typeof data.volume === 'number') {
      mediaRef.current.volume = Math.max(0, Math.min(1, data.volume));
    }
  }, [data.volume]);

  return (
    <NodeWrapper
      icon={isAudioOnly ? Music : Video}
      title={data.label || (isAudioOnly ? "Audio Stream" : "Video Stream")}
      badge={isAudioOnly ? "Audio" : "Video"}
      iconColor={isAudioOnly ? "text-emerald-400" : "text-blue-400"}
    >
      {isAudioOnly ? (
        <div 
          className="space-y-1.5"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {data.fileName && (
            <div className="text-[10px] text-[#8b8d93] font-mono truncate px-0.5">
              {data.fileName}
            </div>
          )}
          {data.url ? (
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              controls
              preload="metadata"
              className="w-full h-7 outline-none rounded"
              src={data.url}
              onPlay={(e) => {
                document.querySelectorAll('audio, video').forEach((el) => {
                  if (el instanceof HTMLMediaElement && el !== e.currentTarget) {
                    el.pause();
                  }
                });
              }}
              onError={(e) => {
                e.currentTarget.removeAttribute('src');
              }}
            />
          ) : (
            <div className="text-[10px] text-[#5c5f66] italic py-1 px-0.5">
              No audio source loaded
            </div>
          )}
        </div>
      ) : (
        <div 
          className="aspect-video bg-[#121315] rounded-lg border border-[#2d2f36] flex items-center justify-center relative overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {data.url ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              controls
              preload="metadata"
              className="w-full h-full object-contain"
              src={data.url}
              onPlay={(e) => {
                document.querySelectorAll('audio, video').forEach((el) => {
                  if (el instanceof HTMLMediaElement && el !== e.currentTarget) {
                    el.pause();
                  }
                });
              }}
              onError={(e) => {
                e.currentTarget.removeAttribute('src');
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-[#5c5f66]">
              <Video size={20} className="text-[#8b8d93]" />
              <span className="text-[10px] font-mono">{data.fileName || 'No media loaded'}</span>
            </div>
          )}
        </div>
      )}
    </NodeWrapper>
  );
});

export const ImageNode = React.memo(({ data }: any) => {
  return (
    <NodeWrapper
      icon={ImageIcon}
      title={data.label || 'Image Asset'}
      badge="Image"
      iconColor="text-purple-400"
    >
      <div 
        className="aspect-video bg-[#121315] rounded-lg border border-[#2d2f36] flex items-center justify-center overflow-hidden relative"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {data.url ? (
          <img src={data.url} alt={data.label || "Image"} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-[#5c5f66]">
            <ImageIcon size={20} className="text-[#8b8d93]" />
            <span className="text-[10px] font-mono">{data.fileName || 'No image loaded'}</span>
          </div>
        )}
      </div>
    </NodeWrapper>
  );
});

export const FileNode = React.memo(({ data }: any) => {
  return (
    <NodeWrapper
      icon={Upload}
      title={data.label || 'File Manifest'}
      badge="Data"
      iconColor="text-indigo-400"
    >
      <div 
        className="flex items-center gap-2 p-2 bg-[#121315] border border-[#2d2f36] rounded-lg group"
      >
        <Upload size={14} className="text-[#8b8d93] shrink-0" />
        <span className="text-xs text-[#c1c2c5] truncate font-mono">
          {data.fileName || 'Manifest.json'}
        </span>
      </div>
    </NodeWrapper>
  );
});

export function CustomRemovableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: any) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((e) => e.id !== id));
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? '#ff4d4f' : '#4c6ef5',
          strokeWidth: selected ? 3 : 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            type="button"
            onClick={onEdgeClick}
            className="w-5 h-5 rounded-full bg-[#1a1b1e] border border-[#ff4d4f] text-[#ff4d4f] hover:bg-[#ff4d4f] hover:text-white flex items-center justify-center text-[10px] font-bold shadow-lg transition-transform hover:scale-125 cursor-pointer"
            title="Delete Line Connection"
          >
            ✕
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const nodeTypes = {
  textNode: TextNode,
  audioNode: AudioNode,
  videoNode: VideoNode,
  mediaNode: MediaNode,
  imageNode: ImageNode,
  fileNode: FileNode,
};

export const edgeTypes = {
  removableEdge: CustomRemovableEdge,
  default: CustomRemovableEdge,
};
