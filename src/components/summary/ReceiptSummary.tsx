'use client';

import React, { useState, useEffect } from 'react';
import { useReceipt } from '@/context/ReceiptContext';
import { formatCurrency } from '@/lib/calculator';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  Share2,
  Receipt,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export function ReceiptSummary() {
  const { calculation, currency, participants, items, fees, setStep } = useReceipt();
  const [copied, setCopied] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [paymentNote, setPaymentNote] = useState('');

  // Fire celebratory confetti when loaded and balanced
  useEffect(() => {
    if (calculation.allAssigned && calculation.isBalanced) {
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
  }, [calculation.allAssigned, calculation.isBalanced]);

  const toggleExpand = (pid: string) => {
    setExpandedCards((prev) => ({ ...prev, [pid]: !prev[pid] }));
  };

  // Generate formatted text for WhatsApp / Telegram
  const generateMessageText = () => {
    let msg = `🧾 *BETSUBETSU BILL BREAKDOWN*\n`;
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

    if (paymentNote.trim()) {
      msg += `💳 *Payment Details:*\n${paymentNote.trim()}\n\n`;
    }

    msg += `✓ *Split proportionally with BetsuBetsu (Exact Cent Balanced)*`;
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
    <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5DDCF]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917] font-serif">
            Summary &amp; Settle
          </h2>
          <p className="text-xs text-[#78716C]">
            Exact per-person shares with proportional tax and service distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9CDB8] bg-white text-xs font-medium text-[#1C1917] hover:bg-[#FAF7F2] transition-colors cursor-pointer shadow-2xs"
            title="Print receipt"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Slip</span>
          </button>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 bg-[#1C1917] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#332E2B] transition-all cursor-pointer shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
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

      {/* Discrepancy warning if any items still unassigned */}
      {!calculation.allAssigned && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {calculation.unassignedItemIds.length} item(s) are not assigned to anyone yet. Go back to Step 3 to tag them.
            </span>
          </div>
          <button
            onClick={() => setStep(3)}
            className="text-amber-800 font-bold underline cursor-pointer"
          >
            Assign Now
          </button>
        </div>
      )}

      {/* Master Receipt Total Stamp Banner */}
      <div className="bg-white rounded-2xl border border-[#E5DDCF] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="stamp-badge text-[10px] text-[#1B6B38] bg-[#EBF5EE] border border-[#C6E6D1] px-2 py-0.5">
            ★ VERIFIED &amp; CENT-BALANCED
          </span>
          <div className="text-xs text-[#78716C] font-mono">
            {items.length} items • {fees.length} extra charges • {participants.length} diners
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono uppercase text-[#78716C]">Grand Total</span>
          <div className="text-3xl font-serif font-bold text-[#1C1917] tracking-tight tabular-numbers">
            {formatCurrency(calculation.targetGrandTotal, currency)}
          </div>
        </div>
      </div>

      {/* Participant Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {participants.map((p) => {
          const b = calculation.breakdowns[p.id];
          const isExpanded = !!expandedCards[p.id];
          const hasItems = b && b.items.length > 0;

          if (!b) return null;

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-[#E5DDCF] shadow-xs hover:border-[#C4B9A7] transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-4 space-y-3">
                {/* Participant Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-xs"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.avatarLetter}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1C1917]">{p.name}</h4>
                      <p className="text-[11px] text-[#78716C] font-mono">
                        {b.items.length} item{b.items.length === 1 ? '' : 's'} consumed
                      </p>
                    </div>
                  </div>

                  {/* Personal Grand Total */}
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-[#1C1917] tabular-numbers">
                      {formatCurrency(b.grandTotal, currency)}
                    </div>
                  </div>
                </div>

                {/* Micro Breakdown Summary */}
                <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#E5DDCF] text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-[#78716C]">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-[#1C1917] tabular-numbers">
                      {formatCurrency(b.rawSubtotal, currency)}
                    </span>
                  </div>

                  {b.feeShares.map((fs) => (
                    <div key={fs.feeId} className="flex justify-between text-[#78716C]">
                      <span>{fs.feeName}:</span>
                      <span className={`font-semibold tabular-numbers ${fs.isDiscount ? 'text-[#C53030]' : 'text-[#1C1917]'}`}>
                        {fs.isDiscount ? '-' : '+'}
                        {formatCurrency(fs.amount, currency)}
                      </span>
                    </div>
                  ))}

                  {b.centsAdjustment !== 0 && (
                    <div className="flex justify-between text-[11px] text-[#78716C] italic pt-0.5 border-t border-[#E5DDCF]">
                      <span>Penny Closure Adjustment:</span>
                      <span className="tabular-numbers">
                        {b.centsAdjustment > 0 ? '+' : ''}
                        {formatCurrency(b.centsAdjustment, currency)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Expandable itemized consumption list */}
                {hasItems && (
                  <div className="pt-1">
                    <button
                      onClick={() => toggleExpand(p.id)}
                      className="w-full flex items-center justify-between text-[11px] font-mono font-medium text-[#78716C] hover:text-[#1C1917] py-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Item Details' : 'View Item Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1 pt-2 border-t border-[#F3ECE1] text-xs font-mono">
                        {b.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-[#57534E]">
                            <span className="truncate max-w-[200px]">
                              {it.itemName}{' '}
                              {it.shareRatio < 1 && (
                                <span className="text-[#A8A29E] text-[10px]">
                                  ({Math.round(it.shareRatio * 100)}%)
                                </span>
                              )}
                            </span>
                            <span className="font-semibold tabular-numbers">
                              {formatCurrency(it.shareAmount, currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Note Option & Text Preview Box */}
      <div className="bg-white rounded-2xl border border-[#E5DDCF] p-4 sm:p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-mono font-bold text-[#1C1917] uppercase tracking-wider">
          Add Payment Instructions (Optional)
        </h3>
        <input
          type="text"
          value={paymentNote}
          onChange={(e) => setPaymentNote(e.target.value)}
          placeholder="e.g. Venmo @your-handle or PayNow / Zelle to 9123-4567"
          className="w-full bg-[#FAF7F2] border border-[#D9CDB8] rounded-xl px-3 py-2 text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:bg-white focus:border-[#1C1917] outline-none"
        />

        {/* Text Preview */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#78716C] pb-1">
            <span>MESSAGE PREVIEW FOR GROUP CHAT</span>
            <button
              onClick={handleCopy}
              className="text-[#1C1917] font-semibold underline cursor-pointer"
            >
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          </div>
          <pre className="bg-[#FAF7F2] border border-[#E5DDCF] p-3 rounded-xl text-xs font-mono text-[#57534E] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {generateMessageText()}
          </pre>
        </div>
      </div>
    </div>
  );
}
