'use client';

import React, { useState, useRef, useCallback } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

export interface Issue {
  id: string;
  pinX: number; // Normalized 0..1
  pinY: number; // Normalized 0..1
  title: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  type: string;
}

interface BlueprintViewerProps {
  blueprintUrl: string;
  existingIssues?: Issue[];
  onPinAdd?: (x: number, y: number) => void;
  readOnly?: boolean;
}

const priorityColors: Record<Issue['priority'], string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-green-500',
};

const priorityBorders: Record<Issue['priority'], string> = {
  Critical: 'border-red-600',
  High: 'border-orange-600',
  Medium: 'border-yellow-600',
  Low: 'border-green-600',
};

const TOOLTIP_DISPLAY_DURATION = 2000; // milliseconds

export default function BlueprintViewer({
  blueprintUrl,
  existingIssues = [],
  onPinAdd,
  readOnly = false,
}: BlueprintViewerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (readOnly || !onPinAdd || !imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Ensure coordinates are within bounds
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        onPinAdd(x, y);
      }
    },
    [readOnly, onPinAdd]
  );

  const handleZoomIn = () => {
    transformRef.current?.zoomIn(0.5);
  };

  const handleZoomOut = () => {
    transformRef.current?.zoomOut(0.5);
  };

  const handleReset = () => {
    transformRef.current?.resetTransform();
  };

  if (imageError) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[400px] bg-gray-100 rounded-lg">
        <div className="text-center p-6">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load blueprint</h3>
          <p className="mt-1 text-sm text-gray-500">The image could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-900 rounded-lg overflow-hidden">
      {/* Loading State */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-sm text-gray-600">Loading blueprint...</p>
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="bg-white hover:bg-gray-100 text-gray-800 rounded-lg p-3 shadow-lg transition-colors"
          aria-label="Zoom in"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white hover:bg-gray-100 text-gray-800 rounded-lg p-3 shadow-lg transition-colors"
          aria-label="Zoom out"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={handleReset}
          className="bg-white hover:bg-gray-100 text-gray-800 rounded-lg p-3 shadow-lg transition-colors"
          aria-label="Reset view"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Instructions */}
      {!readOnly && onPinAdd && imageLoaded && (
        <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
          <p className="text-sm text-gray-700 font-medium">Tap to add issue pin</p>
        </div>
      )}

      {/* Transform Wrapper for Zoom and Pan */}
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.5}
        maxScale={5}
        limitToBounds={true}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
        doubleClick={{ disabled: true }}
        panning={{
          velocityDisabled: false,
          excluded: readOnly ? [] : ['input', 'textarea', 'button', 'select'],
        }}
      >
        <TransformComponent
          wrapperClass="!w-full !h-full"
          contentClass="!w-full !h-full flex items-center justify-center"
        >
          <div className="relative inline-block">
            {/* Blueprint Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={blueprintUrl}
              alt="Blueprint"
              className={`max-w-full max-h-full object-contain select-none ${
                !readOnly && onPinAdd ? 'cursor-crosshair' : 'cursor-move'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              onClick={handleImageClick}
              draggable={false}
            />

            {/* Existing Issue Pins */}
            {imageLoaded &&
              existingIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="absolute transform -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${issue.pinX * 100}%`,
                    top: `${issue.pinY * 100}%`,
                  }}
                  onMouseEnter={() => setHoveredPin(issue.id)}
                  onMouseLeave={() => setHoveredPin(null)}
                  onTouchStart={() => setHoveredPin(issue.id)}
                  onTouchEnd={() => setTimeout(() => setHoveredPin(null), TOOLTIP_DISPLAY_DURATION)}
                >
                  {/* Pin Icon */}
                  <div className="relative">
                    <svg
                      className={`w-8 h-8 drop-shadow-lg ${priorityColors[issue.priority]} rounded-full p-1 border-2 ${priorityBorders[issue.priority]}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>

                    {/* Tooltip */}
                    {hoveredPin === issue.id && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 pointer-events-none z-30">
                        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl">
                          <div className="font-semibold mb-1">{issue.title}</div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">{issue.type}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-white text-xs font-medium ${priorityColors[issue.priority]}`}
                            >
                              {issue.priority}
                            </span>
                          </div>
                          {/* Tooltip Arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                            <div className="border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
