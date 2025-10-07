"use client";

import React, { useState, useRef } from 'react';
import { Layout, useTheme } from '@/components/ui/Layout';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PaperClipIcon,
  XMarkIcon,
  ArrowRightCircleIcon
} from '@heroicons/react/24/outline';

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function FSDGeneratorContent() {
  const { isDarkMode } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<{
    filename: string;
    blob: Blob;
  } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (allowedTypes.includes(file.type)) {
        setUploadedFile(file);
      } else {
        alert('Please upload a valid file type: PDF or DOCX only');
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!uploadedFile) return;

    setIsGenerating(true);
    try {
      // Generate FSD directly from uploaded file using new endpoint
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const protocol = window.location.protocol;
      const response = await fetch(`${protocol}//192.168.2.95:8505/fsd/generate-from-document`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to generate FSD');
      }

      // Handle document upload response - get JSON with document_id
      const result = await response.json();
      if (result.success && result.document_id) {
        // Download the actual document using the document_id
        const downloadResponse = await fetch(`${protocol}//192.168.2.95:8505/fsd/download/${result.document_id}`);
        if (!downloadResponse.ok) {
          throw new Error('Failed to download generated document');
        }

        const blob = await downloadResponse.blob();
        setGeneratedDoc({
          filename: 'fsd_document.docx',
          blob: blob
        });
      } else {
        throw new Error(result.message || 'Failed to generate FSD');
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert(`Failed to generate FSD: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedDoc) return;

    const url = window.URL.createObjectURL(generatedDoc.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generatedDoc.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setGeneratedDoc(null);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300"
         style={{
           backgroundColor: 'var(--bg-primary)',
           color: 'var(--text-primary)'
         }}>
      <div className="section">
        <div className="section-container">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4"
                style={{
                  color: 'var(--blue-primary)'
                }}>
              FSD Agent - Document Generator
            </h1>
            <p className="text-xl max-w-2xl mx-auto"
               style={{
                 color: 'var(--text-secondary)'
               }}>
              Generate comprehensive Functional Specification Documents from your requirements with AI assistance.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {!generatedDoc && !isGenerating && (
              <Card className="p-8">
                <div className="mb-8 text-center">
                  <h3 className="text-xl font-semibold mb-4"
                      style={{
                        color: 'var(--blue-primary)'
                      }}>Generate Your FSD Document</h3>
                  <p className="mb-6"
                     style={{
                       color: 'var(--text-secondary)'
                     }}>
                    Upload a document and we&apos;ll generate a professional FSD from your content
                  </p>
                </div>

                {/* Unified Input Area */}
                <div className="space-y-4">
                  {/* File Upload Area (only show if no file uploaded) */}
                  {!uploadedFile && (
                    <div
                      onDrop={handleFileDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className="border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200"
                      style={{
                        borderColor: isDragOver ? 'var(--blue-primary)' : 'var(--border-color)',
                        backgroundColor: isDragOver ? 'var(--blue-primary)10' : 'var(--bg-secondary)'
                      }}
                    >
                      <ArrowUpTrayIcon className="h-8 w-8 mx-auto mb-2"
                                       style={{ color: 'var(--text-secondary)' }} />
                      <p className="text-sm mb-2"
                         style={{ color: 'var(--text-secondary)' }}>
                        Drag and drop a document here, or
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm font-medium hover:underline transition-all duration-200"
                        style={{ color: 'var(--blue-primary)' }}
                      >
                        browse files
                      </button>
                      <p className="text-xs mt-2"
                         style={{ color: 'var(--text-muted)' }}>
                        Supports: PDF, DOCX only
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  )}

                  {/* Uploaded File Display */}
                  {uploadedFile && (
                    <div className="flex items-center justify-between p-4 border rounded-lg"
                         style={{
                           backgroundColor: 'var(--bg-secondary)',
                           borderColor: 'var(--border-color)'
                         }}>
                      <div className="flex items-center space-x-3">
                        <PaperClipIcon className="h-5 w-5"
                                       style={{ color: 'var(--blue-primary)' }} />
                        <div>
                          <p className="text-sm font-medium"
                             style={{ color: 'var(--text-primary)' }}>
                            {uploadedFile.name}
                          </p>
                          <p className="text-xs"
                             style={{ color: 'var(--text-secondary)' }}>
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removeFile}
                        className="p-1 rounded transition-colors"
                        style={{
                          color: 'var(--text-secondary)',
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}


                  {/* Generate Button */}
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleGenerate}
                      disabled={!uploadedFile}
                      className={`btn btn-primary btn-lg flex items-center space-x-2 ${
                        !uploadedFile ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <ArrowRightCircleIcon className="h-5 w-5" />
                      <span>Generate FSD Document</span>
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {/* Generating State */}
            {isGenerating && (
              <Card className="p-8">
                <div className="text-center">
                  <div className="spinner w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-4"
                      style={{
                        color: 'var(--blue-primary)'
                      }}>Generating Your FSD Document</h3>
                  <p className="mb-2"
                     style={{
                       color: 'var(--text-secondary)'
                     }}>
                    Please wait while our AI creates your comprehensive Functional Specification Document...
                  </p>
                  <p className="text-sm"
                     style={{
                       color: 'var(--text-muted)'
                     }}>
                    This may take a few minutes depending on the complexity of your requirements.
                  </p>
                </div>
              </Card>
            )}

            {/* Success State */}
            {generatedDoc && (
              <Card className="p-8">
                <div className="text-center">
                  <CheckCircleIcon className="h-12 w-12 mx-auto mb-4"
                                   style={{
                                     color: 'var(--blue-primary)'
                                   }} />
                  <h3 className="text-xl font-semibold mb-4"
                      style={{
                        color: 'var(--blue-primary)'
                      }}>Document Generated Successfully!</h3>
                  <p className="mb-6"
                     style={{
                       color: 'var(--text-secondary)'
                     }}>
                    Your Functional Specification Document has been generated and is ready for download.
                  </p>

                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleDownload}
                      className="btn btn-primary btn-lg"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                      Download FSD Document
                    </button>
                    <button
                      onClick={resetForm}
                      className="btn btn-secondary"
                    >
                      Generate Another FSD
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Features */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="card p-6 text-center">
              <h4 className="text-lg font-semibold mb-2"
                  style={{
                    color: 'var(--blue-primary)'
                  }}>Professional Format</h4>
              <p className="text-sm"
                 style={{
                   color: 'var(--text-secondary)'
                 }}>
                Industry-standard FSD template with comprehensive sections and professional formatting
              </p>
            </div>

            <div className="card p-6 text-center">
              <h4 className="text-lg font-semibold mb-2"
                  style={{
                    color: 'var(--blue-primary)'
                  }}>AI-Powered Analysis</h4>
              <p className="text-sm"
                 style={{
                   color: 'var(--text-secondary)'
                 }}>
                Advanced AI analyzes your requirements and generates detailed specifications
              </p>
            </div>

            <div className="card p-6 text-center">
              <h4 className="text-lg font-semibold mb-2"
                  style={{
                    color: 'var(--blue-primary)'
                  }}>Ready-to-Use Output</h4>
              <p className="text-sm"
                 style={{
                   color: 'var(--text-secondary)'
                 }}>
                Professional Word document with TOC, bookmarks, and structured content
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FSDGenerator() {
  return (
    <Layout>
      <FSDGeneratorContent />
    </Layout>
  );
}