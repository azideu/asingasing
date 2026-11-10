'use client';

import React, { useState, useEffect } from 'react';
import { useReceipt } from '@/context/ReceiptContext';
import { formatCurrency } from '@/lib/calculator';
import confetti from 'canvas-confetti';
import { RoundingLottery } from './RoundingLottery';
import {
  Check,
  Printer,
  Share2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';

export function ReceiptSummary() {
  const { calculation, currency, participants, items, fees, setStep } = useReceipt();
  const [copied, setCopied] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [paymentNote, setPaymentNote] = useState('');

  // Fire celebratory confetti when loaded and balanced (honoring prefers-reduced-motion)
  useEffect(() => {
    if (calculation.allAssigned && calculation.isBalanced) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!prefersReducedMotion) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#1C1917'],
          });
        } catch {
          // ignore
        }
      }
    }
  }, [calculation.allAssigned, calculation.isBalanced]);

  const toggleExpand = (pid: string) => {
    setExpandedCards((prev) => ({ ...prev, [pid]: !prev[pid] }));
  };

  // Generate formatted text for WhatsApp / Telegram
  const generateMessageText = () => {
    let msg = `🧾 *ASINGASING BILL BREAKDOWN*\n`;
    msg += `Total Bill: *${formatCurrency(calculation.targetGrandTotal, currency)}*\n`;
    msg += `--------------------------------\n\n`;

    participants.forEach((p) => {
      const b = calculation.breakdowns[p.id];
      if (!b) return;

      msg += `👤 *${p.name}* owes: *${formatCurrency(b.grandTotal, currency)}*\n`;
      msg += `  • Items consumed: ${formatCurrency(b.rawSubtotal, currency)}\n`;

      if (b.feeShares.length > 0) {
        b.feeShares.forEach((fs) => {
          msg += `  • ${fs.feeName}: ${fs.isDiscount ? '-' : '+'}${formatCurrency(fs.amount, currency)}\n`;
        });
      }

      if (b.centsAdjustment !== 0) {
        msg += `  • Cent Rounding Adj: ${formatCurrency(b.centsAdjustment, currency)}\n`;
      }

      msg += `\n`;
    });

    if (calculation.roundingWinnerId && calculation.roundingTotal !== undefined && calculation.roundingTotal !== 0) {
      const winner = participants.find((p) => p.id === calculation.roundingWinnerId);
      if (winner) {
        msg += `🎲 *Rounding Fate:* ${winner.name} absorbed the ${calculation.roundingTotal > 0 ? '+' : ''}${formatCurrency(calculation.roundingTotal, currency)} rounding adjustment!\n\n`;
      }
    }

    if (paymentNote.trim()) {
      msg += `💳 *Payment Details:*\n${paymentNote.trim()}\n\n`;
    }

    msg += `✓ *Split proportionally with AsingAsing (Exact Cent Balanced)*`;
    return msg;
  };

  const handleCopy = async () => {
    const text = generateMessageText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-6 print:p-0 print:m-0 print:max-w-none print:space-y-4">
      {/* Dedicated Print / PDF Header */}
      <div className="hidden print:flex items-center justify-between pb-3 mb-1 border-b-2 border-[#1C1917]">
        <div>
          <h1 className="text-xl font-bold font-serif text-[#1C1917]">AsingAsing (Asing-Asing)</h1>
          <p className="text-xs text-[#57534E] font-mono">Restaurant Bill Settlement Slip</p>
        </div>
        <div className="text-right text-xs font-mono text-[#57534E]">
          <div className="font-bold text-[#1C1917]">
            Grand Total: {formatCurrency(calculation.targetGrandTotal, currency)}
          </div>
          <div>{participants.length} Diners • {items.length} Items</div>
        </div>
      </div>

      {/* On-screen Header bar (Hidden in print/PDF) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#2E2A24] print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5EFE6] font-serif">
            Summary &amp; Settle
          </h2>
          <p className="text-xs text-[#7D7569]">
            Exact per-person shares with proportional tax and service distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            aria-label="Print receipt slip"
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-[#3D372F] bg-[#1C1A17] text-xs font-medium text-[#F5EFE6] hover:bg-[#26231F] transition-colors cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5EFE6]"
            title="Print receipt"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Slip</span>
          </button>

          <button
            onClick={handleCopy}
            aria-label="Copy formatted breakdown for WhatsApp or Telegram"
            className="inline-flex items-center gap-1.5 bg-[#F5EFE6] text-[#121110] px-4 py-2 min-h-[40px] rounded-lg text-xs font-semibold hover:bg-[#E6DDD0] transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5EFE6]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy for WhatsApp / Telegram</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Discrepancy warning if any items still unassigned (Hidden in print/PDF) */}
      {!calculation.allAssigned && (
        <div className="bg-[#201414] border border-[#E05353]/40 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-[#F5EFE6] print:hidden">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E05353] shrink-0" />
            <span>
              {calculation.unassignedItemIds.length} item(s) are not assigned to anyone yet. Go back to Step 3 to tag them.
            </span>
          </div>
          <button
            onClick={() => setStep(3)}
            aria-label="Assign unassigned items now"
            className="text-[#E05353] font-bold underline cursor-pointer p-1"
          >
            Assign Now
          </button>
        </div>
      )}

      {/* Master Receipt Total Stamp Banner */}
      <div className="bg-[#1C1A17] rounded-2xl border border-[#2E2A24] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:p-3 print:my-1 print-break-inside-avoid print:border-[#D9CDB8]">
        <div className="space-y-1">
          <span className="stamp-badge text-xs text-[#2ECC71] bg-[#142318] border border-[#2ECC71]/30 px-2.5 py-1">
            ★ VERIFIED &amp; CENT-BALANCED
          </span>
          <div className="text-xs text-[#7D7569] font-mono">
            {items.length} items • {fees.length} extra charges • {participants.length} diners
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono uppercase text-[#7D7569]">Grand Total</span>
          <div className="text-3xl font-serif font-bold text-[#F5EFE6] tracking-tight tabular-numbers">
            {formatCurrency(calculation.targetGrandTotal, currency)}
          </div>
        </div>
      </div>

      {/* Hasū-Kuji: The Rounding Lottery */}
      <RoundingLottery />

      {/* Participant Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
        {participants.map((p) => {
          const b = calculation.breakdowns[p.id];
          const isExpanded = !!expandedCards[p.id];
          const hasItems = b && b.items.length > 0;

          if (!b) return null;

          return (
            <div
              key={p.id}
              className={`bg-[#1C1A17] rounded-2xl border shadow-xs transition-all overflow-hidden flex flex-col justify-between print-break-inside-avoid print:border-[#D9CDB8] ${b.isLotteryWinner ? 'border-[#E05353]/60 ring-1 ring-[#E05353]/20' : 'border-[#2E2A24] hover:border-[#3D372F]'
                }`}
            >
              <div className="p-4 space-y-3 print:p-3">
                {/* Participant Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-xs print:w-6 print:h-6 print:text-xs"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.avatarLetter}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-[#F5EFE6]">{p.name}</h4>
                      </div>
                      <p className="text-xs text-[#7D7569] font-mono">
                        {b.items.length} item{b.items.length === 1 ? '' : 's'} consumed
                      </p>
                    </div>
                  </div>

                  {/* Personal Grand Total */}
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-[#F5EFE6] tabular-numbers print:text-base">
                      {formatCurrency(b.grandTotal, currency)}
                    </div>
                  </div>
                </div>

                {/* Micro Breakdown Summary */}
                <div className="bg-[#171513] rounded-xl p-3 border border-[#2E2A24] text-xs font-mono space-y-1.5 print:p-2 print:border-[#E5DDCF]">
                  <div className="flex justify-between text-[#7D7569]">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-[#F5EFE6] tabular-numbers">
                      {formatCurrency(b.rawSubtotal, currency)}
                    </span>
                  </div>

                  {b.feeShares.map((fs) => {
                    if (Math.abs(fs.amount) < 0.005) return null;
                    return (
                      <div key={fs.feeId} className="flex justify-between text-[#7D7569]">
                        <span>{fs.feeName}:</span>
                        <span className={`font-semibold tabular-numbers ${fs.isDiscount ? 'text-[#E05353]' : 'text-[#F5EFE6]'}`}>
                          {fs.isDiscount ? '-' : '+'}
                          {formatCurrency(fs.amount, currency)}
                        </span>
                      </div>
                    );
                  })}

                  {Math.abs(b.centsAdjustment) >= 0.005 && (
                    <div className="flex justify-between text-xs text-[#7D7569] italic pt-0.5 border-t border-[#2E2A24]">
                      <span>Penny Closure Adjustment:</span>
                      <span className="tabular-numbers">
                        {b.centsAdjustment > 0 ? '+' : ''}
                        {formatCurrency(b.centsAdjustment, currency)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Expandable itemized consumption list (Always expanded in print/PDF) */}
                {hasItems && (
                  <div className="pt-1">
                    <button
                      onClick={() => toggleExpand(p.id)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Hide' : 'View'} itemized details for ${p.name}`}
                      className="w-full flex items-center justify-between text-xs font-mono font-medium text-[#7D7569] hover:text-[#F5EFE6] py-1.5 cursor-pointer print:hidden"
                    >
                      <span>{isExpanded ? 'Hide Item Details' : 'View Item Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <div
                      className={`mt-2 space-y-1 pt-2 border-t border-[#2E2A24] text-xs font-mono ${isExpanded ? 'block' : 'hidden print:block'
                        }`}
                    >
                      {b.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-[#A89F91]">
                          <span className="truncate max-w-[200px]">
                            {it.itemName}{' '}
                            {it.shareRatio < 1 && (
                              <span className="text-[#7D7569] text-xs">
                                ({Math.round(it.shareRatio * 100)}%)
                              </span>
                            )}
                          </span>
                          <span className="font-semibold tabular-numbers text-[#F5EFE6]">
                            {formatCurrency(it.shareAmount, currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Note Option & Text Preview Box (Screen only) */}
      <div className="bg-[#1C1A17] rounded-2xl border border-[#2E2A24] p-4 sm:p-5 shadow-xs space-y-3 print:hidden">
        <h3 className="text-xs font-mono font-bold text-[#F5EFE6] uppercase tracking-wider">
          Add Payment Instructions (Optional)
        </h3>
        <input
          type="text"
          value={paymentNote}
          onChange={(e) => setPaymentNote(e.target.value)}
          placeholder="e.g. QR Me"
          className="w-full bg-[#171513] border border-[#3D372F] rounded-xl px-3 py-2 text-xs text-[#F5EFE6] placeholder:text-[#7D7569] focus:bg-[#121110] focus:border-[#F5EFE6] outline-none"
        />

        {/* Text Preview */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#7D7569] pb-1">
            <span>MESSAGE PREVIEW FOR GROUP CHAT</span>
            <button
              onClick={handleCopy}
              className="text-[#F5EFE6] font-semibold underline cursor-pointer hover:text-[#E6DDD0]"
            >
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          </div>
          <pre className="bg-[#171513] border border-[#2E2A24] p-3 rounded-xl text-xs font-mono text-[#A89F91] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {generateMessageText()}
          </pre>
        </div>
      </div>

      {/* Printable Payment Note (Visible in print/PDF only when filled) */}
      {paymentNote.trim() && (
        <div className="hidden print:block bg-[#FAF7F2] border border-[#D9CDB8] rounded-xl p-3 text-xs font-mono space-y-1 print-break-inside-avoid">
          <span className="font-bold text-[#1C1917] uppercase tracking-wider text-xs block">
            Payment Instructions
          </span>
          <p className="text-[#57534E] leading-relaxed">{paymentNote.trim()}</p>
        </div>
      )}

      {/* Printable Slip Footer */}
      <div className="hidden print:flex items-center justify-between pt-3 border-t border-[#D9CDB8] text-xs font-mono text-[#78716C] print-break-inside-avoid">
        <span>AsingAsing • Proportional Bill Settlement</span>
        <span>Exact Cent Balanced ✓</span>
      </div>
    </div>
  );
}
