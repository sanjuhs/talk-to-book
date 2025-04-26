"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import RealtimeVoice from "@/components/RealtimeVoice";

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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [transcriptionResults, setTranscriptionResults] = useState<{
    [key: number]: string;
  }>({});
  const [isTranscriptionComplete, setIsTranscriptionComplete] = useState(false);
  const [transcriptionData, setTranscriptionData] = useState<{
    [key: number]: { content: string };
  }>({});
  const [showTranscriptionAccordion, setShowTranscriptionAccordion] =
    useState(false);
  const [transcriptionContent, setTranscriptionContent] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [useCustomApiKey, setUseCustomApiKey] = useState<boolean>(false);
  const [isTalkingActive, setIsTalkingActive] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [voiceResponse, setVoiceResponse] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Voice and memory shortcuts
      if (e.key.toLowerCase() === "x" || e.key.toLowerCase() === "t") {
        setIsTalking(true);
        setIsTalkingActive(true);
      } else if (e.key.toLowerCase() === "z" || e.key === "Escape") {
        setIsTalking(false);
        setIsTalkingActive(false);
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

    // If GPT parsing is enabled, start transcription when document loads
    if (parseMethod === "gpt" && file) {
      startGptParsing(numPages);
    }
  }

  function onDocumentLoadError() {
    setIsLoading(false);
    alert("Error loading PDF file. Please try again.");
  }

  // Function to download transcription in different formats
  const downloadTranscription = (format: "txt" | "md" | "json") => {
    if (
      Object.keys(transcriptionResults).length === 0 &&
      Object.keys(transcriptionData).length === 0
    ) {
      alert("No transcription data available to download.");
      return;
    }

    let content = "";
    let filename = `${file?.name.replace(".pdf", "") || "transcription"}`;
    let mimeType = "";

    if (format === "json") {
      // Format as JSON
      content = JSON.stringify(transcriptionData, null, 2);
      filename += ".json";
      mimeType = "application/json";
    } else if (format === "md") {
      // Format as Markdown
      content = Object.entries(transcriptionResults)
        .sort(([aKey], [bKey]) => parseInt(aKey) - parseInt(bKey))
        .map(([, text]) => text)
        .join("\n\n---\n\n");
      filename += ".md";
      mimeType = "text/markdown";
    } else {
      // Format as plain text
      content = Object.entries(transcriptionData)
        .sort(([aKey], [bKey]) => parseInt(aKey) - parseInt(bKey))
        .map(([key, data]) => `--- Page ${key} ---\n\n${data.content}`)
        .join("\n\n");
      filename += ".txt";
      mimeType = "text/plain";
    }

    // Create a blob and download it
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to extract text directly from PDF using PDFjs
  async function extractPdfText(totalPages: number) {
    if (!file || !totalPages) return;

    setIsTranscribing(true);
    setTranscriptionProgress(0);
    setTranscriptionResults({});
    setTranscriptionData({});
    setIsTranscriptionComplete(false);
    setTranscriptionContent("Starting direct PDF text extraction...");
    setShowTranscriptionAccordion(true);

    try {
      // Load the PDF document
      const loadingTask = pdfjs.getDocument(URL.createObjectURL(file));
      const pdf = await loadingTask.promise;

      // Process pages in parallel batches
      const batchSize = 10; // Process 10 pages at a time for direct extraction
      const batches = Math.ceil(totalPages / batchSize);

      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const startPage = batchIndex * batchSize + 1;
        const endPage = Math.min(startPage + batchSize - 1, totalPages);

        // Create an array of promises for this batch
        const batchPromises = [];

        for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
          batchPromises.push(extractPageText(pdf, pageNum));
        }

        // Wait for all pages in this batch to be processed
        await Promise.all(batchPromises);

        // Update progress
        setTranscriptionProgress((endPage / totalPages) * 100);

        // Update transcription content with progress
        setTranscriptionContent((prevContent) => {
          const progressUpdate = `Extraction progress: ${Math.round(
            (endPage / totalPages) * 100
          )}% (${endPage}/${totalPages} pages)`;
          return prevContent.includes("Extraction progress:")
            ? prevContent.replace(/Extraction progress:.*/, progressUpdate)
            : `${progressUpdate}\n\n${prevContent}`;
        });
      }

      // Compile all extraction results
      const compiledText = Object.entries(transcriptionResults)
        .sort(([aKey], [bKey]) => parseInt(aKey) - parseInt(bKey))
        .map(([, text]) => text)
        .join("\n\n---\n\n");

      setTranscriptionContent((prevContent) => {
        return (
          prevContent.replace(/Extraction progress:.*/, "") +
          "\n\n✅ Text extraction complete! Here is the full text:\n\n" +
          compiledText
        );
      });

      // Show notes panel with transcription accordion
      if (!showNotesPanel) {
        setShowNotesPanel(true);
      }

      setIsTranscriptionComplete(true);
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      setTranscriptionContent(
        (prevContent) =>
          prevContent +
          `\n\nError extracting PDF text: ${
            error instanceof Error ? error.message : String(error)
          }`
      );
    } finally {
      setIsTranscribing(false);
    }
  }

  // Extract text from a single page using PDFjs
  async function extractPageText(pdf: pdfjs.PDFDocumentProxy, pageNum: number) {
    try {
      // Get the page
      const page = await pdf.getPage(pageNum);

      // Extract text content
      const textContent = await page.getTextContent();

      // Combine the text items into a single string
      let pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");

      // Format the text (basic cleanup)
      pageText = pageText.replace(/\s+/g, " ").trim();

      // Store the extraction result
      setTranscriptionResults((prev) => ({
        ...prev,
        [pageNum]: `## Page ${pageNum}\n\n${pageText}`,
      }));

      // Store structured data
      setTranscriptionData((prev) => ({
        ...prev,
        [pageNum]: { content: pageText },
      }));

      return pageText;
    } catch (error) {
      console.error(`Error extracting text from page ${pageNum}:`, error);
      setTranscriptionResults((prev) => ({
        ...prev,
        [pageNum]: `## Page ${pageNum}\n\n*Error extracting text from this page: ${
          error instanceof Error ? error.message : String(error)
        }*`,
      }));

      setTranscriptionData((prev) => ({
        ...prev,
        [pageNum]: {
          content: `Error extracting text: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      }));

      return null;
    }
  }

  // Function to start GPT parsing of PDF pages
  async function startGptParsing(totalPages: number) {
    if (!file || !totalPages) return;

    setIsTranscribing(true);
    setTranscriptionProgress(0);
    setTranscriptionResults({});
    setTranscriptionData({});
    setIsTranscriptionComplete(false);
    setTranscriptionContent("Starting PDF transcription with GPT...");
    setShowTranscriptionAccordion(true);

    try {
      // Process pages in parallel batches
      const batchSize = 5; // Process 5 pages at a time
      const batches = Math.ceil(totalPages / batchSize);

      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const startPage = batchIndex * batchSize + 1;
        const endPage = Math.min(startPage + batchSize - 1, totalPages);

        // Create an array of promises for this batch
        const batchPromises = [];

        for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
          batchPromises.push(processPage(pageNum));
        }

        // Wait for all pages in this batch to be processed
        await Promise.all(batchPromises);

        // Update progress
        setTranscriptionProgress((endPage / totalPages) * 100);

        // Update transcription content with progress
        setTranscriptionContent((prevContent) => {
          const progressUpdate = `Transcription progress: ${Math.round(
            (endPage / totalPages) * 100
          )}% (${endPage}/${totalPages} pages)`;
          return prevContent.includes("Transcription progress:")
            ? prevContent.replace(/Transcription progress:.*/, progressUpdate)
            : `${progressUpdate}\n\n${prevContent}`;
        });
      }

      // Compile all transcription results
      const compiledText = Object.entries(transcriptionResults)
        .sort(([aKey], [bKey]) => parseInt(aKey) - parseInt(bKey))
        .map(([, text]) => text)
        .join("\n\n---\n\n");

      setTranscriptionContent((prevContent) => {
        return (
          prevContent.replace(/Transcription progress:.*/, "") +
          "\n\n✅ Transcription complete! Here is the full text:\n\n" +
          compiledText
        );
      });

      // Show notes panel with transcription accordion
      if (!showNotesPanel) {
        setShowNotesPanel(true);
      }

      setIsTranscriptionComplete(true);
    } catch (error) {
      console.error("Error processing PDF:", error);
      setTranscriptionContent(
        (prevContent) =>
          prevContent +
          `\n\nError processing PDF: ${
            error instanceof Error ? error.message : String(error)
          }`
      );
    } finally {
      setIsTranscribing(false);
    }
  }

  // Process a single page with GPT
  async function processPage(pageNum: number) {
    try {
      // Create a new canvas for this page to avoid reuse errors
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not create canvas context");
      }

      // Load the PDF document for this specific page
      const loadingTask = pdfjs.getDocument(URL.createObjectURL(file!));
      const pdf = await loadingTask.promise;

      // Get the page
      const page = await pdf.getPage(pageNum);

      // Set canvas dimensions to match page size
      const viewport = page.getViewport({ scale: 1.5 }); // Higher scale for better quality
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render the page to canvas
      await page.render({ canvasContext: context, viewport }).promise;

      // Convert canvas to base64 image
      const imageData = canvas.toDataURL("image/png");

      // Send to transcription API
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageData,
          prompt: `This is page ${pageNum} of a PDF document. Please transcribe all text accurately, preserving paragraphs, headings, and formatting. Include any relevant text from diagrams, tables, or figures.`,
          apiKey: useCustomApiKey ? apiKey : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      // Store the transcription result
      setTranscriptionResults((prev) => ({
        ...prev,
        [pageNum]: `## Page ${pageNum}\n\n${result.transcription}`,
      }));

      // Store structured data
      setTranscriptionData((prev) => ({
        ...prev,
        [pageNum]: { content: result.transcription },
      }));

      return result.transcription;
    } catch (error) {
      console.error(`Error processing page ${pageNum}:`, error);
      setTranscriptionResults((prev) => ({
        ...prev,
        [pageNum]: `## Page ${pageNum}\n\n*Error transcribing this page: ${
          error instanceof Error ? error.message : String(error)
        }*`,
      }));

      setTranscriptionData((prev) => ({
        ...prev,
        [pageNum]: {
          content: `Error transcribing page: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      }));

      return null;
    }
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

  const toggleTalking = () => {
    setIsTalking(!isTalking);
    setIsTalkingActive(!isTalkingActive);
    if (isTalkingActive) {
      // Reset voice conversation when stopping
      setVoiceTranscript("");
      setVoiceResponse("");
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
            } ${isNotesPanelMinimized ? "h-12 overflow-hidden" : ""}`}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Notes</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setIsNotesPanelMinimized(!isNotesPanelMinimized)
                    }
                    className="text-gray-400 hover:text-white"
                    title={isNotesPanelMinimized ? "Expand" : "Minimize"}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {isNotesPanelMinimized ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowNotesPanel(false)}
                    className="text-gray-400 hover:text-white"
                    title="Close"
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
              </div>

              {!isNotesPanelMinimized && (
                <>
                  {/* User Notes Section */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Your Notes
                    </h3>
                    <div className="bg-gray-700 rounded-lg p-3">
                      <textarea
                        className="w-full h-48 bg-gray-700 text-white resize-none outline-none"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add your notes here..."
                      />
                    </div>

                    <div className="flex justify-end mt-2">
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
                  </div>

                  {/* Voice conversation */}
                  {isTalkingActive && (
                    <div className="border-t border-gray-700 mt-4">
                      <div className="p-4 cursor-pointer flex justify-between items-center">
                        <h3 className="text-lg font-semibold">
                          Voice Conversation
                        </h3>
                      </div>
                      <div className="p-4 border-t border-gray-700">
                        <div className="space-y-4">
                          {voiceTranscript && (
                            <div className="bg-gray-700 p-3 rounded-lg">
                              <p className="text-sm text-gray-400 mb-1">
                                You said:
                              </p>
                              <p className="text-white">{voiceTranscript}</p>
                            </div>
                          )}
                          {voiceResponse && (
                            <div className="bg-blue-900 p-3 rounded-lg">
                              <p className="text-sm text-blue-300 mb-1">
                                AI response:
                              </p>
                              <p className="text-white">{voiceResponse}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transcription Accordion */}
                  {(isTranscribing || isTranscriptionComplete) && (
                    <div className="mt-6">
                      <div
                        className="flex justify-between items-center bg-gray-700 p-3 rounded-t cursor-pointer"
                        onClick={() =>
                          setShowTranscriptionAccordion(
                            !showTranscriptionAccordion
                          )
                        }
                      >
                        <h3 className="text-lg font-semibold text-white">
                          Transcription
                        </h3>
                        <svg
                          className={`w-5 h-5 text-gray-400 transform transition-transform ${
                            showTranscriptionAccordion ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>

                      {showTranscriptionAccordion && (
                        <div className="bg-gray-700 rounded-b p-3">
                          {isTranscribing && (
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Transcribing...</span>
                                <span>
                                  {Math.round(transcriptionProgress)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-600 rounded-full h-2">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${transcriptionProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          <textarea
                            className="w-full h-64 bg-gray-600 text-white p-2 rounded resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm"
                            value={transcriptionContent}
                            onChange={(e) =>
                              setTranscriptionContent(e.target.value)
                            }
                            readOnly={isTranscribing}
                            placeholder="Transcription will appear here..."
                          ></textarea>

                          {isTranscriptionComplete && (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <button
                                className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-500 text-xs font-medium transition-colors"
                                onClick={() => downloadTranscription("txt")}
                              >
                                Download TXT
                              </button>
                              <button
                                className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-500 text-xs font-medium transition-colors"
                                onClick={() => downloadTranscription("md")}
                              >
                                Download MD
                              </button>
                              <button
                                className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-500 text-xs font-medium transition-colors"
                                onClick={() => downloadTranscription("json")}
                              >
                                Download JSON
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
                    disabled={isTranscribing}
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
                    disabled={isTranscribing}
                  >
                    Parse PDF directly
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  {parseMethod === "gpt"
                    ? "Good for PDFs with many images"
                    : "Standard PDF parsing"}
                </p>

                {/* Transcription Progress */}
                {isTranscribing && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Transcribing PDF...</span>
                      <span>{Math.round(transcriptionProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${transcriptionProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* API Key Input */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white text-sm font-medium">
                      Custom API Key
                    </h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={useCustomApiKey}
                        onChange={() => setUseCustomApiKey(!useCustomApiKey)}
                        disabled={isTranscribing}
                      />
                      <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {useCustomApiKey && (
                    <div className="mt-2">
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your OpenAI API key"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={isTranscribing}
                      />
                      <p className="text-gray-500 text-xs mt-1">
                        Your API key is used only for this session and not
                        stored
                      </p>
                    </div>
                  )}

                  {/* Transcription Buttons */}
                  {parseMethod === "gpt" &&
                    file &&
                    numPages &&
                    !isTranscribing && (
                      <button
                        className="mt-3 w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium transition-colors"
                        onClick={() => startGptParsing(numPages)}
                      >
                        Start GPT Transcription ({numPages} pages)
                      </button>
                    )}

                  {parseMethod === "direct" &&
                    file &&
                    numPages &&
                    !isTranscribing && (
                      <button
                        className="mt-3 w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium transition-colors"
                        onClick={() => extractPdfText(numPages)}
                      >
                        Extract Text Directly ({numPages} pages)
                      </button>
                    )}

                  {/* Download Buttons */}
                  {isTranscriptionComplete && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-white text-sm font-medium mb-2">
                        Download Transcription
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          className="px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 text-xs font-medium transition-colors"
                          onClick={() => downloadTranscription("txt")}
                        >
                          Download TXT
                        </button>
                        <button
                          className="px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 text-xs font-medium transition-colors"
                          onClick={() => downloadTranscription("md")}
                        >
                          Download MD
                        </button>
                        <button
                          className="px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 text-xs font-medium transition-colors"
                          onClick={() => downloadTranscription("json")}
                        >
                          Download JSON
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
                    <h4 className="text-white text-sm font-medium">
                      Custom Zoom
                    </h4>
                    <span className="text-gray-300 text-xs">
                      {Math.round(customScale * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-1 bg-gray-700 text-white rounded hover:bg-gray-600 focus:outline-none"
                      onClick={() => {
                        setCustomScale(Math.max(0.1, customScale - 0.1));
                        setScaleMode("custom");
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
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
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
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
          className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
            isTalking
              ? "bg-green-500 scale-110"
              : "bg-indigo-600 hover:bg-indigo-700"
          } ${showTalkButton || isTalking ? "opacity-100" : "opacity-20"}`}
          onClick={toggleTalking}
        >
          {isTalking ? (
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </button>
        {showTalkButton && (
          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-white bg-gray-800 px-2 py-1 rounded text-xs whitespace-nowrap">
            Press X to talk
          </span>
        )}
      </div>

      {/* RealtimeVoice component */}
      <RealtimeVoice
        isActive={isTalkingActive}
        onStart={() => {
          console.log("Voice conversation started");
          setShowNotesPanel(true);
          setIsNotesPanelMinimized(false);
        }}
        onStop={() => console.log("Voice conversation stopped")}
        onTranscript={(text) => setVoiceTranscript(text)}
        onResponse={(text) => setVoiceResponse(text)}
        apiKey={useCustomApiKey ? apiKey : undefined}
        // setIsTalkingActive={setIsTalkingActive}
        pageContext={{
          currentPage: pageNumber,
          totalPages: numPages || 0,
          pageContent: transcriptionData[pageNumber]?.content || "",
          surroundingPagesContent: {
            ...(pageNumber > 1
              ? {
                  [pageNumber - 1]:
                    transcriptionData[pageNumber - 1]?.content || "",
                }
              : {}),
            ...(pageNumber < (numPages || 0)
              ? {
                  [pageNumber + 1]:
                    transcriptionData[pageNumber + 1]?.content || "",
                }
              : {}),
          },
        }}
      />
    </div>
  );
}
