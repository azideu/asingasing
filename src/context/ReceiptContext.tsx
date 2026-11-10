'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  LineItem,
  ExtraFee,
  Participant,
  StepType,
  CalculationResult,
} from '@/types/receipt';
import { calculateReceiptSplit } from '@/lib/calculator';
import { SAMPLE_PARTICIPANTS } from '@/lib/sampleReceipts';

interface ReceiptContextType {
  step: StepType;
  setStep: (step: StepType) => void;
  receiptImage: string | null;
  setReceiptImage: (img: string | null) => void;
  rawOcrText: string;
  setRawOcrText: (text: string) => void;
  items: LineItem[];
  setItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  fees: ExtraFee[];
  setFees: React.Dispatch<React.SetStateAction<ExtraFee[]>>;
  targetGrandTotal: number | null;
  setTargetGrandTotal: (total: number | null) => void;
  currency: string;
  setCurrency: (c: string) => void;
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;

  // Actions
  addItem: (item?: Partial<LineItem>) => void;
  updateItem: (id: string, updates: Partial<LineItem>) => void;
  deleteItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  addFee: (fee?: Partial<ExtraFee>) => void;
  updateFee: (id: string, updates: Partial<ExtraFee>) => void;
  deleteFee: (id: string) => void;
  addParticipant: (name: string, color?: string) => void;
  removeParticipant: (id: string) => void;
  updateParticipantColor: (id: string, color?: string) => void;
  toggleItemAssignment: (itemId: string, participantId: string) => void;
  assignItemToAll: (itemId: string) => void;
  clearItemAssignments: (itemId: string) => void;
  resolveDiscrepancy: () => void;
  resetAll: () => void;

  // Rounding Lottery
  roundingWinnerId: string | null;
  setRoundingWinnerId: (id: string | null) => void;

