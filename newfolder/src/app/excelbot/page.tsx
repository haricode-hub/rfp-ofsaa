"use client";

import React, { useState, useRef } from 'react';
import { Layout, useTheme } from '@/components/ui/Layout';
import { 
  ArrowUpTrayIcon,
  CogIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

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

interface UploadResponse {
  filename: string;
  columns: string[];
  row_count: number;
  original_filename: string;
}

interface ProcessRequest {
  input_columns: string[];
  output_columns: string[];
  filename: string;
  user_prompt: string;
}

interface ProcessResponse {
  message: string;
  processing_stats: {
    total_rows: number;
    cache_entries: number;
    enhancement_features: string[];
  };
  processing_complete: boolean;
  file_id: string;
}

function PresaleAgentContent() {
  const { isDarkMode } = useTheme();
  const [step, setStep] = useState<'upload' | 'configure' | 'process' | 'download'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [inputColumns, setInputColumns] = useState<string[]>([]);
  const [outputColumns, setOutputColumns] = useState<string[]>([]);
  const [userPrompt, setUserPrompt] = useState('');
  const [processResponse, setProcessResponse] = useState<ProcessResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload file');
      }

      const result: UploadResponse = await response.json();
      setUploadResponse(result);
      setStep('configure');
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputColumnAdd = (column: string) => {
    if (column && !inputColumns.includes(column) && !outputColumns.includes(column)) {
      setInputColumns(prev => [...prev, column]);
    }
  };

  const handleOutputColumnAdd = (column: string) => {
    if (column && !outputColumns.includes(column) && !inputColumns.includes(column)) {
      setOutputColumns(prev => [...prev, column]);
    }
  };

  const removeInputColumn = (columnToRemove: string) => {
    setInputColumns(prev => prev.filter(col => col !== columnToRemove));
  };

  const removeOutputColumn = (columnToRemove: string) => {
    setOutputColumns(prev => prev.filter(col => col !== columnToRemove));
  };

  const handleProcess = async () => {
    if (!uploadResponse || inputColumns.length === 0 || outputColumns.length === 0) return;

    setStep('process');
    
    try {
      const requestBody: ProcessRequest = {
        input_columns: inputColumns,
        output_columns: outputColumns,
        filename: uploadResponse.filename,
        user_prompt: userPrompt.trim()
      };

      const response = await fetch('http://localhost:8000/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process file');
      }

      const result: ProcessResponse = await response.json();
      setProcessResponse(result);
      setStep('download');
    } catch (error) {
      console.error('Processing error:', error);
      alert(`Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStep('configure'); // Go back to configure on error
    }
  };

  const handleDownload = async () => {
    if (!processResponse) return;
    
    try {
      // Construct the download URL using the file_id
      const downloadUrl = `http://localhost:8000/download/${processResponse.file_id}`;
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'enhanced_processed_requirements.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetProcess = () => {
    setStep('upload');
    setUploadResponse(null);
    setInputColumns([]);
    setOutputColumns([]);
    setUserPrompt('');
    setProcessResponse(null);
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
              Presale Agent - AI Excel Processing
            </h1>
            <p className="text-xl max-w-2xl mx-auto"
               style={{
                 color: 'var(--text-secondary)'
               }}>
              Process Excel files intelligently with AI and Automate spreadsheet operations effortlessly.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4">
              {[
                { key: 'upload', label: 'Upload', icon: ArrowUpTrayIcon },
                { key: 'configure', label: 'Configure', icon: CogIcon },
                { key: 'process', label: 'Process', icon: SparklesIcon },
                { key: 'download', label: 'Download', icon: ArrowDownTrayIcon }
              ].map((stepItem, index) => {
                const Icon = stepItem.icon;
                const isActive = step === stepItem.key;
                const isCompleted = ['upload', 'configure', 'process'].indexOf(step) > 
                                  ['upload', 'configure', 'process'].indexOf(stepItem.key as 'upload' | 'configure' | 'process');
                
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
                    {index < 3 && (
                      <div className="w-8 h-0.5 mx-4"
                           style={{
                             backgroundColor: 'var(--border-color)'
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
                      }}>Upload Excel File</h3>
                  <p className="mb-6"
                     style={{
                       color: 'var(--text-secondary)'
                     }}>
                    Upload your Excel file (.xlsx or .xls) to get started
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="btn btn-primary btn-lg"
                  >
                    {isUploading ? 'Uploading...' : 'Choose Excel File'}
                  </button>
                </div>
              </Card>
            )}

            {/* Step 2: Configure */}
            {step === 'configure' && uploadResponse && (
              <Card className="p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2"
                      style={{
                        color: 'var(--blue-primary)'
                      }}>Configure Processing</h3>
                  <div className="rounded-lg p-4 mb-6 border-2"
                       style={{
                         backgroundColor: 'var(--blue-light)',
                         borderColor: 'var(--border-focus)',
                         color: 'var(--text-primary)'
                       }}>
                    <p>
                      <strong>File:</strong> {uploadResponse.original_filename}<br/>
                      <strong>Columns:</strong> {uploadResponse.columns.length}<br/>
                      <strong>Rows:</strong> {uploadResponse.row_count}
                    </p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Input Columns Selection */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4"
                        style={{
                          color: 'var(--blue-primary)'
                        }}>Select Input Columns</h4>
                    <p className="text-sm mb-4"
                       style={{
                         color: 'var(--text-secondary)'
                       }}>
                      Choose columns that contain the data you want to process
                    </p>
                    <CustomDropdown
                      options={uploadResponse.columns
                        .filter(column => !inputColumns.includes(column) && !outputColumns.includes(column))}
                      placeholder="-- Add Input Column --"
                      onSelect={handleInputColumnAdd}
                      className="mb-4"
                    />
                    
                    {/* Selected Input Columns */}
                    {inputColumns.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium mb-2"
                            style={{
                              color: 'var(--text-primary)'
                            }}>Selected Input Columns:</h5>
                        <div className="flex flex-wrap gap-2">
                          {inputColumns.map((column) => (
                            <div key={column} className="flex items-center px-3 py-1 rounded-full text-sm border-2"
                                 style={{
                                   backgroundColor: 'var(--tag-selected-bg)',
                                   borderColor: 'var(--tag-selected-border)',
                                   color: 'var(--tag-selected-text)'
                                 }}>
                              <span>{column}</span>
                              <button
                                onClick={() => removeInputColumn(column)}
                                className="ml-2 transition-colors"
                                style={{
                                  color: 'var(--text-remove-button)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = 'var(--text-remove-hover)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = 'var(--text-remove-button)';
                                }}
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Output Columns Selection */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4"
                        style={{
                          color: 'var(--blue-primary)'
                        }}>Select Output Columns</h4>
                    <p className="text-sm mb-4"
                       style={{
                         color: 'var(--text-secondary)'
                       }}>
                      Choose columns where AI-processed results will be stored
                    </p>
                    <CustomDropdown
                      options={uploadResponse.columns
                        .filter(column => !outputColumns.includes(column) && !inputColumns.includes(column))}
                      placeholder="-- Add Output Column --"
                      onSelect={handleOutputColumnAdd}
                      className="mb-4"
                    />
                    
                    {/* Selected Output Columns */}
                    {outputColumns.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium mb-2"
                            style={{
                              color: 'var(--text-primary)'
                            }}>Selected Output Columns:</h5>
                        <div className="flex flex-wrap gap-2">
                          {outputColumns.map((column) => (
                            <div key={column} className="flex items-center px-3 py-1 rounded-full text-sm border-2"
                                 style={{
                                   backgroundColor: 'var(--tag-selected-bg)',
                                   borderColor: 'var(--tag-selected-border)',
                                   color: 'var(--tag-selected-text)'
                                 }}>
                              <span>{column}</span>
                              <button
                                onClick={() => removeOutputColumn(column)}
                                className="ml-2 transition-colors"
                                style={{
                                  color: 'var(--text-remove-button)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = 'var(--text-remove-hover)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = 'var(--text-remove-button)';
                                }}
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Processing Instructions */}
                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-4"
                      style={{
                        color: 'var(--blue-primary)'
                      }}>Processing Instructions (Optional)</h4>
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="Add specific instructions for how you want the data processed. For example:
- Focus on Oracle banking solutions
- Provide detailed compliance analysis  
- Include technical specifications
- Generate vendor response format"
                    className="input h-32 resize-none"
                  />
                  <p className="text-sm mt-2"
                     style={{
                       color: 'var(--text-muted)'
                     }}>
                    Leave blank for default AI processing based on Oracle banking solutions expertise.
                  </p>
                </div>


                <div className="mt-8 flex justify-between">
                  <button
                    className="btn btn-secondary"
                    onClick={resetProcess}
                  >
                    Upload Different File
                  </button>
                  <button
                    onClick={handleProcess}
                    disabled={inputColumns.length === 0 || outputColumns.length === 0}
                    className="btn btn-primary"
                  >
                    Process Data
                  </button>
                </div>
              </Card>
            )}

            {/* Step 3: Processing */}
            {step === 'process' && (
              <Card className="p-8">
                <div className="text-center">
                  <div className="spinner w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-4"
                      style={{
                        color: 'var(--blue-primary)'
                      }}>Processing Your Data</h3>
                  <p className="mb-2"
                     style={{
                       color: 'var(--text-secondary)'
                     }}>
                    Please wait while our AI processes your Excel file with Oracle banking expertise...
                  </p>
                  <p className="text-sm"
                     style={{
                       color: 'var(--text-muted)'
                     }}>
                    This may take several minutes depending on the data size and complexity.
                  </p>
                </div>
              </Card>
            )}

            {/* Step 4: Download */}
            {step === 'download' && processResponse && (
              <Card className="p-8">
                <div className="text-center">
                  <CheckCircleIcon className="h-12 w-12 mx-auto mb-4"
                                   style={{
                                     color: 'var(--blue-primary)'
                                   }} />
                  <h3 className="text-xl font-semibold mb-4"
                      style={{
                        color: 'var(--blue-primary)'
                      }}>Processing Complete!</h3>
                  <div className="rounded-lg p-4 mb-6 border-2"
                       style={{
                         backgroundColor: 'var(--blue-light)',
                         borderColor: 'var(--border-focus)',
                         color: 'var(--blue-primary)'
                       }}>
                    <p>
                      <strong>Message:</strong> {processResponse.message}<br/>
                      <strong>Processed Rows:</strong> {processResponse.processing_stats.total_rows}
                    </p>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleDownload}
                      className="btn btn-primary btn-lg"
                    >
                      Download Processed File
                    </button>
                    <button
                      onClick={resetProcess}
                      className="btn btn-secondary"
                    >
                      Process Another File
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
                  }}>Oracle Banking Expertise</h4>
              <p className="text-sm"
                 style={{
                   color: 'var(--text-secondary)'
                 }}>
                Specialized AI for Oracle FLEXCUBE and other Oracle banking solutions
              </p>
            </div>
            
            <div className="card p-6 text-center">
              <h4 className="text-lg font-semibold mb-2"
                  style={{
                    color: 'var(--blue-primary)'
                  }}>Unbiased Analysis</h4>
              <p className="text-sm"
                 style={{
                   color: 'var(--text-secondary)'
                 }}>
                Evidence-based assessments with web search integration
              </p>
            </div>
            
            <div className="card p-6 text-center">
              <h4 className="text-lg font-semibold mb-2"
                  style={{
                    color: 'var(--blue-primary)'
                  }}>Professional Output</h4>
              <p className="text-sm"
                 style={{
                   color: 'var(--text-secondary)'
                 }}>
                Enhanced Excel formatting with detailed analysis results
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PresaleAgent() {
  return (
    <Layout>
      <PresaleAgentContent />
    </Layout>
  );
}