'use client';

import React from 'react';
import { ReceiptProvider, useReceipt } from '@/context/ReceiptContext';
import { Header } from '@/components/Header';
import { StepNavigation } from '@/components/StepNavigation';
import { ReceiptCapture } from '@/components/ocr/ReceiptCapture';
import { ReceiptEditor } from '@/components/editor/ReceiptEditor';
import { ParticipantMatrix } from '@/components/assign/ParticipantMatrix';
import { ReceiptSummary } from '@/components/summary/ReceiptSummary';

function AppContent() {
  const { step } = useReceipt();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917] pb-20 md:pb-12">
      {/* Editorial Header */}
      <Header />

      {/* Stepper Navigation */}
      <StepNavigation />

      {/* Main Flow Canvas */}
      <main className="flex-1 w-full">
        {step === 1 && <ReceiptCapture />}
        {step === 2 && <ReceiptEditor />}
        {step === 3 && <ParticipantMatrix />}
        {step === 4 && <ReceiptSummary />}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-[#E5DDCF] text-center text-xs text-[#78716C] font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>BetsuBetsu (別々) • Proportional Bill Split &amp; OCR Verification</span>
          <span className="text-[#78716C]">100% Client-Side • Zero Data Stored On Servers</span>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <ReceiptProvider>
      <AppContent />
    </ReceiptProvider>
  );
}
