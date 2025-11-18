'use client';

import React, { useState, useRef } from 'react';
import { Layout, useTheme } from '@/components/ui/Layout';
import {
  ArrowUpTrayIcon,
  CogIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  DocumentIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { uploadRfp, generateRfpJson, generateRfpDocx } from '@/lib/api';
import { RfpAnalysis, Proposal } from '@/types';

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function CustomDropdown({
  options,
  placeholder,
  onSelect,
  className = ''
}: {
  options: string[];
  placeholder: string;
  onSelect: (value: string) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: string) => {
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input flex items-center justify-between w-full text-left"
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          fontWeight: '400'
        }}
      >
        <span style={{ fontSize: '0.875rem' }}>{placeholder}</span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--blue-primary)' }}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 border rounded-lg shadow-lg"
             style={{
               backgroundColor: 'var(--bg-primary)',
               borderColor: 'var(--border-color)',
               boxShadow: '0 10px 25px var(--shadow-color)'
             }}>
          <div className="max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full px-4 py-2 text-left transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontWeight: '400',
                  lineHeight: '1.5'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--blue-light)';
                  e.currentTarget.style.color = 'var(--blue-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

interface RfpUploadResponse {
  ok: boolean;
  chars: number;
  preview: string;
  rfp_text: string;
  classification: {
    category: string;
    confidence: string;
    matched_keywords: string[];
  };
  analysis?: {
    rfp_type: {
      category: string;
      confidence: string;
      matched_keywords: string[];
    };
    summary: string;
    issuing_organization?: string;
    scope?: string;
    functional_requirements: string[];
    technical_requirements: string[];
    services: string[];
    submission: {
      issuance_date?: string;
      submission_deadline?: string;
      clarification_deadline?: string;
      submission_method?: string;
      contacts?: string;
    };
    evaluation_focus: string[];
    optional_components: string[];
    risks: string[];
  };
}

