import React, { useState, useRef } from 'react';
import { X, Upload, FileCheck, AlertCircle, CheckCircle2, Loader2, Database, Bug as BugIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';
import type { TestCase, Bug, User, Priority, Severity, AutomationStatus, BugStatus } from '../types';

interface ImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
  users: User[];
  testCases: TestCase[];
}

type ImportType = 'Test Cases' | 'Bugs';

export default function ImportModal({ onClose, onSuccess, users, testCases }: ImportModalProps) {
  const [importType, setImportType] = useState<ImportType>('Test Cases');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [summary, setSummary] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndParseFile(selectedFile);
  };

  const validateAndParseFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isValidExtension = extension === 'xlsx' || (importType === 'Bugs' && extension === 'csv');
    if (!isValidExtension) {
      setError('The uploaded file format is not supported. Please upload a valid .xlsx file.');
      setFile(null);
      setPreviewData([]);
      return;
    }

    setError(null);
    setFile(file);
    setSummary(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const type = extension === 'csv' ? 'string' : 'array';
        const input = extension === 'csv'
          ? new TextDecoder().decode(e.target?.result as ArrayBuffer)
          : new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(input, { type });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setError('The uploaded file is empty or contains invalid data.');
          return;
        }

        validateTemplate(jsonData);
      } catch (err) {
        setError('Error reading file. Please ensure it is a valid .xlsx or .csv file.');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateTemplate = (data: any[]) => {
    const headers = Object.keys(data[0]);
    let requiredColumns: string[] = [];

    if (importType === 'Test Cases') {
      requiredColumns = ['ID', 'Title', 'Test Steps', 'Expected Result'];
    } else {
      // Jira/Bug columns (flexible mapping)
      requiredColumns = ['Summary', 'Severity', 'Priority', 'Status']; // Minimal requirements
    }

    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
       if (importType === 'Test Cases') {
         setError('Uploaded file does not match the required template.');
         return;
       }
    }

    if (missingColumns.length > 0 && importType === 'Test Cases') {
       setError('Missing required columns in uploaded file.');
       return;
    }
    // Preview removed, just set file and state
    setPreviewData(data);
  };

  const mapJiraData = (jiraBug: any) => {
    // Map Jira keys to our Bug type
    // Link issue ID and issue key together
    const issueKey = jiraBug['Issue key'] || jiraBug['Key'] || jiraBug['Bug ID / Issue Key'] || '';
    const issueId = jiraBug['ID'] || jiraBug['Issue ID'] || '';
    const bugId = issueKey || issueId || `BUG-${Date.now()}`;
    const linkedId = issueKey && issueId ? `${issueKey}-${issueId}` : bugId;
    
    return {
      id: linkedId,
      title: jiraBug['Summary'] || jiraBug['Title / Summary'] || 'No Summary',
      description: jiraBug['Description'] || '',
      status: mapJiraStatus(jiraBug['Status']),
      severity: jiraBug['Custom field (Severity)'] || jiraBug['Severity'] || 'Major',
      priority: jiraBug['Priority'] || 'Medium',
      assigneeId: jiraBug['Assignee'] ? users.find(u => u.name === jiraBug['Assignee'])?.id || null : null,
      qaId: jiraBug['Reporter'] ? users.find(u => u.name === jiraBug['Reporter'])?.id || null : null,
      testCaseId: jiraBug['Linked Test Case ID'] || null,
      reopenCount: parseInt(jiraBug['Reopen Count'] || '0'),
      createdAt: jiraBug['Created'] ? new Date(jiraBug['Created']).toISOString() : new Date().toISOString(),
      updatedAt: jiraBug['Updated'] ? new Date(jiraBug['Updated']).toISOString() : new Date().toISOString(),
    };
  };

  const mapJiraStatus = (status: string): BugStatus => {
    const s = (status || '').toLowerCase();
    if (s.includes('todo') || s.includes('open') || s.includes('new')) return 'Todo';
    if (s.includes('progress')) return 'In Progress';
    if (s.includes('build') || s.includes('fixed')) return 'Ready for Build';
    if (s.includes('reopen')) return 'Reopen';
    if (s.includes('done') || s.includes('closed') || s.includes('resolved')) return 'Done';
    return 'Todo';
  };

  const handleImport = async () => {
    if (!file || previewData.length === 0) return;

    setLoading(true);
    setSummary(null);

    let finalData = [];
    let endpoint = '';

    // Use the previewData already parsed during validation
    if (importType === 'Test Cases') {
      endpoint = '/api/test-cases/bulk';
      finalData = previewData.map((row: any) => ({
        id: row['ID'],
        module: row['Module Name'] || row['Module'] || 'Uncategorized',
        feature: row['Feature'] || null,
        title: row['Title'],
        preconditions: row['Preconditions'] || null,
        steps: row['Test Steps'] || row['Steps to Test'],
        expectedResult: row['Expected Result'],
        automationStatus: row['Method'] || 'Manual',
        updatedAt: new Date().toISOString()
      }));
    } else {
      endpoint = '/api/bugs/bulk';
      finalData = previewData.map(mapJiraData);
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: finalData, overwrite })
      });

      const result = await response.json();
      setSummary({
        success: result.successCount || 0,
        failed: result.failedCount || 0,
        errors: result.errors || []
      });
      
      if (result.successCount > 0) {
        onSuccess();
        // Clear file and preview states to remove the "preview" UI
        setFile(null);
        setPreviewData([]);
      }
    } catch (err) {
      setError('Network error during import.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
               <Upload className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Import Data</h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Bulk Upload from Excel (.xlsx)</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Type Toggle */}
          {!summary && (
            <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
              <button 
                onClick={() => { setImportType('Test Cases'); setFile(null); setPreviewData([]); setError(null); }}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  importType === 'Test Cases' ? "bg-white text-indigo-600 shadow-sm border border-indigo-100" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Database className="w-4 h-4" /> Test Cases
              </button>
              <button 
                onClick={() => { setImportType('Bugs'); setFile(null); setPreviewData([]); setError(null); }}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  importType === 'Bugs' ? "bg-white text-rose-600 shadow-sm border border-rose-100" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <BugIcon className="w-4 h-4" /> Bugs (Jira Export)
              </button>
            </div>
          )}

          {summary ? (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[24px] text-center">
                 <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                 <h3 className="text-xl font-black text-emerald-900 mb-2">Import Complete</h3>
                 <div className="flex justify-center gap-8 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-black text-emerald-600">{summary.success}</div>
                      <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Successfully Imported</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-rose-600">{summary.failed}</div>
                      <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Failed/Skipped</div>
                    </div>
                 </div>
              </div>
              
              {summary.errors.length > 0 && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-[24px]">
                  <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest mb-3">Error Log</h4>
                  <ul className="space-y-2">
                    {summary.errors.slice(0, 10).map((err, i) => (
                      <li key={i} className="text-xs font-bold text-rose-700 flex items-start gap-2">
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {err}
                      </li>
                    ))}
                    {summary.errors.length > 10 && (
                      <li className="text-[10px] text-rose-400 font-bold uppercase tracking-widest pl-5">And {summary.errors.length - 10} more errors...</li>
                    )}
                  </ul>
                </div>
              )}

              <button 
                onClick={onClose}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                Close & Refresh
              </button>
            </div>
          ) : (
            <>
              {/* Drag & Drop Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-[32px] p-12 text-center cursor-pointer transition-all flex flex-col items-center group",
                  file ? "border-indigo-200 bg-indigo-50/30" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
                )}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept={importType === 'Bugs' ? '.xlsx,.csv' : '.xlsx'} onChange={handleFileChange} />
                <div className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center mb-4 transition-all",
                  file ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500"
                )}>
                  {file ? <FileCheck className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">{file ? file.name : `Click to upload ${importType} XLSX`}</h3>
                <p className="text-sm text-slate-500 font-medium">{file ? `${(file.size / 1024).toFixed(1)} KB` : 'Only .xlsx files are supported. Drag and drop also works.'}</p>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {previewData.length > 0 && !error && (
                <div className="space-y-4">
                  <div className="pt-4 flex gap-4">
                    <button 
                      onClick={() => { setFile(null); setPreviewData([]); setError(null); }}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={handleImport}
                      disabled={loading}
                      className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:bg-indigo-300 disabled:shadow-none flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Import ${previewData.length} Records`
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
