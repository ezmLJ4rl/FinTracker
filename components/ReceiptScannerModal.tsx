import React, { useState, useRef } from 'react';
import { scanReceipt, OCRReceiptResult } from '../services/smartService';
import { CategoryItem } from '../types';
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  currencySymbol: string;
  onSaveScannedTransaction: (data: {
    name: string;
    amount: number;
    date: string;
    category: string;
    type: 'expense' | 'bnpl';
    paymentMethod: string;
    isFixedCost: boolean;
    notes: string;
  }, receiptData?: { name: string; type: string; dataUrl: string }) => Promise<void>;
}

const ReceiptScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  categories,
  currencySymbol,
  onSaveScannedTransaction,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('receipt.jpg');
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [scanning, setScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRReceiptResult | null>(null);
  const [editableMerchant, setEditableMerchant] = useState('');
  const [editableAmount, setEditableAmount] = useState('');
  const [editableDate, setEditableDate] = useState('');
  const [editableCategory, setEditableCategory] = useState('');
  const [editablePaymentMethod, setEditablePaymentMethod] = useState('M-Pesa / Vodacom');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const url = event.target.result as string;
        setImageSrc(url);
        triggerReceiptScan(url);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerReceiptScan = async (url: string) => {
    setScanning(true);
    setOcrResult(null);
    try {
      const categoryNames = categories.map(c => c.name);
      const res = await scanReceipt(url, currencySymbol, categoryNames);
      setOcrResult(res);
      setEditableMerchant(res.merchant);
      setEditableAmount(res.total.toString());
      setEditableDate(res.date);
      setEditableCategory(res.category || categoryNames[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmAndSave = async () => {
    if (!editableMerchant || !editableAmount) return;
    setSaving(true);
    try {
      await onSaveScannedTransaction(
        {
          name: editableMerchant,
          amount: parseFloat(editableAmount),
          date: editableDate || new Date().toISOString().split('T')[0],
          category: editableCategory,
          type: 'expense',
          paymentMethod: editablePaymentMethod,
          isFixedCost: false,
          notes: ocrResult?.notes ? `[OCR] ${ocrResult.notes}` : 'Extracted via Smart Scanner',
        },
        imageSrc
          ? {
              name: fileName,
              type: mimeType,
              dataUrl: imageSrc,
            }
          : undefined
      );
      handleReset();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setImageSrc(null);
    setOcrResult(null);
    setScanning(false);
    setEditableMerchant('');
    setEditableAmount('');
    setEditableDate('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Smart Receipt Scanner
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Snap or upload thermal receipt — extracts merchant, amount, date & category under 2s
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {!imageSrc ? (
            /* Upload Dropzone */
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/50 hover:bg-indigo-50/20 group"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <Upload size={28} />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                Drop your receipt image here, or browse
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                Supports supermarket bills, fuel receipts, dining invoices (PNG, JPG, HEIC, WebP).
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-700 transition-colors">
                <Camera size={14} />
                <span>Take Photo or Choose File</span>
              </div>
            </div>
          ) : (
            /* Preview and OCR Processing */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Receipt Image Preview Container */}
                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-72 group">
                  <img
                    src={imageSrc}
                    alt="Receipt preview"
                    className="max-h-72 w-full object-contain"
                  />
                  {scanning && (
                    <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                      <div className="relative w-16 h-16 mb-3">
                        <div className="absolute inset-0 rounded-full border-2 border-indigo-400/20 animate-ping" />
                        <div className="w-16 h-16 rounded-full border-3 border-indigo-400 border-t-transparent animate-spin flex items-center justify-center">
                          <Camera size={18} className="text-indigo-300" />
                        </div>
                      </div>
                      <p className="text-xs font-bold tracking-wide">Analyzing Receipt Matrix...</p>
                      <p className="text-[11px] text-indigo-200/70 mt-1">Extracting Merchant, VAT & Totals</p>
                    </div>
                  )}
                  <button
                    onClick={handleReset}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Image"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Extracted Fields Form */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      Verification Ledger
                    </span>
                    {ocrResult && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {ocrResult.confidence}% Accuracy
                      </span>
                    )}
                  </div>

                  {/* Merchant Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Merchant / Vendor
                    </label>
                    <input
                      type="text"
                      disabled={scanning}
                      value={editableMerchant}
                      onChange={(e) => setEditableMerchant(e.target.value)}
                      placeholder="e.g. Shoppers Supermarket"
                      className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Amount & Date */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                        Total ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        step="any"
                        disabled={scanning}
                        value={editableAmount}
                        onChange={(e) => setEditableAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        disabled={scanning}
                        value={editableDate}
                        onChange={(e) => setEditableDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Target Category
                    </label>
                    <select
                      disabled={scanning}
                      value={editableCategory}
                      onChange={(e) => setEditableCategory(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Payment Account / Method
                    </label>
                    <select
                      disabled={scanning}
                      value={editablePaymentMethod}
                      onChange={(e) => setEditablePaymentMethod(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="M-Pesa / Vodacom">M-Pesa / Vodacom</option>
                      <option value="Tigo Pesa / Airtel Money">Tigo Pesa / Airtel Money</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Card / Visa / MC">Bank Card / Visa / MC</option>
                      <option value="Bank Transfer / NMB / CRDB">Bank Transfer / NMB / CRDB</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Breakdown if OCR extracted items */}
              {ocrResult?.items && ocrResult.items.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                    Line Items Detected ({ocrResult.items.length})
                  </span>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1 text-xs">
                    {ocrResult.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                        <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">
                          {currencySymbol} {item.price.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>

          {imageSrc && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerReceiptScan(imageSrc)}
                disabled={scanning}
                className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={13} className={scanning ? 'animate-spin' : ''} />
                <span>Re-scan</span>
              </button>

              <button
                id="btn-confirm-scanned-tx"
                onClick={handleConfirmAndSave}
                disabled={scanning || saving || !editableMerchant || !editableAmount}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5"
              >
                {saving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Approve & Save to Ledger</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptScannerModal;
