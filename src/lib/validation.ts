import { z } from 'zod';

export const LineItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Item name cannot be empty'),
  qty: z.number().int().positive('Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  totalPrice: z.number().min(0, 'Total price cannot be negative'),
  assignedTo: z.array(z.string()),
  notes: z.string().optional(),
});

export const ExtraFeeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Fee name cannot be empty'),
  type: z.enum(['percent', 'fixed']),
  value: z.number().min(0, 'Fee value cannot be negative'),
  appliesTo: z.enum(['subtotal', 'subtotal_plus_service']),
  isDiscount: z.boolean().optional(),
});

export const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Participant name cannot be empty'),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  avatarLetter: z.string().min(1).max(2),
});

export const ReceiptSchema = z.object({
  items: z.array(LineItemSchema),
  fees: z.array(ExtraFeeSchema),
  participants: z.array(ParticipantSchema),
  targetGrandTotal: z.number().positive().nullable(),
  currency: z.string().min(1),
});

export type ValidatedLineItem = z.infer<typeof LineItemSchema>;
export type ValidatedExtraFee = z.infer<typeof ExtraFeeSchema>;
export type ValidatedParticipant = z.infer<typeof ParticipantSchema>;
export type ValidatedReceipt = z.infer<typeof ReceiptSchema>;
