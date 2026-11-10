'use client';

import React, { useState } from 'react';
import { useReceipt } from '@/context/ReceiptContext';
import { RefreshCw, ChevronDown, AlertTriangle, X } from 'lucide-react';

const CURRENCIES = [
  { symbol: 'RM', label: 'MYR (RM)' },
  { symbol: '$', label: 'USD / CAD ($)' },
  { symbol: '€', label: 'EUR (€)' },
  { symbol: '£', label: 'GBP (£)' },
  { symbol: '¥', label: 'JPY (¥)' },
  { symbol: 'S$', label: 'SGD (S$)' },
  { symbol: 'AU$', label: 'AUD (AU$)' },
];

export function Header() {
  const {
    currency,
    setCurrency,
    resetAll,
    items,
  } = useReceipt();

  const [showResetModal, setShowResetModal] = useState(false);

  const handleResetClick = () => {
    if (items.length === 0) {
      resetAll();
    } else {
      setShowResetModal(true);
    }
  };

  const handleConfirmReset = () => {
    resetAll();
    setShowResetModal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#121110]/95 backdrop-blur-md border-b border-[#2E2A24] px-3 sm:px-6 py-2.5 sm:py-3 w-full print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Brand identity */}
          <div className="min-w-0 shrink">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#F5EFE6] font-serif truncate">
              AsingAsing
            </h1>
            <p className="text-xs text-[#A89F91] hidden sm:block truncate">
              Split restaurant bills by receipt
            </p>
          </div>

          {/* Global Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Currency selector */}
            <div className="relative flex items-center">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                aria-label="Select Currency"
                className="appearance-none bg-[#1C1A17] border border-[#2E2A24] rounded-lg px-3 py-2 min-h-[44px] text-xs font-mono font-bold text-[#F5EFE6] hover:border-[#3D372F] focus:outline-none focus:ring-2 focus:ring-[#F5EFE6] cursor-pointer pr-7 shadow-2xs"
                title="Select Currency"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.symbol} value={c.symbol} className="bg-[#1C1A17] text-[#F5EFE6]">
                    {c.symbol} {c.label.split(' ')[0]}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#A89F91] absolute right-2.5 pointer-events-none" />
            </div>

            {/* Reset Bill */}
            <button
              onClick={handleResetClick}
              aria-label="Reset bill and clear all entries"
              className="inline-flex items-center gap-1.5 text-[#A89F91] hover:text-[#F5EFE6] px-3 py-2 min-h-[44px] rounded-lg border border-[#2E2A24] bg-[#1C1A17] hover:bg-[#26231F] text-xs font-medium transition-colors cursor-pointer shrink-0 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5EFE6]"
              title="Reset Bill"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Authored Paper Modal Confirmation for Bill Reset */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#1C1A17] rounded-2xl max-w-sm w-full border border-[#2E2A24] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#2E2A24] flex items-center justify-between bg-[#171513]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#E05353]" />
                <h3 className="text-base font-bold text-[#F5EFE6] font-serif">
                  Clear Current Bill?
                </h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-[#A89F91] hover:text-[#F5EFE6] p-1 rounded-lg cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-[#A89F91] leading-relaxed">
                This will clear all {items.length} line items, diner assignments, and extra charges. You will return to the receipt scanner.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3.5 py-2.5 rounded-xl border border-[#3D372F] text-xs font-medium text-[#A89F91] hover:bg-[#26231F] cursor-pointer"
                >
                  Keep Current Bill
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-4 py-2.5 rounded-xl bg-[#E05353] hover:bg-[#FF6B6B] text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Clear &amp; Start Over
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
