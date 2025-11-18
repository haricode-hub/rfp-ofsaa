'use client';

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Download, AlertCircle } from 'lucide-react';
import { uploadRfp, generateRfpJson, generateRfpDocx } from '@/lib/api';
import { RfpAnalysis, Proposal, GenerateJsonResponse } from '@/types';

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
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>RFP Proposal Generator</CardTitle>
          <CardDescription>Upload RFP, analyze, generate proposal JSON, and download DOCX</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!analysis ? (
            <div className="space-y-4">
              <Label htmlFor="file">Upload RFP File (PDF, DOCX, TXT)</Label>
              <div className="flex items-center space-x-4">
                <Input id="file" type="file" onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
                <Button onClick={processRfp} disabled={!file || loading}>
                  <Upload className="mr-2 h-4 w-4" /> Analyze RFP
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>RFP Analysis</CardTitle>
                  <CardDescription>{analysis.classification.category} ({analysis.classification.confidence} confidence)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="font-semibold">Summary:</h4>
                    <p className="text-sm">{analysis.analysis?.summary || 'No summary available'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold">Services:</h4>
                      <ul className="list-disc pl-4">
                        {analysis.analysis?.services.slice(0, 5).map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold">Requirements:</h4>
                      <ul className="list-disc pl-4">
                        {analysis.analysis?.functional_requirements.slice(0, 5).map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  </div>
                  {analysis.analysis?.submission.submission_deadline && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      <strong>Deadline:</strong> {analysis.analysis.submission.submission_deadline}
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="space-y-2">
                <Label>Client Name (optional)</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Enter client name" />
                <Label>Project Title (optional)</Label>
                <Input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Enter project title" />
              </div>
              <Button onClick={generateProposal} disabled={loading} className="w-full">
                <FileText className="mr-2 h-4 w-4" /> Generate Proposal JSON
              </Button>
            </div>
          )}
          {proposal && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Generated Proposal</CardTitle>
                  <CardDescription>Preview and download as DOCX</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Project: {proposal.project_title}</h4>
                      <p className="text-sm text-muted-foreground">Client: {proposal.client_name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-semibold">Scope Highlights:</h5>
                        <ul className="list-disc pl-4 text-sm">
                          {proposal.scope_of_work.slice(0, 3).map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold">Timeline:</h5>
                        <ul className="text-sm">
                          {proposal.timeline.map((phase, i) => (
                            <li key={i}>{phase.phase}: {phase.duration}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-blue-50 p-2 rounded">
                        <strong>Total:</strong> ${proposal.commercials.line_items.reduce((sum, item) => sum + (item.qty * item.rate), 0).toLocaleString()}
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <strong>Tax:</strong> {proposal.commercials.tax_percent}%
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <strong>Validity:</strong> {proposal.validity}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Button onClick={downloadDocx} disabled={loading} className="w-full">
                <Download className="mr-2 h-4 w-4" /> Download DOCX Proposal
              </Button>
            </div>
          )}
          {error && (
            <Card>
              <CardContent className="p-4 bg-red-50 border-red-200">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}
          {loading && (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p>Processing...</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RfpProcessor;