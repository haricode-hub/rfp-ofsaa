'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Download, AlertCircle } from 'lucide-react';
import { uploadRfp, generateRfpJson, generateRfpDocx } from '@/lib/api';
import { RfpAnalysis, Proposal } from '@/types';

const RfpProcessor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<RfpAnalysis | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const processRfp = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await uploadRfp(file);
      setAnalysis(result);
      setProposal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const generateProposal = async () => {
    if (!analysis) return;
    setLoading(true);
    setError(null);
    try {
      const meta = clientName || projectTitle ? { client_name: clientName, project_title: projectTitle } : undefined;
      const result = await generateRfpJson({ rfp_text: analysis.rfp_text, meta });
      setProposal(result.proposal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocx = async () => {
    if (!proposal) return;
    setLoading(true);
    try {
      const blob = await generateRfpDocx(proposal);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JMR_Proposal_${proposal.project_title.replace(/\s+/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-blue-50 to-indigo-100" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="container mx-auto p-6 max-w-6xl">
        <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-4xl font-bold mb-2" style={{ color: 'var(--blue-primary)' }}>
              RFP Proposal Generator
            </CardTitle>
            <CardDescription className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Upload your RFP document, get AI-powered analysis, generate professional proposals, and download formatted DOCX files.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {!analysis ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--blue-light)' }}>
                    <Upload className="h-8 w-8 text-blue-600" style={{ color: 'var(--blue-primary)' }} />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2" style={{ color: 'var(--blue-primary)' }}>Upload RFP Document</h3>
                  <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Supported formats: PDF, DOCX, TXT</p>
                </div>
                <div className="space-y-4">
                  <Label htmlFor="file" className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Select RFP File</Label>
                  <div className="flex items-center space-x-4">
                    <Input 
                      id="file" 
                      type="file" 
                      onChange={handleFileUpload} 
                      accept=".pdf,.docx,.txt" 
                      className="flex-1"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                    <Button onClick={processRfp} disabled={!file || loading} className="px-8 py-3" style={{ backgroundColor: 'var(--blue-primary)', color: 'white' }}>
                      <Upload className="mr-2 h-4 w-4" /> Analyze RFP
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Analysis Section */}
                <Card className="shadow-md" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-focus)' }}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <CardTitle className="text-2xl" style={{ color: 'var(--blue-primary)' }}>RFP Analysis Complete</CardTitle>
                    </div>
                    <CardDescription className="flex items-center space-x-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800" style={{ backgroundColor: 'var(--green-light)', color: 'var(--green-primary)' }}>
                        {analysis.classification.category}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        ({analysis.classification.confidence} confidence • {analysis.chars} characters analyzed)
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-lg" style={{ color: 'var(--text-primary)' }}>Executive Summary</h4>
                        <p className="text-gray-700 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {analysis.analysis?.summary || 'No summary available. The RFP appears to be a general request for services.'}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-lg" style={{ color: 'var(--text-primary)' }}>Key Services Required</h4>
                          <ul className="space-y-1">
                            {analysis.analysis?.services.slice(0, 5).map((service, i) => (
                              <li key={i} className="flex items-center space-x-2 text-sm">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span style={{ color: 'var(--text-secondary)' }}>{service}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-lg" style={{ color: 'var(--text-primary)' }}>Functional Requirements</h4>
                          <ul className="space-y-1">
                            {analysis.analysis?.functional_requirements.slice(0, 5).map((req, i) => (
                              <li key={i} className="flex items-center space-x-2 text-sm">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                <span style={{ color: 'var(--text-secondary)' }}>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    {analysis.analysis?.submission.submission_deadline && (
                      <div className="p-4 rounded-lg border-l-4" style={{ backgroundColor: 'var(--yellow-light)', borderLeftColor: 'var(--yellow-primary)', color: 'var(--text-primary)' }}>
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--yellow-primary)' }} />
                          <div>
                            <h4 className="font-semibold" style={{ color: 'var(--yellow-primary)' }}>Submission Deadline</h4>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{analysis.analysis.submission.submission_deadline}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Client & Project Details */}
                <Card className="shadow-md" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                  <CardHeader>
                    <CardTitle className="text-xl" style={{ color: 'var(--blue-primary)' }}>Customize Proposal</CardTitle>
                    <CardDescription style={{ color: 'var(--text-secondary)' }}>Add client and project details for personalized proposal (optional)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Client Name</Label>
                        <Input 
                          value={clientName} 
                          onChange={(e) => setClientName(e.target.value)} 
                          placeholder="e.g., ABC Bank"
                          className="mt-1"
                          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Project Title</Label>
                        <Input 
                          value={projectTitle} 
                          onChange={(e) => setProjectTitle(e.target.value)} 
                          placeholder="e.g., Oracle FLEXCUBE Implementation"
                          className="mt-1"
                          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    </div>
                    <Button onClick={generateProposal} disabled={loading} className="w-full px-8 py-3 text-lg" style={{ backgroundColor: 'var(--blue-primary)', color: 'white' }}>
                      <FileText className="mr-3 h-5 w-5" /> Generate Professional Proposal
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            {proposal && (
              <div className="space-y-6">
                {/* Proposal Preview */}
                <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-success)' }}>
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-6" style={{ backgroundColor: 'var(--green-light)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <CardTitle className="text-2xl" style={{ color: 'var(--green-primary)' }}>Proposal Generated Successfully</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        <span>Validity: {proposal.validity}</span>
                        <span>•</span>
                        <span>Total: ${proposal.commercials.line_items.reduce((sum, item) => sum + (item.qty * item.rate), 0).toLocaleString()} {proposal.commercials.currency}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-6 space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Project Overview</h3>
                          <div className="space-y-2">
                            <p className="text-lg font-medium" style={{ color: 'var(--blue-primary)' }}>{proposal.project_title}</p>
                            <p className="text-gray-600" style={{ color: 'var(--text-secondary)' }}>Prepared for: {proposal.client_name}</p>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{proposal.executive_summary.substring(0, 150)}...</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2 text-lg" style={{ color: 'var(--text-primary)' }}>Project Timeline</h4>
                            <div className="space-y-2">
                              {proposal.timeline.slice(0, 3).map((phase, i) => (
                                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <div>
                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{phase.phase}</p>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{phase.duration}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3 text-lg" style={{ color: 'var(--text-primary)' }}>Scope Highlights</h4>
                          <ul className="space-y-2">
                            {proposal.scope_of_work.slice(0, 4).map((item, i) => (
                              <li key={i} className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3 text-lg" style={{ color: 'var(--text-primary)' }}>Commercial Summary</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600" style={{ color: 'var(--blue-primary)' }}>
                                ${proposal.commercials.line_items.reduce((sum, item) => sum + (item.qty * item.rate), 0).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Subtotal</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-green-600" style={{ color: 'var(--green-primary)' }}>
                                {proposal.commercials.tax_percent}%
                              </p>
                              <p className="text-sm text-gray-600 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Tax Rate</p>
                            </div>
                            <div className="text-center border-l" style={{ borderLeftColor: 'var(--border-color)' }}>
                              <p className="text-sm text-gray-500" style={{ color: 'var(--text-muted)' }}>Net 30 Days</p>
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Payment Terms</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Download Section */}
                <Card className="shadow-md border-0" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                  <CardContent className="p-6 text-center">
                    <Button onClick={downloadDocx} disabled={loading} className="w-full max-w-md mx-auto px-8 py-4 text-lg font-semibold" style={{ backgroundColor: 'var(--green-primary)', color: 'white' }}>
                      <Download className="mr-3 h-5 w-5" /> Download Professional DOCX Proposal
                    </Button>
                    <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      Your proposal is ready for client submission. The document includes all sections, timeline, and commercial details.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            {error && (
              <Card className="border-l-4" style={{ borderLeftColor: 'var(--red-primary)', backgroundColor: 'var(--red-light)' }}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <AlertCircle className="h-6 w-6 mt-0.5 flex-shrink-0 text-red-500" style={{ color: 'var(--red-primary)' }} />
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: 'var(--red-primary)' }}>Processing Error</h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                      <Button variant="outline" onClick={() => setError(null)} className="mt-3" style={{ borderColor: 'var(--red-primary)', color: 'var(--red-primary)' }}>
                        Try Again
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {loading && (
              <Card className="shadow-md" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <CardContent className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" style={{ borderColor: 'var(--blue-primary)' }}></div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--blue-primary)' }}>Generating Proposal</h3>
                  <p className="text-gray-600" style={{ color: 'var(--text-secondary)' }}>Our AI is crafting a professional response. This may take 30-90 seconds...</p>
                  <div className="flex justify-center space-x-1 mt-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ backgroundColor: 'var(--blue-primary)', animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ backgroundColor: 'var(--blue-primary)', animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ backgroundColor: 'var(--blue-primary)', animationDelay: '0.2s' }}></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RfpProcessor;