function RfpProcessorContent() {
  const { } = useTheme();
  const [step, setStep] = useState<'upload' | 'analyze' | 'customize' | 'generate' | 'download'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<RfpUploadResponse | null>(null);
  const [clientName, setClientName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/rfp/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload file');
      }

      const result: RfpUploadResponse = await response.json();
      setUploadResponse(result);
      setStep('analyze');
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload RFP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateProposal = async () => {
    if (!uploadResponse) return;

    setIsGenerating(true);
    try {
      const meta = clientName || projectTitle ? { client_name: clientName, project_title: projectTitle } : undefined;
      const response = await fetch('/api/rfp/generate-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rfp_text: uploadResponse.rfp_text, meta }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate proposal');
      }

      const result = await response.json();
      setProposal(result.proposal);
      setStep('download');
    } catch (error) {
      console.error('Generation error:', error);
      alert(`Failed to generate proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStep('customize');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!proposal) return;

    try {
      const response = await fetch('/api/rfp/generate-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proposal),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate DOCX: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `JMR_Proposal_${proposal.project_title.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetProcess = () => {
    setStep('upload');
    setUploadResponse(null);
    setClientName('');
    setProjectTitle('');
    setProposal(null);
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
              RFP Proposal Generator
            </h1>
            <p className="text-xl max-w-2xl mx-auto"
               style={{
                 color: 'var(--text-secondary)'
               }}>
              Transform RFPs into professional proposals with AI-powered analysis and automated document generation.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4">
              {[
                { key: 'upload', label: 'Upload', icon: ArrowUpTrayIcon },
                { key: 'analyze', label: 'Analyze', icon: DocumentIcon },
                { key: 'customize', label: 'Customize', icon: CogIcon },
                { key: 'generate', label: 'Generate', icon: SparklesIcon },
                { key: 'download', label: 'Download', icon: ArrowDownTrayIcon }
              ].map((stepItem, index) => {
                const Icon = stepItem.icon;
                const isActive = step === stepItem.key;
                const isCompleted = ['upload', 'analyze', 'customize', 'generate'].indexOf(step) > ['upload', 'analyze', 'customize', 'generate'].indexOf(stepItem.key as any);

                return (
                  <div key={stepItem.key} className="flex items-center">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full"
                      style={{
                        backgroundColor: isCompleted || isActive
                          ? 'var(--blue-primary)'
                          : 'var(--bg-tertiary)',
                        color: isCompleted || isActive
                          ? 'white'
                          : 'var(--text-secondary)'
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className="ml-2 text-sm font-medium"
                      style={{
                        color: isActive
                          ? 'var(--text-heading)'
                          : 'var(--text-secondary)'
                      }}
                    >
                      {stepItem.label}
                    </span>
                    {index < 4 && (
                      <div className="w-8 h-0.5 mx-4"
                           style={{
                             backgroundColor: isCompleted || isActive ? 'var(--blue-primary)' : 'var(--border-color)'
                           }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Step 1: Upload */}
            {step === 'upload' && (
              <Card className="p-8">
                <div className="text-center">
                  <ArrowUpTrayIcon className="h-12 w-12 mx-auto mb-4"
                                   style={{
                                     color: 'var(--blue-primary)'
                                   }} />
                  <h3 className="text-xl font-semibold mb-4"
                      style={{
                        color: 'var(--blue-primary)'
                      }}>Upload RFP Document</h3>
                  <p className="mb-6"
                     style={{
                       color: 'var(--text-secondary)'
                     }}>
                    Upload your RFP file (PDF, DOCX, or TXT) to begin analysis
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="btn btn-primary btn-lg"
                  >
                    {isUploading ? 'Uploading...' : 'Choose RFP File'}
                  </button>
                </div>
              </Card>
            )}

            {/* Step 2: Analyze */}
            {step === 'analyze' && uploadResponse && (
              <Card className="p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2"
                      style={{
                        color: 'var(--blue-primary)'
                      }}>RFP Analysis</h3>
                  <div className="rounded-lg p-4 mb-6 border-2"
                       style={{
                         backgroundColor: 'var(--blue-light)',
                         borderColor: 'var(--border-focus)',
                         color: 'var(--text-primary)'
                       }}>
                    <p>
                      <strong>Classification:</strong> {uploadResponse.classification.category} ({uploadResponse.classification.confidence} confidence)<br/>
                      <strong>Characters:</strong> {uploadResponse.chars}<br/>
                      <strong>Keywords:</strong> {uploadResponse.classification.matched_keywords.join(', ') || 'None'}
                    </p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold mb-4"
                        style={{
                          color: 'var(--blue-primary)'
                        }}>Executive Summary</h4>
                    <p className="text-gray-700 leading-relaxed mb-6"
                       style={{
                         color: 'var(--text-secondary)'
                       }}>
                      {uploadResponse.analysis?.summary || 'Analysis summary will be generated based on the RFP content.'}
                    </p>

                    <h4 className="text-lg font-semibold mb-4"
                        style={{
                          color: 'var(--blue-primary)'
                        }}>Key Services Required</h4>
                    <ul className="space-y-2 mb-6">
                      {uploadResponse.analysis?.services.slice(0, 5).map((service, i) => (
                        <li key={i} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span style={{ color: 'var(--text-secondary)' }}>{service}</span>
                        </li>
                      )) || <li style={{ color: 'var(--text-secondary)' }}>No services identified</li>}
                    </ul>

                    {uploadResponse.analysis?.submission.submission_deadline && (
                      <div className="p-4 rounded-lg border-l-4 mb-6"
                           style={{
                             backgroundColor: 'var(--yellow-light)',
                             borderLeftColor: 'var(--yellow-primary)',
                             color: 'var(--text-primary)'
                           }}>
                        <div className="flex items-center space-x-3">
                          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--yellow-primary)' }} />
                          <div>
                            <h5 className="font-semibold" style={{ color: 'var(--yellow-primary)' }}>Submission Deadline</h5>
                            <p style={{ color: 'var(--text-secondary)' }}>{uploadResponse.analysis.submission.submission_deadline}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-4"
                        style={{
                          color: 'var(--blue-primary)'
                        }}>Functional Requirements</h4>
                    <ul className="space-y-2 mb-6">
                      {uploadResponse.analysis?.functional_requirements.slice(0, 5).map((req, i) => (
                        <li key={i} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          <span style={{ color: 'var(--text-secondary)' }}>{req}</span>
                        </li>
                      )) || <li style={{ color: 'var(--text-secondary)' }}>No requirements identified</li>}
                    </ul>

                    <h4 className="text-lg font-semibold mb-4"
                        style={{
                          color: 'var(--blue-primary)'
                        }}>Technical Requirements</h4>
                    <ul className="space-y-2">
                      {uploadResponse.analysis?.technical_requirements.slice(0, 5).map((req, i) => (
                        <li key={i} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span style={{ color: 'var(--text-secondary)' }}>{req}</span>
                        </li>
                      )) || <li style={{ color: 'var(--text-secondary)' }}>No technical requirements identified</li>}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    className="btn btn-secondary"
                    onClick={resetProcess}
                  >
                    Upload Different File
                  </button>
                  <button
                    onClick={() => setStep('customize')}
                    className="btn btn-primary"
                  >
                    Continue to Customize
                  </button>
                </div>
              </Card>
            )}

            {/* Step 3: Customize */}
            {step === 'customize' && uploadResponse && (
              <Card className="p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2"
                      style={{
                        color: 'var(--blue-primary)'
                      }}>Customize Your Proposal</h3>
                  <p className="text-sm mb-6"
                     style={{
                       color: 'var(--text-secondary)'
                     }}>
                    Add client and project details to personalize the generated proposal (optional)
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold mb-4"
                        style={{
                          color: 'var(--blue-primary)'
                        }}>Client Information</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2"
                               style={{
                                 color: 'var(--text-primary)'
                               }}>
                          Client Name
                        </label>
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g., ABC National Bank"
                          className="input w-full"
                          style={{
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)'
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2"
                               style={{
                                 color: 'var(--text-primary)'
                               }}>
                          Contact Email (optional)
                        </label>
                        <input
                          type="email"
                          placeholder="e.g., procurement@abcbank.com"
                          className="input w-full"
                          style={{
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-4"
                        style={{
                          color: 'var(--blue-primary)'
                        }}>Project Details</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2"
                               style={{
                                 color: 'var(--text-primary)'
                               }}>
                          Project Title
                        </label>
                        <input
                          type="text"
                          value={projectTitle}
                          onChange={(e) => setProjectTitle(e.target.value)}
                          placeholder="e.g., Oracle FLEXCUBE Core Implementation"
                          className="input w-full"
                          style={{
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)'
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2"
                               style={{
                                 color: 'var(--text-primary)'
                               }}>
                          Project Type
                        </label>
                        <CustomDropdown
                          options={['Implementation', 'Upgrade', 'Consulting', 'Managed Services', 'Resource Augmentation']}
                          placeholder="-- Select Project Type --"
                          onSelect={(value) => console.log('Selected:', value)} // Can be extended
                          className="mb-4"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    className="btn btn-secondary"
                    onClick={resetProcess}
                  >
                    Back to Analysis
                  </button>
                  <button
                    onClick={handleGenerateProposal}
                    disabled={!clientName && !projectTitle}
                    className="btn btn-primary"
                  >
                    Generate Proposal
                  </button>
                </div>
              </Card>
            )}

            {/* Step 4: Generate */}
            {step === 'generate' && uploadResponse && (
              <Card className="p-8">
                <div className="text-center">
                  <div className="spinner w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-4"
                      style={{
                        color: 'var(--blue-primary)'
                      }}>Generating Professional Proposal</h3>
                  <p className="mb-2"
                     style={{
                       color: 'var(--text-secondary)'
                     }}>
                    Our AI is creating a comprehensive response based on your RFP analysis...
                  </p>
                  <p className="text-sm"
                     style={{
                       color: 'var(--text-muted)'
                     }}>
                    This may take 30-90 seconds depending on complexity. Please don't close the page.
                  </p>
                </div>
              </Card>
            )}

            {/* Step 5: Download */}
            {step === 'download' && proposal && (
              <Card className="p-8">
                <div className="text-center">
                  <CheckCircleIcon className="h-12 w-12 mx-auto mb-4"
                                   style={{
                                     color: 'var(--blue-primary)'
                                   }} />
                  <h3 className="text-xl font-semibold mb-4"
                      style={{
                        color: 'var(--blue-primary)'
                      }}>Proposal Generated Successfully!</h3>
                  <div className="rounded-lg p-4 mb-6 border-2"
                       style={{
                         backgroundColor: 'var(--green-light)',
                         borderColor: 'var(--border-success)',
                         color: 'var(--text-primary)'
                       }}>
                    <p>
                      <strong>Project:</strong> {proposal.project_title}<br/>
                      <strong>Client:</strong> {proposal.client_name}<br/>
                      <strong>Total Value:</strong> {proposal.commercials.line_items.reduce((sum, item) => sum + (item.qty * item.rate), 0).toLocaleString()} {proposal.commercials.currency}<br/>
                      <strong>Status:</strong> Ready for client submission
                    </p>
                  </div>

                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleDownload}
                      className="btn btn-primary btn-lg"
                    >
                      Download DOCX Proposal
                    </button>
                    <button
                      onClick={resetProcess}
                      className="btn btn-secondary"
                    >
                      Create Another Proposal
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
                  }}>AI-Powered Analysis</h4>
              <p className="text-sm"
                 style={{
                   color: 'var(--text-secondary)'
                 }}>
                Advanced NLP classification and requirement extraction from RFP documents
              </p>
            </div>

            <div className="card p-6 text-center">
              <h4 className="text-lg font-semibold mb-2"
                  style={{
                    color: 'var(--blue-primary)'
                  }}>Professional Formatting</h4>
              </p>
              <p className="text-sm"
                 style={{
                   color: 'var(--text-secondary)'
                 }}>
                Industry-standard DOCX proposals with all sections and commercial details
              </p>
            </div>

            <div className="card p-6 text-center">
              <h4 className="text-lg font-semibold mb-2"
                  style={{
                    color: 'var(--blue-primary)'
                  }}>Commercial Intelligence</h4>
              <p className="text-sm"
                 style={{
                   color: 'var(--text-secondary)'
                 }}>
                Automated pricing, timeline, and resource planning based on RFP requirements
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RfpProcessor() {
  return (
    <Layout>
      <RfpProcessorContent />
    </Layout>
  );
}