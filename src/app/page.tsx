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
    <div className="min-h-screen flex flex-col bg-[#121110] text-[#F5EFE6] pb-20 md:pb-12">
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
      <footer className="mt-auto py-6 border-t border-[#2E2A24] text-center text-xs text-[#7D7569] font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AsingAsing • Proportional Bill Split</span>
          <span className="text-[#7D7569]">100% Client-Side • Zero Data Stored On Servers</span>
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
