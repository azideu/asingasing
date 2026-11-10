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
      <nav aria-label="Receipt flow steps" className="w-full max-w-6xl mx-auto px-4 pt-4 pb-2 hidden md:block print:hidden">
        <div className="grid grid-cols-4 gap-2 bg-[#F3ECE1]/70 p-1.5 rounded-xl border border-[#E5DDCF]">
          {STEPS.map((s) => {
            const isActive = step === s.step;
            const isCompleted = step > s.step;

            return (
              <button
                key={s.step}
                onClick={() => setStep(s.step)}
                aria-label={`Step ${s.step}: ${s.label}`}
                aria-current={isActive ? 'step' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917] ${
                  isActive
                    ? 'bg-white shadow-xs border border-[#D9CDB8] text-[#1C1917]'
                    : isCompleted
                    ? 'text-[#57534E] hover:bg-white/50'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                    isActive
                      ? 'bg-[#1C1917] text-white'
                      : isCompleted
                      ? 'bg-[#1B6B38] text-white'
                      : 'bg-[#E5DDCF] text-[#57534E]'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                    {s.label}
                    {s.step === 3 && calculation.unassignedItemIds.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#C53030]" aria-label="Items pending assignment" />
                    )}
                  </div>
                  <div className="text-xs text-[#78716C] truncate">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#E5DDCF] px-4 py-2.5 md:hidden print:hidden">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {step > 1 ? (
            <button
              onClick={handlePrev}
              aria-label="Go to previous step"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#E5DDCF] bg-white text-xs font-semibold text-[#57534E] active:bg-[#F3ECE1] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div className="text-xs text-[#78716C] font-mono px-2 min-h-[44px] flex items-center">Step 1 of 4</div>
          )}

          {/* Step Pill Icons with 44px Touch Targets */}
          <div className="flex items-center gap-0.5">
            {STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => setStep(s.step)}
                aria-label={`Go to Step ${s.step}: ${s.label}`}
                aria-current={step === s.step ? 'step' : undefined}
                className="w-11 h-11 flex items-center justify-center cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917]"
              >
                <span
                  className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                    step === s.step
                      ? 'bg-[#1C1917] text-white ring-2 ring-[#1C1917]/20 scale-105'
                      : step > s.step
                      ? 'bg-[#1B6B38] text-white'
                      : 'bg-[#E5DDCF] text-[#57534E]'
                  }`}
                >
                  {s.step}
                </span>
              </button>
            ))}
          </div>

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              aria-label="Go to next step"
              className={`inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917] ${
                canGoNext()
                  ? 'bg-[#1C1917] text-white active:scale-95 hover:bg-[#332E2B]'
                  : 'bg-[#E5DDCF] text-[#78716C] cursor-not-allowed opacity-75'
              }`}
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-xs font-semibold text-[#1B6B38] flex items-center gap-1 min-h-[44px] px-2">
              <CheckCircle2 className="w-4 h-4" /> Ready!
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
