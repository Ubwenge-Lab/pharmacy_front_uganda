'use client';

/**
 * /branch/prescription-upload — Direct Prescription Upload (Uganda)
 * Allows pharmacists / cashiers to photograph or upload a physical
 * prescription on behalf of a walk-in patient, then submit it for
 * AI extraction and pharmacist review.
 */

import { useState, useRef, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/errorHandler';
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  XMarkIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  mrn?: string;
}

interface PrescriptionResult {
  id: string;
  status: string;
  aiProcessingStatus: string;
  fileName: string;
  createdAt: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DirectPrescriptionUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // File
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<PrescriptionResult | null>(null);

  // Walk-in mode (no registered patient — client demand)
  const [walkInMode, setWalkInMode] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');

  // ── Patient search ────────────────────────────────────────────────────────

  const searchPatients = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get('/patients/search', { params: { q } });
      setSearchResults(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setPatientSearch(val);
    searchPatients(val);
  };

  const selectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setPatientSearch('');
    setSearchResults([]);
  };

  // ── File handling ─────────────────────────────────────────────────────────

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return; }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowed.includes(f.type)) { toast.error('Only JPG, PNG, or PDF files accepted'); return; }
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null); // PDF — no preview
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!file) { toast.error('Please select a prescription file'); return; }
    if (!selectedPatient && !walkInMode) { toast.error('Please select a patient or enable walk-in mode'); return; }
    if (walkInMode && !walkInName.trim()) { toast.error('Please enter the patient name'); return; }

    setUploading(true);
    try {
      // Step 1: Upload file → get URL
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/upload/prescription', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { url, fileName, fileType } = uploadRes.data;

      // Step 2: Create prescription record on behalf of patient (or walk-in)
      const prescriptionRes = await api.post('/prescriptions/staff-direct-upload', {
        fileUrl: url,
        fileName,
        fileType,
        patientId: selectedPatient?.id,
        patientName: walkInMode ? walkInName.trim() : undefined,
        patientPhone: walkInMode ? walkInPhone.trim() : undefined,
        notes: notes || undefined,
      });

      setResult(prescriptionRes.data.prescription);
      toast.success('Prescription uploaded and queued for review!');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setSelectedPatient(null);
    setNotes('');
    setResult(null);
    setPatientSearch('');
    setSearchResults([]);
    setWalkInMode(false);
    setWalkInName('');
    setWalkInPhone('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Success state ─────────────────────────────────────────────────────────

  if (result) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <CheckCircleIcon className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-green-800 mb-2">Prescription Submitted</h2>
          <p className="text-green-700 text-sm mb-1">
            File: <span className="font-medium">{result.fileName}</span>
          </p>
          <p className="text-green-700 text-sm mb-1">
            Status: <span className="font-medium">{result.status}</span>
          </p>
          <p className="text-green-600 text-xs mt-2">
            {result.aiProcessingStatus === 'PROCESSING' || result.aiProcessingStatus === 'PENDING'
              ? 'AI is extracting medications from the prescription. A pharmacist will review shortly.'
              : 'Prescription queued for pharmacist review.'}
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-2.5 bg-brand-teal text-white rounded-xl font-medium text-sm hover:bg-brand-teal/90 transition-colors"
            >
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <DocumentTextIcon className="w-7 h-7 text-brand-teal" />
          Upload Physical Prescription
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Scan or photograph a patient's physical prescription. AI will extract medications for pharmacist review.
        </p>
      </div>

      <div className="space-y-5">

        {/* Patient selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 dark:text-white">1. Select Patient</h2>
            <button
              onClick={() => { setWalkInMode(v => !v); setSelectedPatient(null); setPatientSearch(''); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${walkInMode ? 'bg-brand-teal text-white border-brand-teal' : 'text-gray-500 border-gray-300 dark:border-gray-600 hover:border-brand-teal hover:text-brand-teal'}`}
            >
              {walkInMode ? 'Registered patient' : 'Walk-in patient'}
            </button>
          </div>

          {walkInMode ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Patient name (e.g., John Mugisha)"
                value={walkInName}
                onChange={e => setWalkInName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
              <input
                type="tel"
                placeholder="Phone (e.g., 2567XXXXXXXX) — optional"
                value={walkInPhone}
                onChange={e => setWalkInPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
              <p className="text-xs text-gray-400">
                A guest patient record is created automatically — no registration needed.
              </p>
            </div>
          ) : selectedPatient ? (
            <div className="flex items-center justify-between bg-brand-teal/10 border border-brand-teal/30 rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-gray-800 dark:text-white">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
                <p className="text-xs text-gray-500">{selectedPatient.phone}{selectedPatient.mrn ? ` · MRN: ${selectedPatient.mrn}` : ''}</p>
              </div>
              <button onClick={() => setSelectedPatient(null)}
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <XMarkIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                {searching && <ArrowPathIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
                <input
                  type="text"
                  placeholder="Search by name, phone, or MRN..."
                  value={patientSearch}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                  {searchResults.slice(0, 6).map(p => (
                    <button
                      key={p.id}
                      onClick={() => selectPatient(p)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-gray-400">{p.phone}{p.mrn ? ` · MRN: ${p.mrn}` : ''}</p>
                    </button>
                  ))}
                </div>
              )}
              {patientSearch.length >= 2 && searchResults.length === 0 && !searching && (
                <p className="text-xs text-gray-400 mt-2">No patients found. Register the patient first if needed.</p>
              )}
            </div>
          )}
        </div>

        {/* File upload */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-3">2. Upload Prescription</h2>

          {file ? (
            <div className="flex items-start gap-4">
              {preview ? (
                <img src={preview} alt="Prescription preview" className="w-28 h-28 object-cover rounded-xl border border-gray-200" />
              ) : (
                <div className="w-28 h-28 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                  <DocumentTextIcon className="w-10 h-10 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB · {file.type}</p>
                <button
                  onClick={() => { setFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="mt-3 text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                >
                  <XMarkIcon className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-brand-teal hover:bg-brand-teal/5 transition-colors"
            >
              <div className="flex justify-center gap-3 mb-3">
                <ArrowUpTrayIcon className="w-8 h-8 text-gray-300" />
                <CameraIcon className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, or PDF · Max 10MB</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-3">3. Notes <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
          <textarea
            rows={3}
            placeholder="E.g., patient presents with fever, doctor's name, date of prescription..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={uploading || !file || (!selectedPatient && !walkInMode) || (walkInMode && !walkInName.trim())}
          className="w-full py-4 rounded-xl bg-brand-teal hover:bg-brand-teal/90 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <ArrowUpTrayIcon className="w-5 h-5" /> Submit Prescription
            </>
          )}
        </button>
      </div>
    </div>
  );
}
