export interface MediaNodeData {
  label: string;
  url?: string;
  file?: File;
  fileName?: string;
  fileSize?: string;
  fileType?: 'audio' | 'video' | 'image' | 'text' | 'json';
  text?: string;
  volume?: number;
  playbackRate?: number;
  loop?: boolean;
  filter?: string;
  aspectRatio?: string;
}