  // Calculation output
  calculation: CalculationResult;
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

const STORAGE_KEY = 'betsubetsu_session_v4';

export const CURATED_COLORS = [
  '#2563EB', // Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#7C3AED', // Violet
  '#EA580C', // Orange
  '#0D9488', // Teal
  '#DC2626', // Red
  '#4F46E5', // Indigo
  '#0891B2', // Cyan
  '#9333EA', // Purple
  '#16A34A', // Green
  '#C2410C', // Terracotta
  '#DB2777', // Magenta
  '#CA8A04', // Goldenrod
  '#0284C7', // Sky Blue
  '#475569', // Slate
];

export function ReceiptProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<StepType>(1);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string>('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [fees, setFees] = useState<ExtraFee[]>([]);
  const [targetGrandTotal, setTargetGrandTotal] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>('RM');
  const [participants, setParticipants] = useState<Participant[]>(SAMPLE_PARTICIPANTS);
  const [roundingWinnerId, setRoundingWinnerId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.items) setItems(parsed.items);
        if (parsed.fees) setFees(parsed.fees);
        if (parsed.participants && parsed.participants.length > 0)
          setParticipants(parsed.participants);
        if (parsed.targetGrandTotal !== undefined)
          setTargetGrandTotal(parsed.targetGrandTotal);
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.receiptImage) setReceiptImage(parsed.receiptImage);
        if (parsed.step) setStep(parsed.step);
      }
    } catch {
      // ignore JSON parse errors
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      const dataToSave = {
        step,
        items,
        fees,
        targetGrandTotal,
        currency,
        participants,
        receiptImage: receiptImage?.startsWith('data:image/svg') ? receiptImage : null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // ignore storage quota errors
    }
  }, [step, items, fees, targetGrandTotal, currency, participants, receiptImage, isHydrated]);

  const calculation = useMemo(() => {
    return calculateReceiptSplit(items, fees, participants, targetGrandTotal, roundingWinnerId);
  }, [items, fees, participants, targetGrandTotal, roundingWinnerId]);

  const addItem = (custom?: Partial<LineItem>) => {
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: custom?.name || 'New Item',
      qty: custom?.qty || 1,
      unitPrice: custom?.unitPrice || 0,
      totalPrice: custom?.totalPrice || (custom?.qty || 1) * (custom?.unitPrice || 0),
      assignedTo: custom?.assignedTo || [],
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (id: string, updates: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        // Auto-recalculate totalPrice if qty or unitPrice changed and totalPrice wasn't explicitly supplied
        if (
          (updates.qty !== undefined || updates.unitPrice !== undefined) &&
          updates.totalPrice === undefined
        ) {
          updated.totalPrice = parseFloat((updated.qty * updated.unitPrice).toFixed(2));
        }
        return updated;
      })
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const duplicateItem = (id: string) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (!existing) return prev;
      const clone: LineItem = {
        ...existing,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${existing.name} (Copy)`,
        assignedTo: [...existing.assignedTo],
      };
      const idx = prev.findIndex((item) => item.id === id);
      const nextList = [...prev];
      nextList.splice(idx + 1, 0, clone);
      return nextList;
    });
  };

  const addFee = (custom?: Partial<ExtraFee>) => {
    const newFee: ExtraFee = {
      id: `fee-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: custom?.name || 'Extra Fee',
      type: custom?.type || 'percent',
      value: custom?.value !== undefined ? custom.value : 10,
      appliesTo: custom?.appliesTo || 'subtotal',
      isDiscount: custom?.isDiscount || false,
    };
    setFees((prev) => [...prev, newFee]);
  };

  const updateFee = (id: string, updates: Partial<ExtraFee>) => {
    setFees((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const deleteFee = (id: string) => {
    setFees((prev) => prev.filter((f) => f.id !== id));
  };

  const addParticipant = (name: string, customColor?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setParticipants((prev) => {
      // Find an unused color from CURATED_COLORS so each person gets a fresh hue
      const usedColors = new Set(prev.map((p) => p.color.toLowerCase()));
      const autoColor =
        customColor ||
        CURATED_COLORS.find((c) => !usedColors.has(c.toLowerCase())) ||
        CURATED_COLORS[prev.length % CURATED_COLORS.length];

      const newParticipant: Participant = {
        id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: trimmed,
        color: autoColor,
        avatarLetter: trimmed.charAt(0).toUpperCase(),
      };
      return [...prev, newParticipant];
    });
  };

  const updateParticipantColor = (id: string, newColor?: string) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (newColor) return { ...p, color: newColor };
        // Cycle to next color in CURATED_COLORS
        const currentIdx = CURATED_COLORS.findIndex(
          (c) => c.toLowerCase() === p.color.toLowerCase()
        );
        const nextColor = CURATED_COLORS[(currentIdx + 1) % CURATED_COLORS.length];
        return { ...p, color: nextColor };
      })
    );
  };

  const removeParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    // Remove this participant from all item assignments
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        assignedTo: item.assignedTo.filter((pid) => pid !== id),
      }))
    );
  };

  const toggleItemAssignment = (itemId: string, participantId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.assignedTo.includes(participantId);
        const nextAssigned = exists
          ? item.assignedTo.filter((id) => id !== participantId)
          : [...item.assignedTo, participantId];
        return { ...item, assignedTo: nextAssigned };
      })
    );
  };

  const assignItemToAll = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          assignedTo: participants.map((p) => p.id),
        };
      })
    );
  };

  const clearItemAssignments = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return { ...item, assignedTo: [] };
      })
    );
  };

  const resolveDiscrepancy = () => {
    const diff = calculation.discrepancy;
    if (Math.abs(diff) < 0.005) return;

    // Check if a Rounding Adjustment fee already exists
    const existingRoundingIdx = fees.findIndex((f) =>
      f.name.toLowerCase().includes('rounding')
    );

    if (existingRoundingIdx >= 0) {
      // Adjust existing rounding
      const existing = fees[existingRoundingIdx];
      const currentNet = existing.isDiscount ? -existing.value : existing.value;
      const targetNet = currentNet - diff; // subtract diff to bring calculated to target
      updateFee(existing.id, {
        value: parseFloat(Math.abs(targetNet).toFixed(2)),
        isDiscount: targetNet < 0,
      });
    } else {
      // Add new rounding fee
      const roundingFee: ExtraFee = {
        id: `fee-rounding-${Date.now()}`,
        name: 'Rounding Adjustment',
        type: 'fixed',
        value: parseFloat(Math.abs(diff).toFixed(2)),
        appliesTo: 'subtotal',
        isDiscount: diff > 0, // if calculated is higher than target, subtract to match
      };
      setFees((prev) => [...prev, roundingFee]);
    }
  };

  const resetAll = () => {
    setItems([]);
    setFees([]);
    setTargetGrandTotal(null);
    setReceiptImage(null);
    setRawOcrText('');
    setCurrency('RM');
    setParticipants(SAMPLE_PARTICIPANTS);
    setRoundingWinnerId(null);
    setStep(1);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <ReceiptContext.Provider
      value={{
        step,
        setStep,
        receiptImage,
        setReceiptImage,
        rawOcrText,
        setRawOcrText,
        items,
        setItems,
        fees,
        setFees,
        targetGrandTotal,
        setTargetGrandTotal,
        currency,
        setCurrency,
        participants,
        setParticipants,
        addItem,
        updateItem,
        deleteItem,
        duplicateItem,
        addFee,
        updateFee,
        deleteFee,
        addParticipant,
        removeParticipant,
        updateParticipantColor,
        toggleItemAssignment,
        assignItemToAll,
        clearItemAssignments,
        resolveDiscrepancy,
        resetAll,
        roundingWinnerId,
        setRoundingWinnerId,
        calculation,
      }}
    >
      {children}
    </ReceiptContext.Provider>
  );
}

export function useReceipt() {
  const ctx = useContext(ReceiptContext);
  if (!ctx) {
    throw new Error('useReceipt must be used within a ReceiptProvider');
  }
  return ctx;
}
