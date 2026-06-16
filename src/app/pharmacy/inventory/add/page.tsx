'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TableCellsIcon,
  DocumentTextIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { useState, useRef } from 'react';
import { useMedicationForm } from '@/hooks/useMedicationForm';
import { FDA_CATEGORIES } from '@/lib/constants';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/errorHandler';

type Mode = 'manual' | 'upload';
type FileType = 'csv' | 'excel' | 'docx';

interface ParsedRow {
  name: string;
  chemicalName: string;
  category: string;
  price: string;
  quantity: string;
  lowStockThreshold: string;
  requiresPrescription: string;
  description: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  _errors: string[];
}

interface UploadResult {
  created: number;
  updated: number;
  errors: { row: number; name: string; error: string }[];
}

const CSV_HEADERS = [
  'name', 'chemicalName', 'category', 'price', 'quantity',
  'lowStockThreshold', 'requiresPrescription', 'description',
  'manufacturer', 'batchNumber', 'expiryDate',
];

const EXAMPLE_ROW =
  'Paracetamol 500mg,Acetaminophen,Analgesics & Pain Relief,500,100,10,false,Pain reliever for adults,Cipla Ltd,BATCH001,2026-12-31';

// ── Normalise a header string so casing / spaces don't matter ──────────────
function normalizeKey(s: string): string {
  return (s ?? '').toLowerCase().replace(/[\s_\-()]/g, '').replace(/[^a-z]/g, '');
}

// ── Validate & build a ParsedRow from a flat key→value record ─────────────
function buildRow(record: Record<string, string>): ParsedRow {
  const get = (key: string) => record[normalizeKey(key)] ?? '';
  const row: ParsedRow = {
    name: get('name'),
    chemicalName: get('chemicalname'),
    category: get('category'),
    price: get('price'),
    quantity: get('quantity'),
    lowStockThreshold: get('lowstockthreshold') || '10',
    requiresPrescription: get('requiresprescription') || 'false',
    description: get('description'),
    manufacturer: get('manufacturer'),
    batchNumber: get('batchnumber'),
    expiryDate: get('expirydate'),
    _errors: [],
  };
  if (!row.name) row._errors.push('bulkUploadPage.nameRequired');
  if (!row.category) row._errors.push('bulkUploadPage.categoryRequired');
  if (!row.price || isNaN(parseFloat(row.price)) || parseFloat(row.price) < 0)
    row._errors.push('bulkUploadPage.validPriceRequired');
  if (!row.quantity || isNaN(parseInt(row.quantity)) || parseInt(row.quantity) < 0)
    row._errors.push('bulkUploadPage.validQuantityRequired');
  return row;
}

// ── CSV parser (handles quoted fields containing commas) ───────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

function parseCSVText(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(normalizeKey);
  return lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const vals = parseCSVLine(line);
      const record: Record<string, string> = {};
      headers.forEach((h, i) => { record[h] = vals[i] ?? ''; });
      return buildRow(record);
    })
    .filter(r => r.name || r.category || r.price);
}

// ── Excel parser (SheetJS) ─────────────────────────────────────────────────
async function parseExcelBuffer(buffer: ArrayBuffer): Promise<ParsedRow[]> {
  const mod = await import('xlsx');
  const XLSX = mod.default ?? mod;
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return raw.map(record => {
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(record)) {
      const val = v instanceof Date
        ? v.toISOString().split('T')[0]
        : String(v ?? '');
      normalized[normalizeKey(k)] = val;
    }
    return buildRow(normalized);
  }).filter(r => r.name || r.category || r.price);
}

// ── DOCX parser (mammoth → HTML → table) ─────────────────────────────────
async function parseDocxBuffer(buffer: ArrayBuffer): Promise<ParsedRow[]> {
  const mammoth = (await import('mammoth')).default;
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buffer });
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) throw new Error('No table found in the Word document. Make sure your data is inside a Word table.');
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length < 2) return [];
  const headers = Array.from(rows[0].querySelectorAll('td,th'))
    .map(c => normalizeKey(c.textContent?.trim() ?? ''));
  return rows.slice(1).map(row => {
    const cells = Array.from(row.querySelectorAll('td,th')).map(c => c.textContent?.trim() ?? '');
    const record: Record<string, string> = {};
    headers.forEach((h, i) => { record[h] = cells[i] ?? ''; });
    return buildRow(record);
  }).filter(r => r.name || r.category || r.price);
}

// ── Template downloads ─────────────────────────────────────────────────────
function downloadCSVTemplate() {
  const blob = new Blob([`${CSV_HEADERS.join(',')}\n${EXAMPLE_ROW}\n`], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: 'medication_template.csv',
  });
  a.click(); URL.revokeObjectURL(a.href);
}

