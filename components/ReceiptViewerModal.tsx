import React from 'react';
import { Receipt } from '../types';
import { X, Download, FileText, Calendar, ShieldCheck } from 'lucide-react';

interface Props {
  receipt: Receipt | null;
  onClose: () => void;
}

const ReceiptViewerModal: React.FC<Props> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = receipt.dataUrl;
    link.download = receipt.name || 'receipt.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {receipt.name || 'Attached Receipt Record'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Uploaded: {new Date(receipt.createdAt).toLocaleString()}
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

        {/* Image Content */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950 flex items-center justify-center min-h-[300px]">
          <img
            src={receipt.dataUrl}
            alt={receipt.name}
            className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Encrypted local storage verification</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Download Image</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewerModal;
