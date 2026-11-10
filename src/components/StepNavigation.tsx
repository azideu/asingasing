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
        <div className="grid grid-cols-4 gap-2 bg-[#171513] p-1.5 rounded-xl border border-[#2E2A24]">
          {STEPS.map((s) => {
            const isActive = step === s.step;
            const isCompleted = step > s.step;

            return (
              <button
                key={s.step}
                onClick={() => setStep(s.step)}
                aria-label={`Step ${s.step}: ${s.label}`}
                aria-current={isActive ? 'step' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5EFE6] ${
                  isActive
                    ? 'bg-[#1C1A17] shadow-xs border border-[#3D372F] text-[#F5EFE6]'
                    : isCompleted
                    ? 'text-[#A89F91] hover:bg-[#1C1A17]/60'
                    : 'text-[#7D7569] hover:text-[#F5EFE6]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                    isActive
                      ? 'bg-[#F5EFE6] text-[#121110]'
                      : isCompleted
                      ? 'bg-[#2ECC71] text-[#121110]'
                      : 'bg-[#2E2A24] text-[#A89F91]'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                    {s.label}
                    {s.step === 3 && calculation.unassignedItemIds.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#E05353]" aria-label="Items pending assignment" />
                    )}
                  </div>
                  <div className="text-xs text-[#7D7569] truncate">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-[#121110]/95 backdrop-blur-md border-t border-[#2E2A24] px-4 py-2.5 md:hidden print:hidden">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {step > 1 ? (
            <button
              onClick={handlePrev}
              aria-label="Go to previous step"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#2E2A24] bg-[#1C1A17] text-xs font-semibold text-[#A89F91] active:bg-[#26231F] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5EFE6]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div className="text-xs text-[#7D7569] font-mono px-2 min-h-[44px] flex items-center">Step 1 of 4</div>
          )}

          {/* Step Pill Icons with 44px Touch Targets */}
          <div className="flex items-center gap-0.5">
            {STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => setStep(s.step)}
                aria-label={`Go to Step ${s.step}: ${s.label}`}
                aria-current={step === s.step ? 'step' : undefined}
                className="w-11 h-11 flex items-center justify-center cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5EFE6]"
              >
                <span
                  className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                    step === s.step
                      ? 'bg-[#F5EFE6] text-[#121110] ring-2 ring-[#F5EFE6]/20 scale-105'
                      : step > s.step
                      ? 'bg-[#2ECC71] text-[#121110]'
                      : 'bg-[#2E2A24] text-[#A89F91]'
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
              className={`inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5EFE6] ${
                canGoNext()
                  ? 'bg-[#F5EFE6] text-[#121110] active:scale-95 hover:bg-[#E6DDD0]'
                  : 'bg-[#2E2A24] text-[#7D7569] cursor-not-allowed opacity-60'
              }`}
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-xs font-semibold text-[#2ECC71] flex items-center gap-1 min-h-[44px] px-2">
              <CheckCircle2 className="w-4 h-4" /> Ready!
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
