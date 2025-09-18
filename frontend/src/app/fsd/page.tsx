"use client";

import React, { useState } from 'react';
import { Layout, useTheme } from '@/components/ui/Layout';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function FSDGeneratorContent() {
  const { isDarkMode } = useTheme();
  const [requirements, setRequirements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<{
    filename: string;
    blob: Blob;
  } | null>(null);

  const handleGenerate = async () => {
    if (!requirements.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:8000/fsd/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: requirements
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate FSD');
      }

      // Store blob for later download
      const blob = await response.blob();

      // Set state to show success (no auto-download)
      setGeneratedDoc({
        filename: 'fsd_document.docx',
        blob: blob
      });
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
    setRequirements('');
    setGeneratedDoc(null);
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
                <div className="mb-8">
                  <ClipboardDocumentListIcon className="h-12 w-12 mb-4"
                                            style={{
                                              color: 'var(--blue-primary)'
                                            }} />
                  <h3 className="text-xl font-semibold mb-4"
                      style={{
                        color: 'var(--blue-primary)'
                      }}>Enter Your Requirements</h3>
                  <p className="mb-6"
                     style={{
                       color: 'var(--text-secondary)'
                     }}>
                    Describe your project requirements and we'll generate a professional FSD document
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2"
                           style={{
                             color: 'var(--text-primary)'
                           }}>
                      Project Requirements
                    </label>
                    <textarea
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="Describe your project requirements in detail. For example:

- Project objectives and scope
- Functional requirements
- Technical specifications
- Business rules and constraints
- User roles and permissions
- Integration requirements

The more detailed your requirements, the better the generated FSD will be."
                      className="w-full h-64 px-4 py-3 border rounded-lg resize-none"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleGenerate}
                      disabled={!requirements.trim()}
                      className="btn btn-primary btn-lg"
                    >
                      Generate FSD Document
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