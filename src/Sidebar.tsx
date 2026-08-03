import React, { useRef } from 'react';
import { 
  FileText, 
  Video, 
  Image as ImageIcon, 
  File, 
  Upload, 
  X,
  GripVertical
} from 'lucide-react';
import { cn } from './lib/utils';

export const ASSET_NODES = [
  { type: 'mediaNode', label: 'Audio & Video Stream', category: 'AV Media', icon: Video, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { type: 'imageNode', label: 'Image Asset', category: 'Graphic', icon: ImageIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { type: 'textNode', label: 'Text Display', category: 'Text', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { type: 'fileNode', label: 'File Manifest', category: 'Data', icon: File, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
];

interface SidebarProps {
  onAddNode?: (type: string) => void;
  onUploadFiles?: (files: FileList | File[]) => void;
  onCloseMobile?: () => void;
}

export function Sidebar({ onAddNode, onUploadFiles, onCloseMobile }: SidebarProps) {
  const sidebarFileInputRef = useRef<HTMLInputElement>(null);

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleSidebarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUploadFiles) {
      onUploadFiles(e.target.files);
    }
  };

  return (
    <aside className="w-full md:w-60 border-r border-[#2d2f36] bg-[#1a1b1e] flex flex-col shrink-0 font-sans text-[#e1e1e1] h-full select-none z-30">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2d2f36] flex justify-between items-center bg-[#18191c]">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-[#909296] uppercase block">Node Library</span>
          <span className="text-[11px] text-[#5c5f66] block mt-0.5">Drag to canvas or click to add</span>
        </div>
        {onCloseMobile && (
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-1 text-[#909296] hover:text-white rounded bg-[#25262b] transition-colors"
            aria-label="Close Sidebar"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Quick Local File Upload Action */}
      <div className="p-3 border-b border-[#2d2f36] bg-[#1a1b1e]">
        <input
          type="file"
          ref={sidebarFileInputRef}
          onChange={handleSidebarFileChange}
          multiple
          accept="image/*,audio/*,video/*,.json,text/plain"
          className="hidden"
        />
        <button
          onClick={() => sidebarFileInputRef.current?.click()}
          className="w-full py-2 px-3 bg-[#212226] hover:bg-[#282a30] border border-[#2d2f36] hover:border-[#4c6ef5]/60 text-[#c1c2c5] hover:text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-sm group"
        >
          <Upload size={13} className="text-[#8b8d93] group-hover:text-[#4c6ef5] transition-colors" />
          <span>Upload Media Files</span>
        </button>
      </div>

      {/* Minimal Node List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-[9px] font-bold uppercase tracking-wider text-[#5c5f66] px-1 mb-1">Available Nodes</div>
        {ASSET_NODES.map((n) => (
          <div
            key={n.type}
            onDragStart={(event) => onDragStart(event, n.type)}
            draggable
            onClick={() => {
              if (onAddNode) onAddNode(n.type);
              if (onCloseMobile) onCloseMobile();
            }}
            className="group flex items-center justify-between p-2.5 bg-[#212226] hover:bg-[#27292f] active:bg-[#2e3037] border border-[#2d2f36] hover:border-[#4c6ef5]/50 rounded-xl cursor-grab active:cursor-grabbing transition-all shadow-sm touch-none"
          >
            <div className="flex items-center gap-2.5">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", n.bg, n.color)}>
                <n.icon size={15} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-[#e1e1e1] group-hover:text-white transition-colors">{n.label}</span>
                <span className="text-[10px] text-[#71737c] font-mono">{n.category}</span>
              </div>
            </div>

            <GripVertical size={14} className="text-[#45474e] group-hover:text-[#8b8d93] transition-colors" />
          </div>
        ))}
      </div>

      {/* Clean Minimal Footer */}
      <div className="px-3 py-2.5 border-t border-[#2d2f36] bg-[#1a1b1e] flex items-center justify-between text-[10px] text-[#71737c]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Canvas Ready</span>
        </div>
        <span className="font-mono text-[9px] text-[#5c5f66]">4 Node Types</span>
      </div>
    </aside>
  );
}

