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

export const GeminiRawItemSchema = z.object({
  name: z.string().default('Item'),
  qty: z.coerce.number().optional().default(1),
  unitPrice: z.coerce.number().optional(),
  totalPrice: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export const GeminiRawFeeSchema = z.object({
  name: z.string().default('Fee'),
  type: z.enum(['percent', 'fixed']).optional().default('percent'),
  value: z.coerce.number().optional().default(0),
  printedAmount: z.coerce.number().optional(),
  appliesTo: z.enum(['subtotal', 'subtotal_plus_service']).optional().default('subtotal'),
  isDiscount: z.boolean().optional().default(false),
});

export const GeminiResponseSchema = z.object({
  items: z.array(GeminiRawItemSchema).optional().default([]),
  fees: z.array(GeminiRawFeeSchema).optional().default([]),
  subtotal: z.coerce.number().optional(),
  grandTotal: z.coerce.number().optional(),
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
