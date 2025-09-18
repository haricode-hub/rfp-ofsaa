"use client";

import React, { useState } from 'react';
import { Layout, useTheme } from '@/components/ui/Layout';
import { 
  ClipboardDocumentListIcon
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
      const response = await fetch('http://localhost:8000/generate-fsd', {
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
      alert('Failed to generate FSD document. Please try again.');
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
            <h1 className="heading-1 mb-4">
              FSD Agent
            </h1>
            <p className="body-text-large max-w-2xl mx-auto">
              Generate comprehensive Functional Specification Documents from your requirements. 
              Professional formatting with advanced Word document features.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {!generatedDoc ? (
              <Card className="p-10">
                <div className="max-w-3xl mx-auto">
                  {/* Input Section */}
                  <div>
                    <div className="flex items-center mb-6">
                      <ClipboardDocumentListIcon 
                        className="h-7 w-7 mr-3"
                        style={{ color: 'var(--text-heading)' }}
                      />
                      <h3 className="heading-2">
                        Requirements Input
                      </h3>
                    </div>
                    
                    <div className="form-group mb-8">
                      <label className="form-label mb-3">
                        Project Requirements
                      </label>
                      <textarea
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        placeholder="Enter your project requirements, features, and specifications..."
                        className="input h-80 resize-none text-base leading-relaxed"
                      />
                      <div className="form-help mt-3">
                        Provide detailed requirements including system overview, features, technical specs, and constraints.
                      </div>
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={!requirements.trim() || isGenerating}
                      className="btn btn-primary btn-lg button-text w-full text-lg"
                    >
                      {isGenerating ? 'Generating FSD...' : 'Generate FSD Document'}
                    </button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-8">
                <div className="text-center">
                  <h3 className="heading-3 mb-4">
                    FSD Document Generated!
                  </h3>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleDownload}
                      className="btn btn-primary btn-lg button-text"
                    >
                      Download FSD Document
                    </button>
                    <button
                      onClick={() => {
                        setGeneratedDoc(null);
                        setRequirements('');
                      }}
                      className="btn btn-secondary button-text"
                    >
                      Generate Another Document
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Features */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <h4 className="heading-3 mb-2">
                AI-Generated Content
              </h4>
              <p className="small-text">
                Intelligent analysis of requirements with comprehensive specifications
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <h4 className="heading-3 mb-2">
                Professional Formatting
              </h4>
              <p className="small-text">
                Table of contents, headers, bookmarks, and enterprise-ready layout
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <h4 className="heading-3 mb-2">
                Complete Sections
              </h4>
              <p className="small-text">
                All standard FSD sections from architecture to implementation
              </p>
            </Card>
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