async function downloadExcelTemplate() {
  const mod = await import('xlsx');
  const XLSX = mod.default ?? mod;
  const ws = XLSX.utils.aoa_to_sheet([
    CSV_HEADERS,
    EXAMPLE_ROW.split(','),
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Medications');
  XLSX.writeFile(wb, 'medication_template.xlsx');
}

// ── File-type metadata (hintKey references i18n key) ────────────────────
const FILE_TYPES: { id: FileType; label: string; ext: string; accept: string; icon: React.ElementType; hintKey: string }[] = [
  {
    id: 'csv',
    label: 'CSV',
    ext: '.csv',
    accept: '.csv,text/csv',
    icon: DocumentIcon,
    hintKey: 'bulkUploadPage.csvHint',
  },
  {
    id: 'excel',
    label: 'Excel',
    ext: '.xlsx / .xls',
    accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    icon: TableCellsIcon,
    hintKey: 'bulkUploadPage.excelHint',
  },
  {
    id: 'docx',
    label: 'Word',
    ext: '.docx',
    accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    icon: DocumentTextIcon,
    hintKey: 'bulkUploadPage.docxHint',
  },
];

// ─────────────────────────────────────────────────────────────────────────
export default function AddMedicationPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('manual');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { form, setForm, loading, contextLoading: branchesLoading, branches, handleSubmit } =
    useMedicationForm('pharmacy');

  // ── Bulk upload state ─────────────────────────────────────────────────
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const validRows = parsedRows.filter(r => r._errors.length === 0);
  const invalidRows = parsedRows.filter(r => r._errors.length > 0);

  function resetFile() {
    setFileName('');
    setParsedRows([]);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function selectFileType(ft: FileType) {
    if (ft !== fileType) resetFile();
    setFileType(ft);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !fileType) return;
    setFileName(file.name);
    setUploadResult(null);
    setParsing(true);
    try {
      let rows: ParsedRow[] = [];
      if (fileType === 'csv') {
        const text = await file.text();
        rows = parseCSVText(text);
      } else {
        const buf = await file.arrayBuffer();
        if (fileType === 'excel') rows = await parseExcelBuffer(buf);
        else rows = await parseDocxBuffer(buf);
      }
      setParsedRows(rows);
      if (rows.length === 0) toast.error(t('bulkUploadPage.noDataRows'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('bulkUploadPage.failedToParse'));
      setFileName('');
    } finally {
      setParsing(false);
      e.target.value = '';
    }
  }

  function handleTemplateDownload() {
    if (fileType === 'csv') downloadCSVTemplate();
    else if (fileType === 'excel') downloadExcelTemplate();
    else toast(t('bulkUploadPage.wordTableHint', { columns: CSV_HEADERS.join(', ') }), { icon: 'ℹ️', duration: 6000 });
  }

  async function handleBulkSubmit() {
    if (!form.branchId) { toast.error(t('bulkUploadPage.selectBranchFirst')); return; }
    if (validRows.length === 0) { toast.error(t('bulkUploadPage.noValidRows')); return; }
    setBulkLoading(true);
    try {
      const res = await api.post('/medications/bulk', {
        branchId: form.branchId,
        medications: validRows.map(r => ({
          name: r.name,
          chemicalName: r.chemicalName || undefined,
          category: r.category,
          price: parseFloat(r.price),
          quantity: parseInt(r.quantity),
          lowStockThreshold: r.lowStockThreshold ? parseInt(r.lowStockThreshold) : 10,
          requiresPrescription: r.requiresPrescription.toLowerCase() === 'true',
          description: r.description || undefined,
          manufacturer: r.manufacturer || undefined,
          batchNumber: r.batchNumber || undefined,
          expiryDate: r.expiryDate || undefined,
        })),
      }, { timeout: 120_000 }); // 2-min timeout for large batch DB writes
      setUploadResult(res.data);
      const { created, updated, errors } = res.data as UploadResult;
      toast.success(errors.length === 0
        ? t('bulkUploadPage.doneMsg', { created, updated })
        : t('bulkUploadPage.partialMsg', { created, updated, failed: errors.length }));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#38BDF8] focus:border-[#38BDF8] outline-none text-sm';
  const labelCls = 'block text-sm font-semibold text-gray-700 mb-1';
  const SKY = '#38BDF8';

  const previewHeaders = [
    '#',
    t('bulkUploadPage.colName'),
    t('bulkUploadPage.colCategory'),
    t('bulkUploadPage.colPrice'),
    t('bulkUploadPage.colQty'),
    t('bulkUploadPage.colThreshold'),
    t('bulkUploadPage.colRx'),
    t('bulkUploadPage.colManufacturer'),
    t('bulkUploadPage.colExpiry'),
    t('bulkUploadPage.colStatus'),
    '',
  ];
  const rightAlignCols = [
    t('bulkUploadPage.colPrice'),
    t('bulkUploadPage.colQty'),
    t('bulkUploadPage.colThreshold'),
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
        <ArrowLeftIcon className="w-5 h-5" /> {t('common.back')}
      </button>

      <div className="bg-linear-to-r from-brand-navy via-[#2563a8] to-brand-navy-dark rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">{t('pharmacy.addMedication')}</h1>
        <p className="text-blue-100 text-sm">{t('inventory.addMedicationSubtitle')}</p>
      </div>

      {/* Mode switcher */}
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 w-fit">
        {(['manual', 'upload'] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
            style={mode === m ? { background: SKY } : {}}>
            {m === 'manual' ? <PlusIcon className="w-4 h-4" /> : <ArrowUpTrayIcon className="w-4 h-4" />}
            {m === 'manual' ? t('bulkUploadPage.addManually') : t('bulkUploadPage.bulkUpload')}
          </button>
        ))}
      </div>

      {/* ── MANUAL FORM ────────────────────────────────────────────────── */}
      {mode === 'manual' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3">{t('inventory.medicationInfo')}</h2>

          <div>
            <label className={labelCls}>{t('inventory.branchLabel')} <span className="text-red-500">*</span></label>
            {branchesLoading ? <div className="h-10 bg-gray-100 rounded-lg animate-pulse" /> : (
              <select required value={form.branchId}
                onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                className={inputCls}>
                <option value="">{t('inventory.selectBranch')}</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">{t('inventory.medicationAddedToBranch')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('inventory.medicationNameLabel')} <span className="text-red-500">*</span></label>
              <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Paracetamol 500mg" />
            </div>
            <div>
              <label className={labelCls}>{t('inventory.genericName')}</label>
              <input type="text" value={form.chemicalName} onChange={e => setForm(f => ({ ...f, chemicalName: e.target.value }))} className={inputCls} placeholder="e.g. Acetaminophen" />
            </div>
            <div>
              <label className={labelCls}>{t('pharmacy.category')} <span className="text-red-500">*</span></label>
              <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                {FDA_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">{t('inventory.UgandaFdaCategories')}</p>
            </div>
            <div>
              <label className={labelCls}>{t('inventory.unitPriceRwf')} <span className="text-red-500">*</span></label>
              <input type="number" required min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={inputCls} placeholder="e.g. 500" />
            </div>
            <div>
              <label className={labelCls}>{t('inventory.quantityInStock')} <span className="text-red-500">*</span></label>
              <input type="number" required min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className={inputCls} placeholder="e.g. 100" />
            </div>
            <div>
              <label className={labelCls}>{t('inventory.lowStockThresholdUnits')}</label>
              <input type="number" min="1" value={form.lowStockThreshold} onChange={e => setForm(f => ({ ...f, lowStockThreshold: e.target.value }))} className={inputCls} placeholder="e.g. 10" />
              <p className="text-xs text-gray-500 mt-1">{t('inventory.alertWhenBelow')}</p>
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('inventory.description')}</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} resize-none`} rows={3} placeholder={t('inventory.searchPlaceholder')} />
          </div>

          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <input type="checkbox" id="prescription" checked={form.requiresPrescription} onChange={e => setForm(f => ({ ...f, requiresPrescription: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: SKY }} />
            <label htmlFor="prescription" className="text-sm font-medium text-gray-700">
              {t('inventory.requiresPrescriptionLabel')}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50">{t('common.cancel')}</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-2" style={{ background: SKY }}>
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('common.saving')}</> : t('pharmacy.addMedication')}
            </button>
          </div>
        </form>
      )}

      {/* ── BULK UPLOAD MODE ─────────────────────────────────────────────── */}
      {mode === 'upload' && (
        <div className="space-y-5">

          {/* Upload result */}
          {uploadResult && (
            <div className={`rounded-xl p-5 border ${uploadResult.errors.length === 0 ? 'border-[#38BDF8] bg-sky-50' : 'bg-yellow-50 border-yellow-200'}`}>
              <p className="font-bold text-gray-900 mb-2 text-sm">{t('bulkUploadPage.uploadComplete')}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1.5" style={{ color: SKY }}>
                  <CheckCircleIcon className="w-4 h-4" /> {t('bulkUploadPage.added', { count: uploadResult.created })}
                </span>
                <span className="flex items-center gap-1.5" style={{ color: SKY }}>
                  <CheckCircleIcon className="w-4 h-4" /> {t('bulkUploadPage.updated', { count: uploadResult.updated })}
                </span>
                {uploadResult.errors.length > 0 && (
                  <span className="flex items-center gap-1.5 text-red-600">
                    <ExclamationCircleIcon className="w-4 h-4" /> {t('bulkUploadPage.failed', { count: uploadResult.errors.length })}
                  </span>
                )}
              </div>
              {uploadResult.errors.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-red-600">
                  {uploadResult.errors.map((e, i) => <li key={i}>Row {e.row} ({e.name}): {e.error}</li>)}
                </ul>
              )}
              <div className="mt-4 flex gap-3">
                <button onClick={() => router.push('/pharmacy/inventory')} className="px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ background: SKY }}>{t('bulkUploadPage.viewInventory')}</button>
                <button onClick={() => { setUploadResult(null); setParsedRows([]); setFileName(''); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">{t('bulkUploadPage.uploadAnother')}</button>
              </div>
            </div>
          )}

          {!uploadResult && (
            <>
              {/* Step 1 — Branch */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h2 className="font-bold text-gray-900">{t('bulkUploadPage.step1Title')}</h2>
                </div>
                {branchesLoading ? <div className="h-10 bg-gray-100 rounded-lg animate-pulse" /> : (
                  <select value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))} className={inputCls}>
                    <option value="">{t('bulkUploadPage.step1Placeholder')}</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}
              </div>

              {/* Step 2 — File type */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h2 className="font-bold text-gray-900">{t('bulkUploadPage.step2Title')}</h2>
                  <span className="text-xs text-gray-400 ml-1">{t('bulkUploadPage.step2Hint')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {FILE_TYPES.map(ft => {
                    const Icon = ft.icon;
                    const selected = fileType === ft.id;
                    return (
                      <button
                        key={ft.id}
                        type="button"
                        onClick={() => selectFileType(ft.id)}
                        className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all"
                        style={{
                          borderColor: selected ? SKY : '#E5E7EB',
                          background: selected ? '#F0FBFF' : '#fff',
                        }}>
                        <div className="flex items-center gap-2 w-full">
                          <Icon className="w-5 h-5" style={{ color: selected ? SKY : '#9CA3AF' }} />
                          <span className="font-bold text-gray-900 text-sm">{ft.label}</span>
                          {selected && (
                            <span className="ml-auto w-4 h-4 rounded-full flex items-center justify-center" style={{ background: SKY }}>
                              <CheckCircleIcon className="w-3 h-3 text-white" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{ft.ext}</p>
                        <p className="text-xs text-gray-500">{t(ft.hintKey)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3 — Template + upload (only after type selected) */}
              {fileType && (
                <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center">3</span>
                    <h2 className="font-bold text-gray-900">
                      {fileType === 'docx' ? t('bulkUploadPage.step3DocxTitle') : t('bulkUploadPage.step3Title')}
                    </h2>
                  </div>

                  {/* Template info / download */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border" style={{ background: '#F0FBFF', borderColor: '#BAE6FD' }}>
                    <div className="text-sm" style={{ color: '#0369A1' }}>
                      {fileType === 'docx' ? (
                        <>
                          <p className="font-semibold mb-1">{t('bulkUploadPage.wordTableFormat')}</p>
                          <p className="text-xs leading-relaxed">
                            {t('bulkUploadPage.wordTableDesc')}<br />
                            <span className="font-mono">{CSV_HEADERS.join(' · ')}</span><br />
                            {t('bulkUploadPage.requiredColumns')}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold mb-1">{t('bulkUploadPage.columnFormat')}</p>
                          <p className="text-xs leading-relaxed">
                            {t('bulkUploadPage.requiredCols')}<br />
                            {t('bulkUploadPage.optionalCols')}
                          </p>
                        </>
                      )}
                    </div>
                    {fileType !== 'docx' && (
                      <button onClick={handleTemplateDownload}
                        className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg text-sm font-semibold transition-colors shrink-0"
                        style={{ borderColor: SKY, color: SKY }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F0FBFF')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <DocumentArrowDownIcon className="w-4 h-4" /> {t('bulkUploadPage.downloadTemplate')}
                      </button>
                    )}
                  </div>

                  {/* File dropzone */}
                  <div
                    onClick={() => !parsing && fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${parsing ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                    style={{
                      borderColor: fileName ? SKY : '#D1D5DB',
                      background: fileName ? '#F0FBFF' : undefined,
                    }}
                    onMouseEnter={e => { if (!fileName && !parsing) e.currentTarget.style.borderColor = SKY; }}
                    onMouseLeave={e => { if (!fileName) e.currentTarget.style.borderColor = '#D1D5DB'; }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={FILE_TYPES.find(f => f.id === fileType)?.accept}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {parsing ? (
                      <>
                        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ borderColor: SKY, borderTopColor: 'transparent' }} />
                        <p className="text-sm text-gray-500">{t('bulkUploadPage.parsingFile')}</p>
                      </>
                    ) : (
                      <>
                        <ArrowUpTrayIcon className="w-8 h-8 mx-auto mb-2" style={{ color: fileName ? SKY : '#9CA3AF' }} />
                        {fileName ? (
                          <>
                            <p className="text-sm font-semibold" style={{ color: SKY }}>{fileName}</p>
                            <p className="text-xs mt-1" style={{ color: SKY }}>
                              {t('bulkUploadPage.rowsParsed', { total: parsedRows.length, valid: validRows.length, invalid: invalidRows.length })}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600">
                              {t('bulkUploadPage.clickToSelect', { label: FILE_TYPES.find(f => f.id === fileType)?.label })}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {t('bulkUploadPage.accepted', { ext: FILE_TYPES.find(f => f.id === fileType)?.ext })}
                            </p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4 — Preview */}
              {parsedRows.length > 0 && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center">4</span>
                      <h2 className="font-bold text-gray-900">{t('bulkUploadPage.step4Title')}</h2>
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: SKY }}>{validRows.length} {t('bulkUploadPage.validBadge')}</span>
                      {invalidRows.length > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{invalidRows.length} {t('bulkUploadPage.errorsBadge')}</span>}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wide">
                        <tr>
                          {previewHeaders.map(h => (
                            <th key={h} className={`px-3 py-3 ${rightAlignCols.includes(h) ? 'text-right' : h === t('bulkUploadPage.colRx') ? 'text-center' : 'text-left'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className={row._errors.length > 0 ? 'bg-red-50' : 'hover:bg-gray-50'}>
                            <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                            <td className="px-3 py-2.5 font-medium text-gray-900 max-w-[140px] truncate">{row.name || <span className="text-red-400 italic">—</span>}</td>
                            <td className="px-3 py-2.5 text-gray-600 max-w-[120px] truncate">{row.category || <span className="text-red-400 italic">—</span>}</td>
                            <td className="px-3 py-2.5 text-right text-gray-700">{row.price}</td>
                            <td className="px-3 py-2.5 text-right text-gray-700">{row.quantity}</td>
                            <td className="px-3 py-2.5 text-right text-gray-400">{row.lowStockThreshold}</td>
                            <td className="px-3 py-2.5 text-center text-gray-400">{row.requiresPrescription.toLowerCase() === 'true' ? '✓' : '—'}</td>
                            <td className="px-3 py-2.5 text-gray-400 max-w-[100px] truncate">{row.manufacturer || '—'}</td>
                            <td className="px-3 py-2.5 text-gray-400">{row.expiryDate || '—'}</td>
                            <td className="px-3 py-2.5">
                              {row._errors.length === 0
                                ? <span className="inline-flex items-center gap-1 font-medium" style={{ color: SKY }}><CheckCircleIcon className="w-3.5 h-3.5" /> {t('bulkUploadPage.statusValid')}</span>
                                : <span className="inline-flex items-center gap-1 text-red-600 font-medium" title={row._errors.map(e => t(e)).join(', ')}><ExclamationCircleIcon className="w-3.5 h-3.5" /> {row._errors.map(e => t(e)).join(', ')}</span>}
                            </td>
                            <td className="px-3 py-2.5">
                              <button onClick={() => setParsedRows(prev => prev.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500 transition-colors">
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">
                      {invalidRows.length > 0 && t(
                        invalidRows.length > 1 ? 'bulkUploadPage.rowsSkippedPlural' : 'bulkUploadPage.rowsSkipped',
                        { count: invalidRows.length }
                      )}
                    </p>
                    <div className="flex gap-3">
                      <button onClick={resetFile} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100">{t('bulkUploadPage.clear')}</button>
                      <button
                        onClick={handleBulkSubmit}
                        disabled={bulkLoading || validRows.length === 0 || !form.branchId}
                        className="flex items-center gap-2 px-5 py-2 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                        style={{ background: SKY }}>
                        {bulkLoading
                          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('bulkUploadPage.uploading')}</>
                          : <><ArrowUpTrayIcon className="w-4 h-4" /> {t(validRows.length !== 1 ? 'bulkUploadPage.uploadBtnPlural' : 'bulkUploadPage.uploadBtn', { count: validRows.length })}</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
