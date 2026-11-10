import { z } from 'zod';

export const LineItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Item name cannot be empty').max(255),
  qty: z.number().int().positive('Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  totalPrice: z.number().min(0, 'Total price cannot be negative'),
  assignedTo: z.array(z.string()),
  notes: z.string().max(500).optional(),
});

export const ExtraFeeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Fee name cannot be empty').max(100),
  type: z.enum(['percent', 'fixed']),
  value: z.number().min(0, 'Fee value cannot be negative'),
  appliesTo: z.enum(['subtotal', 'subtotal_plus_service']),
  isDiscount: z.boolean().optional(),
});

export const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Participant name cannot be empty').max(100),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  avatarLetter: z.string().min(1).max(4),
});

export const StoredReceiptStateSchema = z.object({
  step: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  items: z.array(LineItemSchema).optional(),
  fees: z.array(ExtraFeeSchema).optional(),
  targetGrandTotal: z.number().min(0).nullable().optional(),
  currency: z.string().min(1).max(10).optional(),
  participants: z.array(ParticipantSchema).optional(),
  receiptImage: z.string().nullable().optional(),
});

// Helper functions for safe AI output coercion
const coerceNumber = z.preprocess((val) => {
  if (val === null || val === undefined || val === '') return undefined;
  if (typeof val === 'number') return isNaN(val) ? undefined : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}, z.number().optional());

const coerceQuantity = z.preprocess((val) => {
  if (val === null || val === undefined || val === '') return 1;
  if (typeof val === 'number') return isNaN(val) || val <= 0 ? 1 : Math.round(val);
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) || num <= 0 ? 1 : num;
  }
  return 1;
}, z.number().default(1));

const coerceBoolean = z.preprocess((val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1';
  }
  if (typeof val === 'number') return val === 1;
  return false;
}, z.boolean().default(false));

const coerceFeeType = z.preprocess((val) => {
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (lower.includes('percent') || lower.includes('%')) return 'percent';
    if (lower.includes('fix') || lower.includes('amt') || lower.includes('curr')) return 'fixed';
  }
  return 'percent';
}, z.enum(['percent', 'fixed']).default('percent'));

const coerceAppliesTo = z.preprocess((val) => {
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (lower.includes('service') || lower.includes('plus') || lower.includes('svc')) {
      return 'subtotal_plus_service';
    }
  }
  return 'subtotal';
}, z.enum(['subtotal', 'subtotal_plus_service']).default('subtotal'));

export const GeminiRawItemSchema = z.object({
  name: z.preprocess((val) => (val === null || val === undefined ? 'Item' : String(val).trim()), z.string().default('Item')),
  qty: coerceQuantity,
  unitPrice: coerceNumber,
  totalPrice: coerceNumber,
  notes: z.preprocess((val) => (val === null || val === undefined ? undefined : String(val).trim()), z.string().optional()),
});

export const GeminiRawFeeSchema = z.object({
  name: z.preprocess((val) => (val === null || val === undefined ? 'Fee' : String(val).trim()), z.string().default('Fee')),
  type: coerceFeeType,
  value: coerceNumber,
  printedAmount: coerceNumber,
  appliesTo: coerceAppliesTo,
  isDiscount: coerceBoolean,
});

export const GeminiResponseSchema = z.object({
  items: z.preprocess((val) => (Array.isArray(val) ? val : []), z.array(GeminiRawItemSchema).default([])),
  fees: z.preprocess((val) => (Array.isArray(val) ? val : []), z.array(GeminiRawFeeSchema).default([])),
  subtotal: coerceNumber,
  grandTotal: coerceNumber,
});

export const ReceiptSchema = z.object({
  items: z.array(LineItemSchema),
  fees: z.array(ExtraFeeSchema),
  participants: z.array(ParticipantSchema),
  targetGrandTotal: z.number().min(0).nullable(),
  currency: z.string().min(1),
});

export type ValidatedLineItem = z.infer<typeof LineItemSchema>;
export type ValidatedExtraFee = z.infer<typeof ExtraFeeSchema>;
export type ValidatedParticipant = z.infer<typeof ParticipantSchema>;
export type ValidatedReceipt = z.infer<typeof ReceiptSchema>;
export type ValidatedGeminiResponse = z.infer<typeof GeminiResponseSchema>;
export type ValidatedStoredReceiptState = z.infer<typeof StoredReceiptStateSchema>;
