"use client";

import { useState, useRef } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            PDF Reader
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload your PDF to view and analyze its content
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <label
                className="flex flex-col items-center px-4 py-6 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg shadow-lg tracking-wide border border-blue-500 dark:border-blue-600 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg
                  className="w-8 h-8 text-blue-500"
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
                <span className="mt-2 text-sm">
                  {file ? file.name : "Select a PDF file"}
                </span>
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
        </div>

        {/* PDF Viewer */}
        {file && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page {pageNumber} of {numPages}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  onClick={() => setPageNumber((page) => Math.max(page - 1, 1))}
                  disabled={pageNumber <= 1}
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  onClick={() =>
                    setPageNumber((page) => Math.min(page + 1, numPages || 1))
                  }
                  disabled={pageNumber >= (numPages || 1)}
                >
                  Next
                </button>
              </div>
            </div>
            <div className="flex justify-center relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              )}
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                className="max-w-full"
              >
                <Page
                  pageNumber={pageNumber}
                  className="max-w-full"
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
