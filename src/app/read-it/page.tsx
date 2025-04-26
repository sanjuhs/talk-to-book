"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

export default function ReadIt() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"single" | "double" | "strip">(
    "single"
  );
  const [scaleMode, setScaleMode] = useState<
    "width" | "height" | "both" | "none" | "custom"
  >("width");
  const [customScale, setCustomScale] = useState<number>(1.0);
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [pageContext, setPageContext] = useState(2);
  const [parseMethod, setParseMethod] = useState<"gpt" | "direct">("direct");
  const [isTalking, setIsTalking] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [isNotesPanelMinimized, setIsNotesPanelMinimized] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [showTalkButton, setShowTalkButton] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Voice and memory shortcuts
      if (e.key.toLowerCase() === "x" || e.key.toLowerCase() === "t") {
        setIsTalking(true);
      } else if (e.key.toLowerCase() === "z" || e.key === "Escape") {
        setIsTalking(false);
      } else if (e.key.toLowerCase() === "m") {
        // Handle memory dictation
        console.log("Memory dictation activated");
      }

      // Navigation with arrow keys
      if (file && numPages) {
        const pdfContainer = document.querySelector(".pdf-container");

        if (viewMode === "strip" && pdfContainer) {
          // In strip mode, use arrow keys for scrolling
          switch (e.key) {
            case "ArrowLeft":
              pdfContainer.scrollBy({ left: -50, behavior: "smooth" });
              break;
            case "ArrowRight":
              pdfContainer.scrollBy({ left: 50, behavior: "smooth" });
              break;
            case "ArrowUp":
              pdfContainer.scrollBy({ top: -100, behavior: "smooth" });
              break;
            case "ArrowDown":
              pdfContainer.scrollBy({ top: 100, behavior: "smooth" });
              break;
          }
        } else {
          // In single or double page mode, use arrow keys for page navigation
          switch (e.key) {
            case "ArrowLeft":
            case "ArrowUp":
              if (pageNumber > 1) {
                setPageNumber((prev) => prev - 1);
              }
              break;
            case "ArrowRight":
            case "ArrowDown":
              if (pageNumber < numPages) {
                setPageNumber((prev) => prev + 1);
              }
              break;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [file, numPages, pageNumber, viewMode]);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files[0]) {
      setIsLoading(true);
      setFile(files[0]);
      setPageNumber(1);
    }
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
  }

  function onDocumentLoadError() {
    setIsLoading(false);
    alert("Error loading PDF file. Please try again.");
  }

  // Calculate scale based on selected mode
  const getScale = () => {
    if (!pdfContainerRef.current) return 1;

    const container = pdfContainerRef.current;
    const containerWidth = container.clientWidth - (isSidebarOpen ? 320 : 0);
    const containerHeight = container.clientHeight;

    switch (scaleMode) {
      case "width":
        return containerWidth / 800; // Approximate PDF width
      case "height":
        return containerHeight / 1100; // Approximate PDF height
      case "both":
        return Math.min(containerWidth / 800, containerHeight / 1100);
      case "none":
        return 1;
      case "custom":
        return customScale;
      default:
        return 1;
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-900 flex flex-col h-screen overflow-hidden"
      ref={pdfContainerRef}
    >
      {/* Top Menu Bar */}
      <div className="bg-gray-800 border-b border-gray-700 py-2 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-white">Talk To Book</h1>
        </div>

        <div className="flex items-center space-x-4">
          {file && <span className="text-gray-300 text-sm">{file.name}</span>}
          {!file && (
            <label className="px-4 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer">
              Upload PDF
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={onFileChange}
              />
            </label>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* PDF Viewer */}
        <div
          className={`flex-1 overflow-auto bg-gray-900 relative ${
            isSidebarOpen ? "mr-80" : ""
          }`}
        >
          {!file && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="max-w-md text-center p-8 bg-gray-800 rounded-xl shadow-lg">
                <svg
                  className="w-16 h-16 text-indigo-500 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h2 className="text-2xl font-bold text-white mb-2">
                  No PDF Loaded
                </h2>
                <p className="text-gray-400 mb-6">
                  Upload a PDF to start reading and analyzing its content
                </p>
                <label className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 cursor-pointer inline-block">
                  Select PDF File
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={onFileChange}
                  />
                </label>
              </div>
            </div>
          )}

          {file && (
            <>
              {/* Progress bar */}
              {showProgressBar && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-10">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                    style={{
                      width: `${(pageNumber / (numPages || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              )}

              <div className="flex justify-center items-center min-h-full p-4 pdf-container">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
                  </div>
                )}

                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  className="max-w-full max-h-full"
                >
                  {viewMode === "single" && (
                    <Page
                      pageNumber={pageNumber}
                      className="max-w-full"
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      scale={getScale()}
                    />
                  )}

                  {viewMode === "double" && (
                    <div className="flex gap-2">
                      <Page
                        pageNumber={pageNumber}
                        className="max-w-full"
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        scale={getScale() * 0.8}
                      />
                      {pageNumber + 1 <= (numPages || 1) && (
                        <Page
                          pageNumber={pageNumber + 1}
                          className="max-w-full"
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          scale={getScale() * 0.8}
                        />
                      )}
                    </div>
                  )}

                  {viewMode === "strip" && (
                    <div className="flex flex-col gap-4">
                      {Array.from(
                        new Array(Math.min(5, numPages || 0)),
                        (_, index) => (
                          <Page
                            key={`page_${pageNumber + index}`}
                            pageNumber={pageNumber + index}
                            className="max-w-full"
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            scale={getScale() * 0.9}
                          />
                        )
                      )}
                    </div>
                  )}
                </Document>
              </div>

              {/* Page navigation controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-gray-800/80 px-4 py-2 rounded-full">
                <button
                  className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
                  onClick={() => setPageNumber(1)}
                  disabled={pageNumber <= 1}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
                  onClick={() => setPageNumber((page) => Math.max(page - 1, 1))}
                  disabled={pageNumber <= 1}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <div className="text-white text-sm">
                  <span className="font-medium">{pageNumber}</span>
                  <span className="mx-1">/</span>
                  <span>{numPages}</span>
                </div>

                <button
                  className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
                  onClick={() =>
                    setPageNumber((page) => Math.min(page + 1, numPages || 1))
                  }
                  disabled={pageNumber >= (numPages || 1)}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
                  onClick={() => numPages && setPageNumber(numPages)}
                  disabled={!numPages || pageNumber >= numPages}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Notes Panel */}
        {showNotesPanel && (
          <div
            className={`w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto fixed right-80 top-[3.5rem] bottom-0 transition-all duration-300 z-50 ${
              isSidebarOpen ? "translate-x-0" : "translate-x-full"
            } ${
              isNotesPanelMinimized ? "h-12 overflow-hidden" : ""
            }`}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Notes</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setIsNotesPanelMinimized(!isNotesPanelMinimized)}
                    className="text-gray-400 hover:text-white"
                    title={isNotesPanelMinimized ? "Expand" : "Minimize"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isNotesPanelMinimized ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      )}
                    </svg>
                  </button>
                  <button 
                    onClick={() => setShowNotesPanel(false)}
                    className="text-gray-400 hover:text-white"
                    title="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {!isNotesPanelMinimized && (
                <>
                  <div className="bg-gray-700 rounded-lg p-3 mb-4">
                    <textarea
                      className="w-full h-96 bg-gray-700 text-white resize-none outline-none"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notes will appear here as you interact with the document..."
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button 
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                      onClick={() => {
                        // In the future, this could trigger an API call to save notes
                        alert("Notes saved!");
                      }}
                    >
                      Save Notes
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Sidebar */}
        <div
          className={`w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto fixed right-0 top-[3.5rem] bottom-0 transition-transform duration-300 z-50 ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-gray-400 hover:text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {file && numPages && (
              <div className="mb-6">
                <div className="text-gray-300 mb-2 font-medium">
                  Current Page: {pageNumber} / {numPages}
                </div>
                <div className="text-gray-400 text-sm">Chapter: -</div>
              </div>
            )}

            <div className="space-y-6">
              {/* Parse Method */}
              <div>
                <h3 className="text-white font-medium mb-2">Parse Method</h3>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1.5 rounded text-sm ${
                      parseMethod === "gpt"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                    onClick={() => setParseMethod("gpt")}
                  >
                    Parse with GPT
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded text-sm ${
                      parseMethod === "direct"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                    onClick={() => setParseMethod("direct")}
                  >
                    Parse PDF directly
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  {parseMethod === "gpt"
                    ? "Good for PDFs with many images"
                    : "Standard PDF parsing"}
                </p>
              </div>

              {/* View Settings */}
              <div>
                <h3 className="text-white font-medium mb-2">View Settings</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className={`px-3 py-1.5 rounded text-sm ${
                      viewMode === "single"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                    onClick={() => setViewMode("single")}
                  >
                    Single Page
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded text-sm ${
                      viewMode === "double"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                    onClick={() => setViewMode("double")}
                  >
                    Double Page
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded text-sm ${
                      viewMode === "strip"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                    onClick={() => setViewMode("strip")}
                  >
                    Long Strip
                  </button>
                </div>
              </div>

              {/* Scale Settings */}
              <div>
                <h3 className="text-white font-medium mb-2">Scale</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    className={`px-3 py-1.5 rounded text-sm ${
                      scaleMode === "width"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                    onClick={() => setScaleMode("width")}
                  >
                    Fit Width
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded text-sm ${
                      scaleMode === "height"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                    onClick={() => setScaleMode("height")}
                  >
                    Fit Height
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded text-sm ${
                      scaleMode === "both"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                    onClick={() => setScaleMode("both")}
                  >
                    Fit Both
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded text-sm ${
                      scaleMode === "none"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                    onClick={() => setScaleMode("none")}
                  >
                    No Limit
                  </button>
                </div>
                
                {/* Zoom Slider */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white text-sm font-medium">Custom Zoom</h4>
                    <span className="text-gray-300 text-xs">{Math.round(customScale * 100)}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      className="p-1 bg-gray-700 text-white rounded hover:bg-gray-600 focus:outline-none"
                      onClick={() => {
                        setCustomScale(Math.max(0.1, customScale - 0.1));
                        setScaleMode("custom");
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={customScale}
                      onChange={(e) => {
                        setCustomScale(parseFloat(e.target.value));
                        setScaleMode("custom");
                      }}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <button 
                      className="p-1 bg-gray-700 text-white rounded hover:bg-gray-600 focus:outline-none"
                      onClick={() => {
                        setCustomScale(Math.min(3, customScale + 0.1));
                        setScaleMode("custom");
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">Progress Bar</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={showProgressBar}
                      onChange={() => setShowProgressBar(!showProgressBar)}
                    />
                    <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Page Context */}
              <div>
                <h3 className="text-white font-medium mb-2">
                  Page Context (+/-)
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    className="px-2 py-1 bg-gray-700 text-white rounded"
                    onClick={() => setPageContext(Math.max(0, pageContext - 1))}
                  >
                    -
                  </button>
                  <span className="text-white">{pageContext}</span>
                  <button
                    className="px-2 py-1 bg-gray-700 text-white rounded"
                    onClick={() => setPageContext(pageContext + 1)}
                  >
                    +
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  Context pages to include
                </p>
              </div>

              {/* Instructions */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-white font-medium mb-2">
                  Keyboard Shortcuts
                </h3>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li className="flex justify-between">
                    <span>Start talking:</span>
                    <span className="text-gray-300 font-mono">X or T</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Stop talking:</span>
                    <span className="text-gray-300 font-mono">Z or Esc</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Save memory:</span>
                    <span className="text-gray-300 font-mono">M</span>
                  </li>
                </ul>
              </div>

              {/* Notes Toggle */}
              <div className="mt-6 border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">Notes Panel</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={showNotesPanel}
                      onChange={() => setShowNotesPanel(!showNotesPanel)}
                    />
                    <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  Show notes panel for this document
                </p>
              </div>
              
              {/* Voice Status */}
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isTalking ? "bg-green-500 animate-pulse" : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-gray-300">
                    {isTalking ? "Voice Active" : "Voice Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle sidebar button */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed right-4 top-20 bg-gray-800 text-white p-2 rounded-full shadow-lg z-50"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        )}
      </div>
      
      {/* Floating Talk Button */}
      <div 
        className="fixed bottom-6 right-6 z-50"
        onMouseEnter={() => setShowTalkButton(true)}
        onMouseLeave={() => !isTalking && setShowTalkButton(false)}
      >
        <button
          className={`p-3 rounded-full shadow-lg transition-all duration-300 ${isTalking ? 'bg-green-500 scale-110' : 'bg-indigo-600 hover:bg-indigo-700'} ${showTalkButton || isTalking ? 'opacity-100' : 'opacity-20'}`}
          onClick={() => setIsTalking(!isTalking)}
        >
          {isTalking ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
        {showTalkButton && (
          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-white bg-gray-800 px-2 py-1 rounded text-xs whitespace-nowrap">
            Press X to talk
          </span>
        )}
      </div>
    </div>
  );
}
