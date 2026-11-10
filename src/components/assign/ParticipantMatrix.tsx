'use client';

import React, { useState } from 'react';
import { useReceipt } from '@/context/ReceiptContext';
import { formatCurrency } from '@/lib/calculator';
import {
  UserPlus,
  Users,
  Check,
  AlertCircle,
  Sparkles,
  ChevronRight,
  X,
  Share2,
  CheckCircle2,
} from 'lucide-react';

export function ParticipantMatrix() {
  const {
    items,
    participants,
    addParticipant,
    removeParticipant,
    toggleItemAssignment,
    assignItemToAll,
    clearItemAssignments,
    calculation,
    currency,
    setStep,
  } = useReceipt();

  const [newPersonName, setNewPersonName] = useState('');

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    addParticipant(newPersonName);
    setNewPersonName('');
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5DDCF]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917] font-serif">
            People &amp; Item Assignment
          </h2>
          <p className="text-xs text-[#78716C]">
            Select who consumed each item. Shared dishes automatically divide equally among assigned diners.
          </p>
        </div>

        <button
          onClick={() => setStep(4)}
          className="inline-flex items-center gap-1.5 bg-[#1C1917] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#332E2B] transition-all cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <span>View Final Summary</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Unassigned Sentinel Alert */}
      {calculation.unassignedItemIds.length > 0 ? (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{calculation.unassignedItemIds.length} item(s) unassigned:</strong> Tag someone or click &ldquo;Split All&rdquo; so nobody gets missed.
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
            {calculation.unassignedItemIds.length} Pending
          </span>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              All {items.length} items successfully assigned across {participants.length} diners!
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
            100% Accounted
          </span>
        </div>
      )}

      {/* Participant Management Bar */}
      <div className="bg-white rounded-2xl border border-[#E5DDCF] p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#78716C]" />
            <h3 className="text-xs font-mono font-bold text-[#1C1917] uppercase tracking-wider">
              Participants ({participants.length})
            </h3>
          </div>

          {/* Add participant input form */}
          <form onSubmit={handleAddPerson} className="flex items-center gap-2">
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              placeholder="Add person (e.g. Kenji)"
              className="bg-[#FAF7F2] border border-[#D9CDB8] rounded-xl px-3 py-1.5 text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:bg-white focus:border-[#1C1917] outline-none w-44"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 bg-[#1C1917] text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#332E2B] transition-colors cursor-pointer shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Participant Chips with Live Subtotal Previews */}
        <div className="flex flex-wrap gap-2 pt-1">
          {participants.map((p) => {
            const personal = calculation.breakdowns[p.id];
            const runningTotal = personal ? personal.grandTotal : 0;

            return (
              <div
                key={p.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5DDCF] bg-[#FAF7F2] text-xs shadow-2xs"
              >
                <div
                  className="w-5 h-5 rounded-full text-white font-bold flex items-center justify-center text-xs font-mono shadow-xs"
                  style={{ backgroundColor: p.color }}
                >
                  {p.avatarLetter}
                </div>
                <span className="font-semibold text-[#1C1917]">{p.name}</span>
                <span className="font-mono text-[#78716C] text-xs tabular-numbers font-medium">
                  {formatCurrency(runningTotal, currency)}
                </span>
                {participants.length > 1 && (
                  <button
                    onClick={() => removeParticipant(p.id)}
                    aria-label={`Remove participant ${p.name}`}
                    className="text-[#78716C] hover:text-[#C53030] w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer"
                    title={`Remove ${p.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Items Assignment List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono uppercase text-[#78716C] px-1 font-semibold">
          <span>Dish / Line Item</span>
          <span>Assign Diners</span>
        </div>

        <div className="space-y-2.5">
          {items.map((item) => {
            const assignedIds = item.assignedTo || [];
            const isUnassigned = assignedIds.length === 0;
            const splitCount = assignedIds.length;
            const shareAmount = splitCount > 0 ? item.totalPrice / splitCount : item.totalPrice;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl bg-white border transition-all ${
                  isUnassigned
                    ? 'border-amber-300 ring-1 ring-amber-100'
                    : 'border-[#E5DDCF] hover:border-[#C4B9A7]'
                } shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                {/* Item Info */}
                <div className="space-y-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#1C1917]">
                      {item.name}
                    </span>
                    {item.qty > 1 && (
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[#F3ECE1] text-[#78716C]">
                        {item.qty}x
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-[#78716C]">
                    <span className="font-bold text-[#1C1917] tabular-numbers">
                      {formatCurrency(item.totalPrice, currency)}
                    </span>
                    {splitCount > 1 && (
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium text-xs">
                        1/{splitCount} each ({formatCurrency(shareAmount, currency)})
                      </span>
                    )}
                    {isUnassigned && (
                      <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium text-xs">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>

                {/* Assignment Affordances: Participant toggles + Quick Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {participants.map((p) => {
                    const isSelected = assignedIds.includes(p.id);

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleItemAssignment(item.id, p.id)}
                        aria-pressed={isSelected}
                        aria-label={`Assign ${item.name} to ${p.name}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917] ${
                          isSelected
                            ? 'text-white shadow-xs'
                            : 'bg-[#FAF7F2] text-[#57534E] hover:bg-[#F3ECE1] border border-[#E5DDCF]'
                        }`}
                        style={{
                          backgroundColor: isSelected ? p.color : undefined,
                        }}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                            isSelected ? 'bg-white/30 text-white' : 'text-white'
                          }`}
                          style={{
                            backgroundColor: !isSelected ? p.color : undefined,
                          }}
                        >
                          {p.avatarLetter}
                        </div>
                        <span>{p.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </button>
                    );
                  })}

                  {/* Split All Button */}
                  <button
                    type="button"
                    onClick={() => assignItemToAll(item.id)}
                    aria-label={`Split ${item.name} between everyone`}
                    className="text-xs font-medium text-[#57534E] hover:text-[#1C1917] bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#E5DDCF] px-3 py-2 min-h-[40px] rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917]"
                    title="Split between everyone"
                  >
                    Split All
                  </button>

                  {/* Clear Button */}
                  {assignedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => clearItemAssignments(item.id)}
                      aria-label={`Clear assignments for ${item.name}`}
                      className="text-[#78716C] hover:text-[#C53030] w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F3ECE1] transition-colors cursor-pointer"
                      title="Clear assignments"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
