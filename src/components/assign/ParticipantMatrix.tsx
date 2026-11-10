'use client';

import React, { useState, useRef } from 'react';
import { useReceipt } from '@/context/ReceiptContext';
import { formatCurrency } from '@/lib/calculator';
import {
  UserPlus,
  Users,
  Check,
  AlertCircle,
  ChevronRight,
  X,
  CheckCircle2,
} from 'lucide-react';

export function ParticipantMatrix() {
  const {
    items,
    participants,
    addParticipant,
    removeParticipant,
    updateParticipantColor,
    toggleItemAssignment,
    assignItemToAll,
    clearItemAssignments,
    calculation,
    currency,
    setStep,
  } = useReceipt();

  const [newPersonName, setNewPersonName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [activeAssignItemId, setActiveAssignItemId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeAssignItem = items.find((i) => i.id === activeAssignItemId);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPersonName.trim();
    if (!trimmed) {
      setNameError('Please enter a name');
      inputRef.current?.focus();
      return;
    }
    if (participants.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError('A person with this name already exists');
      inputRef.current?.focus();
      return;
    }
    setNameError(null);
    addParticipant(trimmed);
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
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{calculation.unassignedItemIds.length} item(s) unassigned:</strong> Tag someone or click &ldquo;Split All&rdquo; so nobody gets missed.
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded self-start sm:self-auto">
            {calculation.unassignedItemIds.length} Pending
          </span>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              All {items.length} items successfully assigned across {participants.length} diners!
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded self-start sm:self-auto">
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
          <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
            <form onSubmit={handleAddPerson} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                ref={inputRef}
                type="text"
                value={newPersonName}
                onChange={(e) => {
                  setNewPersonName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="Add person (e.g. Kenji)"
                aria-invalid={!!nameError}
                aria-describedby={nameError ? 'name-input-error' : undefined}
                className={`bg-[#FAF7F2] border rounded-xl px-3 py-1.5 text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:bg-white outline-none flex-1 sm:w-44 transition-all ${
                  nameError
                    ? 'border-[#C53030] focus:border-[#C53030] ring-2 ring-[#C53030]/15'
                    : 'border-[#D9CDB8] focus:border-[#1C1917]'
                }`}
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 bg-[#1C1917] text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#332E2B] transition-colors cursor-pointer shadow-2xs active:scale-95 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
            {nameError && (
              <p
                id="name-input-error"
                className="text-xs text-[#C53030] font-medium flex items-center gap-1 mt-1 animate-fadeIn"
              >
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{nameError}</span>
              </p>
            )}
          </div>
        </div>

        {/* Participant Chips with Live Subtotal Previews (Horizontal Glide on Mobile) */}
        <div className="flex overflow-x-auto no-scrollbar py-1 gap-2 sm:flex-wrap -mx-1 px-1">
          {participants.map((p) => {
            const personal = calculation.breakdowns[p.id];
            const runningTotal = personal ? personal.grandTotal : 0;

            return (
              <div
                key={p.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5DDCF] bg-[#FAF7F2] text-xs shadow-2xs shrink-0"
              >
                <button
                  type="button"
                  onClick={() => updateParticipantColor(p.id)}
                  title={`Click to change ${p.name}'s color`}
                  aria-label={`Change color for ${p.name}`}
                  className="w-5 h-5 rounded-full text-white font-bold flex items-center justify-center text-xs font-mono shadow-xs hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                  style={{ backgroundColor: p.color }}
                >
                  {p.avatarLetter}
                </button>
                <span className="font-semibold text-[#1C1917] whitespace-nowrap">{p.name}</span>
                <span className="font-mono text-[#78716C] text-xs tabular-numbers font-medium whitespace-nowrap">
                  {formatCurrency(runningTotal, currency)}
                </span>
                {participants.length > 1 && (
                  <button
                    onClick={() => removeParticipant(p.id)}
                    aria-label={`Remove participant ${p.name}`}
                    className="text-[#78716C] hover:text-[#C53030] w-5 h-5 flex items-center justify-center rounded-md transition-colors cursor-pointer"
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
                <div className="space-y-1 min-w-[180px]">
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

                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#78716C]">
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

                {/* Mobile View (< md): Adaptive Layout (Tokens vs Avatar Stack + Sheet Trigger) */}
                <div className="flex md:hidden flex-col gap-2.5 w-full">
                  {participants.length <= 6 ? (
                    // When <= 6 participants: Compact Circular Avatar Tokens with micro check badge
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
                            className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'text-white shadow-xs ring-2 ring-offset-2 ring-[#1C1917]'
                                : 'bg-[#FAF7F2] text-[#57534E] hover:bg-[#F3ECE1] border border-[#E5DDCF]'
                            }`}
                            style={{
                              backgroundColor: isSelected ? p.color : undefined,
                            }}
                            title={`${p.name}${isSelected ? ' (Assigned)' : ''}`}
                          >
                            <span style={{ color: !isSelected ? p.color : '#FFFFFF' }}>
                              {p.avatarLetter}
                            </span>
                            {isSelected && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1C1917] text-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    // When > 6 participants: Avatar Stack + Assign Button Trigger
                    <div className="flex items-center justify-between gap-2 bg-[#FAF7F2] p-2 rounded-xl border border-[#E5DDCF]">
                      <div className="flex items-center -space-x-1.5 overflow-hidden pl-1">
                        {assignedIds.length === 0 ? (
                          <span className="text-xs text-[#A8A29E] italic font-mono">
                            Nobody assigned
                          </span>
                        ) : (
                          <>
                            {assignedIds.slice(0, 4).map((pid) => {
                              const p = participants.find((part) => part.id === pid);
                              if (!p) return null;
                              return (
                                <div
                                  key={p.id}
                                  className="w-7 h-7 rounded-full text-white text-xs font-mono font-bold flex items-center justify-center ring-2 ring-white shadow-xs"
                                  style={{ backgroundColor: p.color }}
                                  title={p.name}
                                >
                                  {p.avatarLetter}
                                </div>
                              );
                            })}
                            {assignedIds.length > 4 && (
                              <div className="w-7 h-7 rounded-full bg-[#1C1917] text-white text-xs font-mono font-bold flex items-center justify-center ring-2 ring-white shadow-xs">
                                +{assignedIds.length - 4}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveAssignItemId(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9CDB8] bg-white hover:bg-[#FAF7F2] text-xs font-semibold text-[#1C1917] cursor-pointer shadow-2xs transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{assignedIds.length > 0 ? `Assign (${assignedIds.length})` : 'Assign...'}</span>
                      </button>
                    </div>
                  )}

                  {/* Mobile Quick Action Buttons (Split All / Clear) */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F3ECE1]">
                    <span className="text-xs font-mono text-[#78716C]">
                      {assignedIds.length === 0
                        ? '0 diners'
                        : `${assignedIds.length} diner${assignedIds.length > 1 ? 's' : ''}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => assignItemToAll(item.id)}
                        className="text-xs font-medium text-[#57534E] hover:text-[#1C1917] bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#E5DDCF] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Split All
                      </button>
                      {assignedIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => clearItemAssignments(item.id)}
                          className="text-xs font-medium text-[#C53030] hover:bg-red-50 border border-transparent hover:border-red-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop View (>= md): Full Pill Grid with Participant Names */}
                <div className="hidden md:flex flex-wrap items-center gap-2">
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

      {/* Mobile Assignment Bottom Sheet Modal (For > 6 participants) */}
      {activeAssignItem && (
        <div className="fixed inset-0 z-50 md:hidden flex items-end justify-center bg-black/50 backdrop-blur-xs animate-fadeIn p-0">
          {/* Backdrop click to close */}
          <div
            className="absolute inset-0"
            onClick={() => setActiveAssignItemId(null)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-t-3xl border-t border-[#E5DDCF] shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col z-10 animate-slideUp">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-[#E5DDCF] rounded-full mx-auto -mt-1" />

            {/* Sheet Header: Dish info */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#F3ECE1]">
              <div>
                <h4 className="font-bold text-base text-[#1C1917] font-serif">
                  {activeAssignItem.name}
                </h4>
                <div className="flex items-center gap-2 text-xs font-mono text-[#78716C] mt-0.5">
                  <span className="font-bold text-[#1C1917]">
                    {formatCurrency(activeAssignItem.totalPrice, currency)}
                  </span>
                  <span>•</span>
                  <span>{activeAssignItem.assignedTo?.length || 0} assigned</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveAssignItemId(null)}
                aria-label="Close assignment sheet"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF7F2] text-[#78716C] hover:text-[#1C1917] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions (All / None) */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase text-[#78716C] font-semibold">
                Tap to toggle diners
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => assignItemToAll(activeAssignItem.id)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#E5DDCF] text-[#1C1917] cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => clearItemAssignments(activeAssignItem.id)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-[#C53030] hover:bg-red-50 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Diner List Checklist */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#F3ECE1] pr-1">
              {participants.map((p) => {
                const isSelected = activeAssignItem.assignedTo?.includes(p.id);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleItemAssignment(activeAssignItem.id, p.id)}
                    className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#FAF7F2] px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full text-white text-xs font-mono font-bold flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.avatarLetter}
                      </div>
                      <span className="text-sm font-medium text-[#1C1917]">{p.name}</span>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-[#1C1917] border-[#1C1917] text-white'
                          : 'border-[#D9CDB8] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Done Button */}
            <button
              type="button"
              onClick={() => setActiveAssignItemId(null)}
              className="w-full py-3 bg-[#1C1917] hover:bg-[#332E2B] text-white text-sm font-semibold rounded-xl shadow-xs cursor-pointer text-center"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
