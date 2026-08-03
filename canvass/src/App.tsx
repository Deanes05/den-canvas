/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Connection,
  Edge,
  Node,
  Background,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Library, 
  SlidersHorizontal, 
  Trash2, 
  X, 
  Upload, 
  Eye, 
  LayoutGrid,
  Rows,
  Columns,
  Music,
  Video,
  Image as ImageIcon,
  FileText,
  Volume2,
  VolumeX,
  FileCode,
  Info,
  CheckCircle2
} from 'lucide-react';

import { Sidebar } from './Sidebar';
import { nodeTypes, edgeTypes } from './CustomNodes';

const DEFAULT_MARKER = {
  type: MarkerType.ArrowClosed,
  color: '#4c6ef5',
  width: 16,
  height: 16,
};
import { MediaPreviewModal } from './components/MediaPreviewModal';

let id = 1;
const getId = () => `node_${id++}`;

const INITIAL_NODES: Node[] = [];

function Flow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const inspectorFileInputRef = useRef<HTMLInputElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    mediaType: 'audio' | 'video' | 'image' | 'text' | 'file';
    title: string;
    url?: string;
    text?: string;
  }>({
    isOpen: false,
    mediaType: 'text',
    title: '',
  });

  // Mobile drawer states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Active Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const newEdge = { 
        ...params, 
        type: 'removableEdge',
        animated: true, 
        style: { stroke: '#4c6ef5', strokeWidth: 2 },
        markerEnd: DEFAULT_MARKER,
      };
      setEdges((eds) => addEdge(newEdge, eds));
      showToast('Nodes connected with arrow line! Click ✕ on line to delete.');
    },
    [setEdges]
  );

  // Upload local file directly to currently selected node/card
  const handleFileUploadToSelectedNode = (file: File) => {
    if (!selectedNodeId) return;

    const selectedNode = nodes.find((n) => n.id === selectedNodeId);
    if (!selectedNode) return;

    const fileUrl = URL.createObjectURL(file);
    const fileSizeStr = file.size / (1024 * 1024) >= 1 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(1)} KB`;

    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(file.name);
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mkv|mov|avi)$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);

    // Strict format validation per node type
    if (selectedNode.type === 'mediaNode' || selectedNode.type === 'audioNode' || selectedNode.type === 'videoNode') {
      if (!isAudio && !isVideo) {
        showToast(`Audio/Video cards accept audio & video files only. Created new card for "${file.name}".`);
        processUploadedFiles([file]);
        return;
      }
    } else if (selectedNode.type === 'imageNode') {
      if (!isImage) {
        showToast(`Image cards accept image files only. Created new card for "${file.name}".`);
        processUploadedFiles([file]);
        return;
      }
    }

    const isTextOrJson = file.type === 'application/json' || file.name.endsWith('.json') || file.type.startsWith('text/') || file.name.endsWith('.csv') || file.name.endsWith('.vtt') || file.name.endsWith('.txt');

    if (isTextOrJson) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === selectedNodeId) {
              return {
                ...n,
                data: {
                  ...n.data,
                  fileName: file.name,
                  fileSize: fileSizeStr,
                  url: fileUrl,
                  text: fileContent,
                  label: n.data.label && !(n.data.label as string).includes('Node') ? n.data.label : file.name,
                },
              };
            }
            return n;
          })
        );
        showToast(`Loaded file content from "${file.name}" to card!`);
      };
      reader.readAsText(file);
      return;
    }

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              fileName: file.name,
              fileSize: fileSizeStr,
              url: fileUrl,
              mediaType: isAudio ? 'audio' : isVideo ? 'video' : n.data.mediaType,
              label: n.data.label && !(n.data.label as string).includes('Node') ? n.data.label : file.name,
            },
          };
        }
        return n;
      })
    );

    showToast(`Attached "${file.name}" to card!`);
  };

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Helper to open preview modal for a node
  const handleOpenPreview = useCallback((nodeInput?: Node | null) => {
    // Pause all playing media elements on the canvas
    document.querySelectorAll('audio, video').forEach((el) => {
      if (el instanceof HTMLMediaElement) {
        el.pause();
      }
    });

    const targetNode = nodeInput || nodes.find((n) => n.id === selectedNodeId);
    if (!targetNode) return;

    let mediaType: 'audio' | 'video' | 'image' | 'text' | 'file' = 'text';
    if (targetNode.type === 'audioNode') mediaType = 'audio';
    else if (targetNode.type === 'videoNode' || targetNode.type === 'mediaNode') {
      mediaType = targetNode.data.mediaType === 'audio' || (targetNode.data.fileName && /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(targetNode.data.fileName as string)) ? 'audio' : 'video';
    }
    else if (targetNode.type === 'imageNode') mediaType = 'image';
    else if (targetNode.type === 'fileNode') mediaType = 'file';

    setPreviewModal({
      isOpen: true,
      mediaType,
      title: (targetNode.data.label as string) || 'Media Preview',
      url: targetNode.data.url as string | undefined,
      text: targetNode.data.text as string | undefined,
    });
  }, [nodes, selectedNodeId]);

  // Canvas Layout & Alignment Functions
  const alignNodesHorizontal = useCallback(() => {
    setNodes((currentNodes) => {
      if (currentNodes.length === 0) return currentNodes;

      const selectedNodes = currentNodes.filter((n) => n.selected);
      const targetNodes = selectedNodes.length >= 2 ? selectedNodes : currentNodes;

      if (targetNodes.length < 2) {
        showToast('Add at least 2 nodes to align horizontally');
        return currentNodes;
      }

      const targetIds = new Set(targetNodes.map((n) => n.id));

      const avgY = Math.round(
        targetNodes.reduce((sum, n) => sum + n.position.y, 0) / targetNodes.length
      );

      const sorted = [...targetNodes].sort((a, b) => a.position.x - b.position.x);
      const startX = sorted[0].position.x;
      const xSpacing = 280;

      showToast(`Aligned ${targetNodes.length} nodes horizontally`);

      return currentNodes.map((n) => {
        if (targetIds.has(n.id)) {
          const index = sorted.findIndex((s) => s.id === n.id);
          return {
            ...n,
            position: {
              x: startX + index * xSpacing,
              y: avgY,
            },
          };
        }
        return n;
      });
    });
  }, [setNodes]);

  const alignNodesVertical = useCallback(() => {
    setNodes((currentNodes) => {
      if (currentNodes.length === 0) return currentNodes;

      const selectedNodes = currentNodes.filter((n) => n.selected);
      const targetNodes = selectedNodes.length >= 2 ? selectedNodes : currentNodes;

      if (targetNodes.length < 2) {
        showToast('Add at least 2 nodes to align vertically');
        return currentNodes;
      }

      const targetIds = new Set(targetNodes.map((n) => n.id));

      const avgX = Math.round(
        targetNodes.reduce((sum, n) => sum + n.position.x, 0) / targetNodes.length
      );

      const sorted = [...targetNodes].sort((a, b) => a.position.y - b.position.y);
      const startY = sorted[0].position.y;
      const ySpacing = 180;

      showToast(`Aligned ${targetNodes.length} nodes vertically`);

      return currentNodes.map((n) => {
        if (targetIds.has(n.id)) {
          const index = sorted.findIndex((s) => s.id === n.id);
          return {
            ...n,
            position: {
              x: avgX,
              y: startY + index * ySpacing,
            },
          };
        }
        return n;
      });
    });
  }, [setNodes]);

  const tidyNodesGrid = useCallback(() => {
    setNodes((currentNodes) => {
      if (currentNodes.length === 0) return currentNodes;

      const selectedNodes = currentNodes.filter((n) => n.selected);
      const targetNodes = selectedNodes.length >= 2 ? selectedNodes : currentNodes;
      const targetIds = new Set(targetNodes.map((n) => n.id));

      const cols = Math.max(2, Math.ceil(Math.sqrt(targetNodes.length)));
      const xSpacing = 280;
      const ySpacing = 180;

      const minX = Math.min(...targetNodes.map((n) => n.position.x));
      const minY = Math.min(...targetNodes.map((n) => n.position.y));

      showToast(`Tidied ${targetNodes.length} nodes into grid layout`);

      return currentNodes.map((n) => {
        if (targetIds.has(n.id)) {
          const index = targetNodes.findIndex((s) => s.id === n.id);
          const col = index % cols;
          const row = Math.floor(index / cols);
          return {
            ...n,
            position: {
              x: minX + col * xSpacing,
              y: minY + row * ySpacing,
            },
          };
        }
        return n;
      });
    });

    if (reactFlowInstance) {
      setTimeout(() => reactFlowInstance.fitView({ duration: 350 }), 50);
    }
  }, [reactFlowInstance, setNodes]);

  const createNodeObject = (type: string, position: { x: number; y: number }, extraData: Record<string, any> = {}) => {
    const nodeNames: Record<string, string> = {
      mediaNode: 'Audio / Video Node',
      audioNode: 'Audio Stream Node',
      videoNode: 'Video Stream Node',
      imageNode: 'Image Asset Node',
      textNode: 'Text Display Node',
      fileNode: 'File Manifest Node',
    };

    const newNodeId = getId();

    const nodeObj: Node = {
      id: newNodeId,
      type,
      position,
      data: { 
        label: extraData.label || nodeNames[type] || 'New Node',
        text: type === 'textNode' ? (extraData.text || '') : undefined,
        ...extraData,
      },
    };

    return nodeObj;
  };

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode = createNodeObject(type, position);
      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNode.id);
      showToast(`Added new ${newNode.data.label}`);
    },
    [reactFlowInstance, setNodes]
  );

  // Handle tap/click to add node from sidebar
  const handleAddNode = useCallback((type: string) => {
    const randomOffset = Math.floor(Math.random() * 80);
    const position = reactFlowInstance
      ? reactFlowInstance.screenToFlowPosition({
          x: (window.innerWidth / 2) + randomOffset - 100,
          y: (window.innerHeight / 2) + randomOffset - 100,
        })
      : { x: 200 + randomOffset, y: 200 + randomOffset };

    const newNode = createNodeObject(type, position);
    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(newNode.id);
    showToast(`Added ${newNode.data.label}`);
  }, [reactFlowInstance, setNodes]);

  // File Upload Handler (Images, Audio, Video, JSON)
  const processUploadedFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    let addedCount = 0;

    fileArray.forEach((file, index) => {
      const fileUrl = URL.createObjectURL(file);
      const position = { x: 150 + index * 260, y: 180 + (index % 2) * 120 };

      const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(file.name);
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mkv|mov|avi)$/i.test(file.name);
      const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);

      if (isImage) {
        const node = createNodeObject('imageNode', position, {
          label: file.name,
          url: fileUrl,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        });
        setNodes((nds) => nds.concat(node));
        addedCount++;
      } else if (isAudio || isVideo) {
        const node = createNodeObject('mediaNode', position, {
          label: file.name,
          url: fileUrl,
          mediaType: isAudio ? 'audio' : 'video',
          fileName: file.name,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        });
        setNodes((nds) => nds.concat(node));
        addedCount++;
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parsed = JSON.parse(e.target?.result as string);
            if (Array.isArray(parsed)) {
              setNodes(parsed);
              showToast(`Imported ${parsed.length} canvas nodes from JSON`);
            } else if (parsed.nodes && Array.isArray(parsed.nodes)) {
              setNodes(parsed.nodes);
              if (parsed.edges) setEdges(parsed.edges);
              showToast(`Loaded graph pipeline from ${file.name}`);
            } else {
              const node = createNodeObject('fileNode', position, {
                label: file.name,
                text: JSON.stringify(parsed, null, 2),
                fileName: file.name,
              });
              setNodes((nds) => nds.concat(node));
            }
          } catch (err) {
            showToast('Error parsing JSON graph file');
          }
        };
        reader.readAsText(file);
        addedCount++;
      } else {
        // Fallback for plain text / unknown files
        const node = createNodeObject('fileNode', position, {
          label: file.name,
          fileName: file.name,
        });
        setNodes((nds) => nds.concat(node));
        addedCount++;
      }
    });

    if (addedCount > 0) {
      showToast(`Loaded ${addedCount} media asset(s) to canvas`);
    }
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const updateSelectedNodeData = (key: string, value: any) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              [key]: value,
            },
          };
        }
        return n;
      })
    );
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
    showToast('Node deleted');
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    showToast('Canvas cleared');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1a1b1e] text-[#e1e1e1] font-sans overflow-hidden border border-[#333]">

      {/* Media Quick Preview Lightbox Modal */}
      <MediaPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
        mediaType={previewModal.mediaType}
        title={previewModal.title}
        url={previewModal.url}
        text={previewModal.text}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 right-4 z-50 bg-[#4c6ef5] text-white text-xs px-3 py-2 rounded-md shadow-xl flex items-center gap-2 border border-blue-400">
          <Info size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="h-12 border-b border-[#2d2f36] bg-[#1a1b1e] flex items-center justify-between px-3 md:px-4 shrink-0 z-40 relative select-none">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-6 h-6 bg-[#4c6ef5] rounded-md flex items-center justify-center font-bold text-xs text-white shadow-md">
            D
          </div>
          <span className="font-semibold tracking-tight text-xs md:text-sm text-[#e1e1e1]">Deane-Visualizer</span>
          <span className="text-[9px] bg-[#25262b] text-[#8b8d93] border border-[#2d2f36] px-1.5 py-0.5 rounded font-mono hidden sm:inline-block">Canvas</span>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Mobile Toggle Assets Library */}
          <button
            type="button"
            onClick={() => {
              setIsSidebarOpen(!isSidebarOpen);
              setIsInspectorOpen(false);
            }}
            className={`md:hidden px-2 py-1 rounded text-xs border flex items-center gap-1 transition-colors ${
              isSidebarOpen ? 'bg-[#4c6ef5] text-white border-blue-400' : 'bg-[#25262b] text-[#909296] border-[#333]'
            }`}
          >
            <Library size={14} />
            <span className="text-[10px]">Nodes</span>
          </button>

          {/* Mobile Toggle Inspector */}
          <button
            type="button"
            onClick={() => {
              setIsInspectorOpen(!isInspectorOpen);
              setIsSidebarOpen(false);
            }}
            className={`md:hidden px-2 py-1 rounded text-xs border flex items-center gap-1 transition-colors ${
              isInspectorOpen ? 'bg-[#4c6ef5] text-white border-blue-400' : 'bg-[#25262b] text-[#909296] border-[#333]'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span className="text-[10px]">Inspector</span>
          </button>
        </div>
      </nav>

      {/* Main Workspace Area */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Desktop Sidebar / Mobile Slide-Over Drawer for Assets */}
        <div className={`
          fixed md:relative inset-y-0 left-0 z-30 w-64 md:w-60 bg-[#25262b] transform transition-transform duration-200 ease-in-out md:transform-none
          ${isSidebarOpen ? 'translate-x-0 top-12 bottom-6 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar 
            onAddNode={handleAddNode} 
            onUploadFiles={processUploadedFiles}
            onCloseMobile={() => setIsSidebarOpen(false)} 
          />
        </div>

        {/* Center Flow Canvas */}
        <main className="flex-1 relative bg-[#1a1b1e] overflow-hidden" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            panOnScroll={true}
            zoomOnPinch={true}
            preventScrolling={false}
            className="bg-[#1a1b1e] w-full h-full"
            defaultEdgeOptions={{
              type: 'removableEdge',
              markerEnd: DEFAULT_MARKER,
              style: { stroke: '#4c6ef5', strokeWidth: 2 }
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
            
            <Controls 
              position="bottom-left"
            />
            
            {/* Floating Stats */}
            <div className="absolute bottom-3 right-3 hidden sm:flex items-center gap-2 z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#25262b]/90 backdrop-blur-sm rounded-md border border-[#333] text-[10px] text-[#909296]">
                <span className="text-[#5c5f66] font-semibold">Nodes:</span> {nodes.length}
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#25262b]/90 backdrop-blur-sm rounded-md border border-[#333] text-[10px] text-[#909296]">
                <span className="text-[#5c5f66] font-semibold">Edges:</span> {edges.length}
              </div>
            </div>
          </ReactFlow>
        </main>

        {/* Node Inspector Panel */}
        <aside className={`
          fixed md:relative inset-y-0 right-0 z-30 w-72 md:w-64 border-l border-[#2d2f36] bg-[#1a1b1e] shrink-0 font-sans text-[#e1e1e1] transform transition-transform duration-200 ease-in-out md:transform-none overflow-y-auto
          ${isInspectorOpen ? 'translate-x-0 top-12 bottom-6 shadow-2xl' : 'translate-x-full md:translate-x-0'}
        `}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#2d2f36] bg-[#18191c] flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#909296] uppercase block">Node Inspector</span>
              <span className="text-[11px] text-[#5c5f66] block mt-0.5">Properties & Controls</span>
            </div>
            {isInspectorOpen && (
              <button 
                onClick={() => setIsInspectorOpen(false)}
                className="md:hidden p-1 text-[#909296] hover:text-white rounded bg-[#25262b] transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {selectedNode ? (
            <div className="p-3.5 space-y-3.5">
              {/* Selected Node Status Card */}
              <div className="p-3 bg-[#212226] rounded-xl border border-[#2d2f36] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#4c6ef5]/20 text-[#4c6ef5] flex items-center justify-center shrink-0">
                      {selectedNode.type === 'audioNode' ? <Music size={13} /> :
                       selectedNode.type === 'videoNode' ? <Video size={13} /> :
                       selectedNode.type === 'imageNode' ? <ImageIcon size={13} /> :
                       selectedNode.type === 'textNode' ? <FileText size={13} /> :
                       selectedNode.type === 'mediaNode' ? <Video size={13} /> :
                       <FileCode size={13} />}
                    </div>
                    <span className="text-[10px] text-[#4c6ef5] font-mono uppercase font-bold tracking-wider">
                      {selectedNode.type}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={deleteSelectedNode}
                    className="p-1 text-red-400 hover:text-white hover:bg-red-500/20 rounded-md transition-colors shrink-0"
                    title="Delete Node"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="text-xs font-semibold text-white truncate px-0.5">
                  {selectedNode.data.label as string || 'Untitled Node'}
                </div>
              </div>

              {/* Quick Preview Action */}
              <button
                type="button"
                onClick={() => handleOpenPreview(selectedNode)}
                className="w-full py-2 px-3 bg-[#4c6ef5]/15 hover:bg-[#4c6ef5] text-[#4c6ef5] hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-[#4c6ef5]/40 shadow-sm group"
              >
                <Eye size={13} className="group-hover:scale-110 transition-transform" />
                <span>Open Full Preview</span>
              </button>

              {/* Node Properties */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#8b8d93] block px-0.5">Title / Label</label>
                  <input 
                    type="text" 
                    value={(selectedNode.data.label as string) || ''} 
                    onChange={(e) => updateSelectedNodeData('label', e.target.value)}
                    placeholder="Enter node label..."
                    className="w-full bg-[#121315] border border-[#2d2f36] focus:border-[#4c6ef5] rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors text-[#e1e1e1] placeholder-[#5c5f66]" 
                  />
                </div>

                {selectedNode.type === 'textNode' && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-0.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-[#8b8d93] block">Text Content</label>
                      <span className="text-[9px] font-mono text-[#5c5f66]">
                        {selectedNode.data.text ? `${(selectedNode.data.text as string).length} chars` : 'Empty'}
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={(selectedNode.data.text as string) || ''}
                      onChange={(e) => updateSelectedNodeData('text', e.target.value)}
                      placeholder="Type text node content..."
                      className="w-full bg-[#121315] border border-[#2d2f36] focus:border-[#4c6ef5] rounded-lg px-2.5 py-2 text-xs outline-none transition-colors text-[#e1e1e1] resize-y placeholder-[#5c5f66] leading-relaxed break-words whitespace-pre-wrap font-sans"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#8b8d93] block px-0.5">Coordinates</label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-[#121315] py-1.5 px-2 rounded-lg border border-[#2d2f36] text-center text-[#8b8d93] flex items-center justify-center gap-1">
                      <span className="text-[#5c5f66] font-sans text-[10px]">X</span>
                      <span>{Math.round(selectedNode.position.x)}</span>
                    </div>
                    <div className="bg-[#121315] py-1.5 px-2 rounded-lg border border-[#2d2f36] text-center text-[#8b8d93] flex items-center justify-center gap-1">
                      <span className="text-[#5c5f66] font-sans text-[10px]">Y</span>
                      <span>{Math.round(selectedNode.position.y)}</span>
                    </div>
                  </div>
                </div>

                {(selectedNode.type === 'audioNode' || selectedNode.type === 'videoNode' || selectedNode.type === 'mediaNode') && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-0.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-[#8b8d93]">Playback Volume</label>
                      <span className="text-[10px] font-mono text-[#8b8d93]">
                        {Math.round(Number(selectedNode.data.volume ?? 0.8) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 bg-[#121315] p-2 rounded-lg border border-[#2d2f36]">
                      {Number(selectedNode.data.volume ?? 0.8) === 0 ? (
                        <VolumeX size={14} className="text-[#5c5f66] shrink-0" />
                      ) : (
                        <Volume2 size={14} className="text-[#4c6ef5] shrink-0" />
                      )}
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={Number(selectedNode.data.volume ?? 0.8)}
                        onChange={(e) => updateSelectedNodeData('volume', parseFloat(e.target.value))}
                        className="flex-1 accent-[#4c6ef5] h-1 bg-[#25262b] rounded cursor-pointer" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Local File Attachment */}
              <div className="pt-3 border-t border-[#2d2f36] space-y-2">
                <div className="flex justify-between items-center px-0.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#8b8d93] block">Attached File</label>
                  {selectedNode.data.fileName ? (
                    <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  ) : (
                    <span className="text-[9px] text-[#5c5f66] font-mono">None</span>
                  )}
                </div>

                <input
                  type="file"
                  ref={inspectorFileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUploadToSelectedNode(e.target.files[0]);
                    }
                  }}
                  accept={
                    selectedNode?.type === 'mediaNode' || selectedNode?.type === 'audioNode' || selectedNode?.type === 'videoNode'
                      ? 'audio/*,video/*,.mp3,.wav,.ogg,.aac,.m4a,.flac,.mp4,.webm,.mkv,.mov,.avi'
                      : selectedNode?.type === 'imageNode'
                      ? 'image/*,.png,.jpg,.jpeg,.gif,.webp,.svg'
                      : '.json,.txt,.csv,.xml,.vtt,text/plain,application/json'
                  }
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => inspectorFileInputRef.current?.click()}
                  className="w-full py-2 px-3 bg-[#212226] hover:bg-[#282a30] text-[#c1c2c5] hover:text-white border border-[#2d2f36] hover:border-[#4c6ef5]/50 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-sm group"
                >
                  <Upload size={13} className="text-[#8b8d93] group-hover:text-[#4c6ef5] transition-colors" />
                  <span>{selectedNode.data.fileName || selectedNode.data.url ? 'Replace File' : 'Upload File'}</span>
                </button>

                {/* File Format Indicator */}
                <div className="text-[9px] text-[#5c5f66] px-0.5 font-mono flex items-center gap-1">
                  <Info size={10} className="shrink-0 text-[#8b8d93]" />
                  <span>
                    {selectedNode?.type === 'mediaNode' || selectedNode?.type === 'audioNode' || selectedNode?.type === 'videoNode'
                      ? 'Accepts: .mp3, .wav, .flac, .mp4, .webm, .mov'
                      : selectedNode?.type === 'imageNode'
                      ? 'Accepts: .png, .jpg, .gif, .webp, .svg'
                      : 'Accepts: .json, .txt, .csv, .xml, .vtt'}
                  </span>
                </div>

                {selectedNode.data.fileName && (
                  <div className="bg-[#121315] p-2.5 rounded-lg border border-[#2d2f36] text-[10px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#71737c]">Filename:</span>
                      <span className="text-white font-mono truncate max-w-[120px] font-medium">{selectedNode.data.fileName as string}</span>
                    </div>
                    {selectedNode.data.fileSize && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#71737c]">Size:</span>
                        <span className="text-emerald-400 font-mono">{selectedNode.data.fileSize as string}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Layout & Alignment Controls */}
              <div className="pt-3 border-t border-[#2d2f36] space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#8b8d93] block px-0.5">Quick Layout</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={alignNodesHorizontal}
                    className="py-2 px-1 bg-[#212226] hover:bg-[#282a30] text-[#e1e1e1] hover:text-white rounded-lg border border-[#2d2f36] text-[10px] font-medium flex flex-col items-center gap-1 transition-colors"
                    title="Align selected nodes horizontally"
                  >
                    <Rows size={13} className="text-[#4c6ef5]" />
                    <span>Row</span>
                  </button>

                  <button
                    type="button"
                    onClick={alignNodesVertical}
                    className="py-2 px-1 bg-[#212226] hover:bg-[#282a30] text-[#e1e1e1] hover:text-white rounded-lg border border-[#2d2f36] text-[10px] font-medium flex flex-col items-center gap-1 transition-colors"
                    title="Align selected nodes vertically"
                  >
                    <Columns size={13} className="text-[#4c6ef5]" />
                    <span>Col</span>
                  </button>

                  <button
                    type="button"
                    onClick={tidyNodesGrid}
                    className="py-2 px-1 bg-[#212226] hover:bg-[#282a30] text-[#e1e1e1] hover:text-white rounded-lg border border-[#2d2f36] text-[10px] font-medium flex flex-col items-center gap-1 transition-colors"
                    title="Organize into grid layout"
                  >
                    <LayoutGrid size={13} className="text-amber-400" />
                    <span>Grid</span>
                  </button>
                </div>
              </div>

              {/* Clear Canvas Action */}
              <div className="pt-3 border-t border-[#2d2f36] space-y-2">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="w-full py-1.5 px-2.5 bg-red-500/10 hover:bg-red-600/90 text-red-400 hover:text-white rounded-lg border border-red-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Clear Canvas</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4 text-center">
              <div className="py-6 px-3 bg-[#212226] rounded-xl border border-[#2d2f36] text-[#5c5f66] space-y-2">
                <SlidersHorizontal size={24} className="mx-auto text-[#4c6ef5]" />
                <p className="text-xs font-semibold text-[#e1e1e1]">No Node Selected</p>
                <p className="text-[10px] text-[#71737c] leading-relaxed">
                  Click any card on the graph canvas to inspect and edit its properties.
                </p>
              </div>

              {/* Quick Layout & Canvas Actions when no node selected */}
              <div className="pt-2 space-y-2 text-left">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#8b8d93] block px-0.5">Canvas Layout Tools</span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={alignNodesHorizontal}
                    className="w-full py-2 px-2.5 bg-[#212226] hover:bg-[#282a30] text-[#c1c2c5] hover:text-white rounded-lg border border-[#2d2f36] text-[11px] font-medium flex items-center gap-2 transition-colors"
                  >
                    <Rows size={13} className="text-[#4c6ef5]" />
                    <span>Align Nodes Horizontally</span>
                  </button>

                  <button
                    type="button"
                    onClick={alignNodesVertical}
                    className="w-full py-2 px-2.5 bg-[#212226] hover:bg-[#282a30] text-[#c1c2c5] hover:text-white rounded-lg border border-[#2d2f36] text-[11px] font-medium flex items-center gap-2 transition-colors"
                  >
                    <Columns size={13} className="text-[#4c6ef5]" />
                    <span>Align Nodes Vertically</span>
                  </button>

                  <button
                    type="button"
                    onClick={tidyNodesGrid}
                    className="w-full py-2 px-2.5 bg-[#212226] hover:bg-[#282a30] text-[#c1c2c5] hover:text-white rounded-lg border border-[#2d2f36] text-[11px] font-medium flex items-center gap-2 transition-colors"
                  >
                    <LayoutGrid size={13} className="text-amber-400" />
                    <span>Organize into Neat Grid</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#2d2f36] space-y-2 text-left">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="w-full py-2 px-2.5 bg-red-500/10 hover:bg-red-600/90 text-red-400 hover:text-white rounded-lg border border-red-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Clear Canvas</span>
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Footer Status Bar */}
      <footer className="h-6 border-t border-[#333] bg-[#1d1e22] flex items-center justify-between px-3 shrink-0 z-40 select-none">
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-emerald-400 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> 
            Canvas Online
          </span>
          <span className="text-[9px] text-[#5c5f66]">|</span>
          <span className="text-[9px] text-[#a0a0a0]">Project: DEANE_VISUALIZER</span>
        </div>
        <div className="text-[9px] text-[#909296] font-mono">
          Nodes: {nodes.length} | Edges: {edges.length}
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
