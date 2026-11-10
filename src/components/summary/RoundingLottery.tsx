'use client';

import React, { useState, useRef } from 'react';
import { useReceipt } from '@/context/ReceiptContext';
import { formatCurrency, isRoundingFee } from '@/lib/calculator';
import confetti from 'canvas-confetti';
import { Dices, RotateCcw } from 'lucide-react';

export function RoundingLottery() {
  const { calculation, currency, participants, fees, roundingWinnerId, setRoundingWinnerId } =
    useReceipt();

  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if any rounding fee exists in fees or if penny adjustments exist
  const explicitRoundingFee = fees.find(isRoundingFee);
  const hasPennyAdjustment = Object.values(calculation.breakdowns).some(
    (b) => b.centsAdjustment !== 0
  );

  const roundingAmount = calculation.roundingTotal ?? 0;
  const isZero = Math.abs(roundingAmount) < 0.005;

  // Don't render if less than 2 participants
  if (participants.length < 2) return null;

  // Only render if there is an explicit rounding fee or cent difference
  if (!explicitRoundingFee && !hasPennyAdjustment && isZero) {
    return null;
  }

  const currentWinner = participants.find((p) => p.id === roundingWinnerId);

  const handleDraw = () => {
    if (isSpinning || participants.length < 2) return;

    setIsSpinning(true);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pick a random winner that is preferably different from current
    const available = participants.filter((p) => p.id !== roundingWinnerId);
    const chosenOne =
      available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : participants[Math.floor(Math.random() * participants.length)];

    const chosenIdx = participants.findIndex((p) => p.id === chosenOne.id);

    if (prefersReducedMotion) {
      // Instant pick without spinning animation
      setHighlightedIndex(chosenIdx);
      setRoundingWinnerId(chosenOne.id);
      setIsSpinning(false);
      return;
    }

    // Step-down interval animation (roulette wheel easing)
    let currentIdx = 0;
    let speed = 60;
    const totalSteps = 24 + (chosenIdx % participants.length);
    let stepCount = 0;

    const spin = () => {
      currentIdx = (currentIdx + 1) % participants.length;
      setHighlightedIndex(currentIdx);
      stepCount++;

      if (stepCount < totalSteps) {
        // Slow down toward the end
        if (stepCount > totalSteps - 8) {
          speed += 45;
        } else if (stepCount > totalSteps - 14) {
          speed += 20;
        }
        timerRef.current = setTimeout(spin, speed);
      } else {
        // Landed on chosen winner
        setHighlightedIndex(chosenIdx);
        setRoundingWinnerId(chosenOne.id);
        setIsSpinning(false);

        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.65 },
            colors: [chosenOne.color, '#C53030', '#1C1917', '#E8D5B5'],
          });
        } catch {
          // ignore
        }
      }
    };

    timerRef.current = setTimeout(spin, speed);
  };

  const handleReset = () => {
    setRoundingWinnerId(null);
  };

  return (
    <div className="bg-[#171513] rounded-2xl border border-[#2E2A24] p-4 sm:p-5 shadow-xs transition-all relative overflow-hidden print:hidden">
      {/* Decorative top Japanese slip perforation */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[radial-gradient(#3D372F_1px,transparent_1px)] bg-[size:8px_8px]" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2E2A24]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#F5EFE6] font-serif flex items-center gap-1.5">
              <Dices className="w-4 h-4 text-[#E05353]" />
              Rounding Roulette
            </h3>
            <span className="text-xs text-[#7D7569]">•</span>
            <span className="text-xs font-mono font-medium text-[#7D7569]">
              {roundingAmount > 0 ? '+' : ''}
              {formatCurrency(roundingAmount, currency)}
            </span>
          </div>
          <p className="text-xs text-[#7D7569] max-w-lg leading-relaxed">
            {roundingAmount < 0
              ? `Pick one person at random to take the ${formatCurrency(Math.abs(roundingAmount), currency)} discount.`
              : `Pick one person at random to cover the leftover ${formatCurrency(roundingAmount, currency)}.`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {roundingWinnerId && (
            <button
              onClick={handleReset}
              disabled={isSpinning}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#7D7569] hover:text-[#F5EFE6] px-2.5 py-1.5 rounded-lg border border-[#3D372F] bg-[#1C1A17] cursor-pointer hover:bg-[#26231F] transition-colors"
              title="Reset to proportional split"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Split Evenly</span>
            </button>
          )}

          <button
            onClick={handleDraw}
            disabled={isSpinning}
            className="inline-flex items-center gap-1.5 bg-[#F5EFE6] text-[#121110] px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-semibold hover:bg-[#E6DDD0] active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5EFE6]"
          >
            <Dices className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{roundingWinnerId ? 'Roll Again' : 'Roll'}</span>
          </button>
        </div>
      </div>

      {/* Participants Roulette Ticker */}
      <div className="pt-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {participants.map((p, idx) => {
            const isHighlighted = isSpinning
              ? idx === highlightedIndex
              : p.id === roundingWinnerId;
            const isWinner = p.id === roundingWinnerId;

            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 relative ${
                  isWinner
                    ? 'bg-[#1C1A17] border-[#E05353] shadow-sm ring-2 ring-[#E05353]/25'
                    : isHighlighted
                    ? 'bg-[#1C1A17] border-[#F5EFE6] shadow-xs scale-102'
                    : 'bg-[#171513] border-[#2E2A24] opacity-75'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs"
                  style={{ backgroundColor: p.color }}
                >
                  {p.avatarLetter}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#F5EFE6] truncate">{p.name}</div>
                  <div className="text-xs font-mono text-[#7D7569]">
                    {isWinner ? (
                      <span className="text-[#E05353] font-semibold">
                        {roundingAmount < 0 ? 'Takes discount' : 'Covers rounding'}
                      </span>
                    ) : (
                      <span>Standard</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Winner Announcement Banner */}
        {currentWinner && !isSpinning && (
          <div className="mt-3 p-3 bg-[#1C1A17] rounded-xl border border-[#E05353]/30 flex items-center justify-between text-xs text-[#F5EFE6] animate-fadeIn">
            <div className="flex items-center gap-2">
              <Dices className="w-4 h-4 text-[#E05353] shrink-0" />
              <div>
                <span className="font-bold">{currentWinner.name}</span>{' '}
                {roundingAmount < 0 ? 'gets the' : 'takes the'}{' '}
                <span className="font-mono font-bold text-[#E05353]">
                  {formatCurrency(Math.abs(roundingAmount), currency)}
                </span>{' '}
                {roundingAmount < 0 ? 'discount' : 'rounding'}.
              </div>
            </div>
            <span className="text-xs font-mono text-[#7D7569] hidden sm:inline">
              Cent balanced ✓
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
