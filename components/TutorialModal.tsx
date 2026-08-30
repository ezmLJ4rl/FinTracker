import React, { useState } from 'react';
import {
  X,
  Camera,
  ShieldCheck,
  BrainCircuit,
  PieChart,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to FinTrack Pro',
      subtitle: 'Personal Finance Auditing & Wealth Management Platform',
      badge: 'Overview',
      icon: ShieldCheck,
      iconColor: 'from-indigo-600 to-violet-600',
      description:
        'FinTrack Pro is a personal finance auditing platform designed to convert raw transactional chaos into rigorous, actionable financial discipline without ever sending private data to an external server.',
      highlights: [
        '100% Client-Side Privacy: IndexedDB client vault',
        'Built for East African & global currencies (TZS, USD, KES)',
        'Real-time spending velocity and efficiency audits',
      ],
    },
    {
      title: 'Smart Receipt Scanner',
      subtitle: 'From 90 seconds to under 2 seconds entry time',
      badge: 'Speed & OCR',
      icon: Camera,
      iconColor: 'from-emerald-500 to-teal-600',
      description:
        'Capture or upload supermarket receipts, fuel tokens, restaurant bills, or utility tokens. The integrated OCR vision extracts the merchant, total, date, and categorizes the transaction instantly.',
      highlights: [
        'Automatic VAT, line items & confidence scoring',
        'Immediate manual review before saving to ledger',
        'Eliminates paper receipt health & BPA environmental waste',
      ],
    },
    {
      title: 'Financial Efficiency Score',
      subtitle: 'Institutional-grade health scoring (0-100 & Grades A+ to F)',
      badge: 'Deep Analytics',
      icon: PieChart,
      iconColor: 'from-blue-600 to-cyan-600',
      description:
        'More than a simple sum of money. The Efficiency Rating evaluates budget discipline, savings health, fixed vs. variable cost rigidity, and BNPL debt exposure.',
      highlights: [
        'Dynamic 4-metric score breakdown',
        'Runway days estimation & burn-rate velocity',
        'BNPL debt burden detection (OECD 2025 compliant)',
      ],
    },
    {
      title: 'The Pragmatic Advisor',
      subtitle: 'Structured 4-part financial consulting & Swahili support',
      badge: 'Advisory',
      icon: BrainCircuit,
      iconColor: 'from-violet-600 to-fuchsia-600',
      description:
        'Consult your personalized financial auditor. Every response is strictly structured into Observation, Benchmark Comparison, Risk Analysis, and Actionable Next Steps.',
      highlights: [
        'Bilingual: Full English and fluent Kiswahili auditing',
        'One-click prompt suggestions for dining, debt, and runaway pace',
        'Export full institutional PDF audit reports anytime',
      ],
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              {currentStep.badge}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Step {step + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Step Icon */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${currentStep.iconColor} flex items-center justify-center text-white shadow-lg shadow-indigo-500/20`}>
              <Icon size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {currentStep.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Key Feature Bullets */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Core Capabilities
            </p>
            {currentStep.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>{h}</span>
              </div>
            ))}
          </div>

          {/* Step Indicator Dots */}
          <div className="flex justify-center items-center gap-1.5 pt-2">
            {steps.map((_, i) => (
              <div
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === step
                    ? 'w-6 bg-indigo-600 dark:bg-indigo-400'
                    : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 rounded-xl transition-colors flex items-center gap-1"
          >
            <ChevronLeft size={15} />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {step < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <span>Get Started with FinTrack Pro</span>
                <CheckCircle2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
