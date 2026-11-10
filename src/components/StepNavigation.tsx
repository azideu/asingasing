'use client';

import React from 'react';
import { useReceipt } from '@/context/ReceiptContext';
import { StepType } from '@/types/receipt';
import {
  Camera,
  FileCheck2,
  Users2,
  Receipt,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const STEPS: { step: StepType; label: string; icon: React.ElementType; desc: string }[] = [
  { step: 1, label: 'Scan Receipt', icon: Camera, desc: 'Photo or paste' },
  { step: 2, label: 'Review & Edit', icon: FileCheck2, desc: 'Check items and fees' },
  { step: 3, label: 'Assign People', icon: Users2, desc: 'Split dishes' },
  { step: 4, label: 'Summary', icon: Receipt, desc: 'Final totals' },
];

export function StepNavigation() {
  const { step, setStep, calculation, items } = useReceipt();

  const canGoNext = () => {
    if (step === 1) return items.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < 4) setStep((step + 1) as StepType);
  };

  const handlePrev = () => {
    if (step > 1) setStep((step - 1) as StepType);
  };

  return (
    <>
      {/* Desktop / Tablet Stepper Header */}
      <nav className="w-full max-w-6xl mx-auto px-4 pt-4 pb-2 hidden md:block">
        <div className="grid grid-cols-4 gap-2 bg-[#F3ECE1]/70 p-1.5 rounded-xl border border-[#E5DDCF]">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.step;
            const isCompleted = step > s.step;

            return (
              <button
                key={s.step}
                onClick={() => setStep(s.step)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white shadow-xs border border-[#D9CDB8] text-[#1C1917]'
                    : isCompleted
                    ? 'text-[#57534E] hover:bg-white/50'
                    : 'text-[#A8A29E] hover:text-[#57534E]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                    isActive
                      ? 'bg-[#1C1917] text-white'
                      : isCompleted
                      ? 'bg-[#1B6B38] text-white'
                      : 'bg-[#E5DDCF] text-[#78716C]'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                    {s.label}
                    {s.step === 3 && calculation.unassignedItemIds.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#C53030]" />
                    )}
                  </div>
                  <div className="text-[10px] text-[#78716C] truncate">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#E5DDCF] px-4 py-3 md:hidden">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={handlePrev}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5DDCF] bg-white text-xs font-medium text-[#57534E] active:bg-[#F3ECE1] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div className="text-xs text-[#78716C] font-mono">Step 1 of 4</div>
          )}

          {/* Step Pill Icons */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => setStep(s.step)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all cursor-pointer ${
                  step === s.step
                    ? 'bg-[#1C1917] text-white ring-2 ring-[#1C1917]/20 scale-105'
                    : step > s.step
                    ? 'bg-[#1B6B38] text-white'
                    : 'bg-[#E5DDCF] text-[#78716C]'
                }`}
              >
                {s.step}
              </button>
            ))}
          </div>

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                canGoNext()
                  ? 'bg-[#1C1917] text-white active:scale-95 hover:bg-[#332E2B]'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-xs font-semibold text-[#1B6B38] flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Ready!
            </div>
          )}
        </div>
      </div>
    </>
  );
}
