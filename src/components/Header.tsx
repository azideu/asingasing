'use client';

import React from 'react';
import { useReceipt } from '@/context/ReceiptContext';
import { RefreshCw, ChevronDown } from 'lucide-react';

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

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E5DDCF] px-3 sm:px-6 py-2.5 sm:py-3 w-full">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Brand identity */}
        <div className="min-w-0 shrink">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1C1917] font-serif truncate">
            BetsuBetsu
          </h1>
          <p className="text-[11px] text-[#78716C] hidden sm:block truncate">
            Split restaurant bills by receipt
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Currency selector */}
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="appearance-none bg-white border border-[#E5DDCF] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#1C1917] hover:border-[#C4B9A7] focus:outline-none focus:ring-1 focus:ring-[#1C1917] cursor-pointer pr-6 shadow-2xs"
              title="Select Currency"
            >
              {CURRENCIES.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.symbol} {c.label.split(' ')[0]}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-[#78716C] absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Reset Bill */}
          <button
            onClick={() => {
              if (
                items.length === 0 ||
                window.confirm('Reset current bill and clear all entries?')
              ) {
                resetAll();
              }
            }}
            className="inline-flex items-center gap-1.5 text-[#78716C] hover:text-[#1C1917] px-2.5 py-1.5 rounded-lg border border-[#E5DDCF] bg-white hover:bg-[#F3ECE1] text-xs font-medium transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Reset Bill"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}
