'use client';

import React, { useState } from 'react';
import { useReceipt } from '@/context/ReceiptContext';
import { formatCurrency } from '@/lib/calculator';
import { parseReceiptText } from '@/lib/ocr';
import { FEE_PRESETS } from '@/types/receipt';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Layers,
  Eye,
  EyeOff,
  Sparkles,
  ClipboardPaste,
  X,
  FileText,
} from 'lucide-react';

// Isolated Receipt Inspection Loupe to prevent high-frequency mousemove events from re-rendering the editor
function ReceiptLoupe({ receiptImage }: { receiptImage: string }) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panPosition.x, y: e.touches[0].clientY - panPosition.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  return (
    <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5DDCF] shadow-xs overflow-hidden flex flex-col h-[380px] lg:h-[520px]">
      {/* Loupe Header / Controls */}
      <div className="px-4 py-2.5 bg-[#F3ECE1]/70 border-b border-[#E5DDCF] flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-[#57534E] uppercase tracking-wider">
          Receipt Inspection Loupe
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
            aria-label="Zoom In"
            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-[#57534E] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917]"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
            aria-label="Zoom Out"
            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-[#57534E] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917]"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetZoom}
            aria-label="Reset Zoom"
            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-[#57534E] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917]"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono text-[#78716C] ml-1">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>
      </div>

      {/* Draggable Canvas Viewport */}
      <div
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-[#FAF7F2] flex items-center justify-center p-4 select-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={receiptImage}
          alt="Receipt Loupe"
          draggable={false}
          style={{
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          className="max-h-full object-contain pointer-events-none drop-shadow-md"
        />
      </div>
      <div className="px-3 py-2 bg-[#FAF7F2] border-t border-[#E5DDCF] text-xs text-[#78716C] text-center font-mono">
        Drag to pan • inspect faint item prices
      </div>
    </div>
  );
}

export function ReceiptEditor() {
  const {
    items,
    setItems,
    updateItem,
    addItem,
    deleteItem,
    duplicateItem,
    fees,
    setFees,
    addFee,
    updateFee,
    deleteFee,
    targetGrandTotal,
    setTargetGrandTotal,
    currency,
    receiptImage,
    calculation,
    resolveDiscrepancy,
    setStep,
    rawOcrText,
    setRawOcrText,
  } = useReceipt();

  const [showImagePane, setShowImagePane] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<'items' | 'slip'>('items');

  // Paste / Raw text editor modal
  const [showTextModal, setShowTextModal] = useState<boolean>(false);
  const [editorRawText, setEditorRawText] = useState<string>(rawOcrText || '');

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5DDCF]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917] font-serif">
            Verify &amp; Refine Receipt
          </h2>
          <p className="text-xs text-[#78716C]">
            Compare OCR transcription against your receipt, adjust misread lines, and configure taxes or fees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {receiptImage && (
            <button
              onClick={() => setShowImagePane(!showImagePane)}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9CDB8] bg-white text-xs font-medium text-[#1C1917] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              {showImagePane ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showImagePane ? 'Hide Receipt Slip' : 'View Receipt Slip'}</span>
            </button>
          )}

          <button
            onClick={() => setStep(3)}
            className="inline-flex items-center gap-1.5 bg-[#1C1917] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#332E2B] transition-all cursor-pointer shadow-xs"
          >
            <span>Proceed to Assign</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Discrepancy Sentinel Banner */}
      {!calculation.isBalanced ? (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-amber-950 flex items-center gap-2">
                Discrepancy Detected: Differs by{' '}
                <span className="font-mono underline">
                  {formatCurrency(Math.abs(calculation.discrepancy), currency)}
                </span>
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                Calculated sum ({formatCurrency(calculation.calculatedGrandTotal, currency)}) does
                not match printed Target Total ({formatCurrency(calculation.targetGrandTotal, currency)}).
                Commonly caused by 1–2¢ rounding or unlisted fees.
              </div>
            </div>
          </div>

          <button
            onClick={resolveDiscrepancy}
            className="inline-flex items-center justify-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Resolve Difference</span>
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              All math perfectly balanced! Line items + configured fees match the Grand Total of{' '}
              <strong className="font-mono">{formatCurrency(calculation.targetGrandTotal, currency)}</strong>.
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-700 uppercase bg-emerald-100/80 px-2 py-0.5 rounded self-start sm:self-auto">
            Balanced
          </span>
        </div>
      )}

      {/* Mobile Segmented Toggle (when receipt image exists) */}
      {receiptImage && (
        <div className="flex lg:hidden items-center p-1 bg-[#F3ECE1] rounded-xl border border-[#E5DDCF]">
          <button
            type="button"
            onClick={() => setMobileTab('items')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${mobileTab === 'items'
                ? 'bg-white text-[#1C1917] shadow-xs'
                : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Items Ledger ({items.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('slip')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${mobileTab === 'slip'
                ? 'bg-white text-[#1C1917] shadow-xs'
                : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Receipt Photo</span>
          </button>
        </div>
      )}

      {/* Main Split Layout: Receipt Image Viewer & Items Ledger */}
      <div className={`grid grid-cols-1 ${showImagePane && receiptImage ? 'lg:grid-cols-12' : 'lg:grid-cols-1'} gap-6 items-start`}>
        {/* Left Side: Receipt Pan / Zoom Loupe */}
        {showImagePane && receiptImage && (
          <div className={`${mobileTab === 'slip' ? 'block' : 'hidden'} lg:block lg:col-span-5`}>
            <ReceiptLoupe receiptImage={receiptImage} />
          </div>
        )}

        {/* Right Side: Inline Editing Table & Fee Manager */}
        <div className={`${mobileTab === 'items' ? 'block' : 'hidden'} lg:block ${showImagePane && receiptImage ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-6`}>
          {/* Items Table Container */}
          <div className="bg-white rounded-2xl border border-[#E5DDCF] shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#FAF7F2] border-b border-[#E5DDCF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#1C1917] uppercase tracking-wider">
                  Line Items ({items.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditorRawText(rawOcrText || '');
                    setShowTextModal(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#57534E] hover:text-[#1C1917] bg-white border border-[#D9CDB8] hover:bg-[#FAF7F2] px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  title="Paste or re-parse text"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Paste / Edit Raw Text</span>
                  <span className="sm:hidden">Raw Text</span>
                </button>

                <button
                  onClick={() => addItem()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1C1917] bg-white border border-[#D9CDB8] hover:bg-[#FAF7F2] px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>

            {/* Table or Empty State */}
            {items.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-sm text-[#78716C]">No line items found.</p>
                <button
                  onClick={() => addItem()}
                  className="inline-flex items-center gap-2 bg-[#1C1917] text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Item</span>
                </button>
              </div>
            ) : (
              <>
                {/* Mobile Thermal Card Stack (< md) */}
                <div className="block md:hidden divide-y divide-[#F3ECE1]">
                  {items.map((item, idx) => (
                    <div key={item.id} className="p-3.5 space-y-2.5 hover:bg-[#FAF7F2]/50 transition-colors">
                      {/* Row 1: Full-width item description & Quick actions */}
                      <div className="flex items-start justify-between gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, { name: e.target.value })}
                          className="flex-1 bg-[#FAF7F2] border border-[#E5DDCF] focus:border-[#1C1917] focus:bg-white rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[#1C1917] outline-none"
                          placeholder="Item description"
                          aria-label={`Description for item ${idx + 1}`}
                        />
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={() => duplicateItem(item.id)}
                            aria-label={`Duplicate ${item.name || 'item'}`}
                            className="w-8 h-8 flex items-center justify-center text-[#78716C] hover:text-[#1C1917] bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#E5DDCF] rounded-lg cursor-pointer transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            aria-label={`Delete ${item.name || 'item'}`}
                            className="w-8 h-8 flex items-center justify-center text-[#78716C] hover:text-[#C53030] bg-[#FAF7F2] hover:bg-red-50 border border-[#E5DDCF] hover:border-red-200 rounded-lg cursor-pointer transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Qty Stepper, Unit Price, and Line Total */}
                      <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                        {/* Stepper for Qty */}
                        <div className="flex items-center border border-[#D9CDB8] rounded-lg bg-[#FAF7F2] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { qty: Math.max(1, item.qty - 1) })}
                            aria-label="Decrease quantity"
                            className="w-7 h-7 flex items-center justify-center text-[#57534E] hover:bg-[#F3ECE1] font-bold text-xs cursor-pointer select-none"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.qty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              updateItem(item.id, { qty: isNaN(val) ? 1 : val });
                            }}
                            className="w-8 text-center bg-transparent font-mono font-bold text-xs text-[#1C1917] outline-none"
                            aria-label="Quantity"
                          />
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { qty: item.qty + 1 })}
                            aria-label="Increase quantity"
                            className="w-7 h-7 flex items-center justify-center text-[#57534E] hover:bg-[#F3ECE1] font-bold text-xs cursor-pointer select-none"
                          >
                            +
                          </button>
                        </div>

                        {/* Unit Price */}
                        <div className="flex items-center gap-1 bg-[#FAF7F2] border border-[#D9CDB8] rounded-lg px-2 py-1">
                          <span className="text-[#A8A29E] font-mono text-xs">{currency}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              updateItem(item.id, { unitPrice: isNaN(val) ? 0 : val });
                            }}
                            className="w-16 text-right bg-transparent font-mono font-medium text-xs text-[#1C1917] tabular-numbers outline-none"
                            placeholder="0.00"
                            aria-label="Unit price"
                          />
                        </div>

                        {/* Line Total */}
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-[#78716C] text-xs">Total:</span>
                          <span className="font-bold text-sm text-[#1C1917] tabular-numbers">
                            {formatCurrency(item.totalPrice, currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop High-Density Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5DDCF] bg-[#FAF7F2]/60 text-[#78716C] font-mono text-xs">
                        <th className="py-2.5 px-3 font-semibold">ITEM DESCRIPTION</th>
                        <th className="py-2.5 px-2 font-semibold w-16 text-center">QTY</th>
                        <th className="py-2.5 px-2 font-semibold w-24 text-right">UNIT PRICE</th>
                        <th className="py-2.5 px-3 font-semibold w-28 text-right">LINE TOTAL</th>
                        <th className="py-2.5 px-2 font-semibold w-16 text-center">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3ECE1]">
                      {items.map((item, idx) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#FAF7F2]/80 transition-colors group"
                        >
                          {/* Name Input */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, { name: e.target.value })}
                              className="w-full bg-transparent border border-transparent hover:border-[#E5DDCF] focus:border-[#1C1917] focus:bg-white rounded px-2 py-1 text-xs font-medium text-[#1C1917] outline-none"
                              placeholder="Item name"
                            />
                          </td>

                          {/* Qty Input */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.qty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                updateItem(item.id, { qty: isNaN(val) ? 1 : val });
                              }}
                              className="w-14 text-center bg-transparent border border-transparent hover:border-[#E5DDCF] focus:border-[#1C1917] focus:bg-white rounded px-1 py-1 text-xs font-mono font-medium text-[#1C1917] outline-none"
                            />
                          </td>

                          {/* Unit Price */}
                          <td className="py-2 px-2 text-right">
                            <div className="relative inline-flex items-center">
                              <span className="text-[#A8A29E] font-mono text-xs mr-0.5">
                                {currency}
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  updateItem(item.id, { unitPrice: isNaN(val) ? 0 : val });
                                }}
                                className="w-18 text-right bg-transparent border border-transparent hover:border-[#E5DDCF] focus:border-[#1C1917] focus:bg-white rounded px-1 py-1 text-xs font-mono font-medium text-[#1C1917] outline-none tabular-numbers"
                              />
                            </div>
                          </td>

                          {/* Line Total */}
                          <td className="py-2 px-3 text-right">
                            <div className="relative inline-flex items-center justify-end">
                              <span className="text-[#78716C] font-mono text-xs mr-0.5">
                                {currency}
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.totalPrice}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  updateItem(item.id, {
                                    totalPrice: isNaN(val) ? 0 : val,
                                  });
                                }}
                                className="w-20 text-right bg-transparent border border-transparent hover:border-[#E5DDCF] focus:border-[#1C1917] focus:bg-white rounded px-1 py-1 text-xs font-mono font-bold text-[#1C1917] outline-none tabular-numbers"
                              />
                            </div>
                          </td>

                          {/* Actions: Duplicate & Delete */}
                          <td className="py-2 px-2 text-center">
                            <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => duplicateItem(item.id)}
                                aria-label={`Duplicate item ${item.name || idx + 1}`}
                                className="w-7 h-7 flex items-center justify-center hover:text-[#1C1917] text-[#78716C] rounded hover:bg-white cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1C1917]"
                                title="Duplicate row"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                aria-label={`Delete item ${item.name || idx + 1}`}
                                className="w-7 h-7 flex items-center justify-center hover:text-[#C53030] text-[#78716C] rounded hover:bg-white cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C53030]"
                                title="Delete row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Subtotal footer bar */}
            <div className="px-4 py-2.5 bg-[#FAF7F2] border-t border-[#E5DDCF] flex items-center justify-between text-xs font-mono">
              <span className="text-[#78716C] font-semibold">BASE ITEMS SUBTOTAL</span>
              <span className="font-bold text-[#1C1917] text-sm tabular-numbers">
                {formatCurrency(calculation.itemsSubtotal, currency)}
              </span>
            </div>
          </div>

          {/* Tax, Service Charge & Extra Fees Panel */}
          <div className="bg-white rounded-2xl border border-[#E5DDCF] shadow-xs overflow-hidden space-y-3 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F3ECE1]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#78716C]" />
                <h3 className="text-xs font-mono font-bold text-[#1C1917] uppercase tracking-wider">
                  Extra Fees, Tax &amp; Discounts ({fees.length})
                </h3>
              </div>

              <button
                onClick={() => addFee()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1C1917] bg-white border border-[#D9CDB8] hover:bg-[#FAF7F2] px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Fee</span>
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div className="space-y-1.5 pb-1">
              <span className="text-xs font-mono text-[#78716C] uppercase font-semibold">
                Quick Presets:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {FEE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      addFee({
                        name: preset.name,
                        type: preset.type,
                        value: preset.value,
                        appliesTo: preset.appliesTo,
                        isDiscount: preset.isDiscount,
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#D9CDB8] bg-[#FAF7F2] hover:bg-[#F3ECE1] hover:border-[#1C1917] text-xs font-medium text-[#1C1917] transition-all cursor-pointer active:scale-95 shadow-2xs"
                    title={`Add ${preset.name} (${preset.type === 'percent' ? `${preset.value}%` : `${currency} ${preset.value}`})`}
                  >
                    <Plus className="w-3 h-3 text-[#78716C]" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {fees.length === 0 ? (
              <p className="text-xs text-[#78716C] py-2">
                No taxes or extra fees configured yet. Tap a preset above or click &ldquo;Add Fee&rdquo; to add custom rates.
              </p>
            ) : (
              <div className="space-y-2.5">
                {fees.map((fee) => (
                  <div
                    key={fee.id}
                    className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DDCF] text-xs space-y-2.5"
                  >
                    {/* Row 1: Full-width Fee Name + Computed Preview + Delete */}
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={fee.name}
                        onChange={(e) => updateFee(fee.id, { name: e.target.value })}
                        className="flex-1 min-w-0 bg-white border border-[#D9CDB8] rounded-md px-2.5 py-1 text-xs font-medium text-[#1C1917] outline-none focus:border-[#1C1917]"
                        placeholder="Fee Name (e.g. Service Charge)"
                      />

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Computed preview */}
                        <div className="text-right font-mono font-bold text-xs min-w-16">
                          {(() => {
                            const cf = calculation.computedFees.find((c) => c.fee.id === fee.id);
                            const amt = cf ? cf.computedAmount : 0;
                            return (
                              <span className={fee.isDiscount ? 'text-[#C53030]' : 'text-[#1C1917]'}>
                                {fee.isDiscount ? '-' : '+'}
                                {formatCurrency(amt, currency)}
                              </span>
                            );
                          })()}
                        </div>

                        {/* Delete fee button */}
                        <button
                          type="button"
                          onClick={() => deleteFee(fee.id)}
                          aria-label={`Remove fee ${fee.name || 'unnamed'}`}
                          className="w-7 h-7 flex items-center justify-center text-[#78716C] hover:text-[#C53030] hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Remove fee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Rate Type (% vs $), Value Input, Compounding Select, Discount Checkbox */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5DDCF]/60">
                      {/* Rate Type (% vs $) */}
                      <div className="inline-flex rounded-md border border-[#D9CDB8] overflow-hidden bg-white shrink-0">
                        <button
                          type="button"
                          onClick={() => updateFee(fee.id, { type: 'percent' })}
                          aria-label="Calculate as percentage rate"
                          className={`px-2.5 py-1 text-xs font-mono font-semibold transition-colors cursor-pointer ${fee.type === 'percent'
                              ? 'bg-[#1C1917] text-white'
                              : 'text-[#78716C] hover:bg-[#F3ECE1]'
                            }`}
                          title="Percentage rate"
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => updateFee(fee.id, { type: 'fixed' })}
                          aria-label="Calculate as fixed amount"
                          className={`px-2.5 py-1 text-xs font-mono font-semibold transition-colors cursor-pointer ${fee.type === 'fixed'
                              ? 'bg-[#1C1917] text-white'
                              : 'text-[#78716C] hover:bg-[#F3ECE1]'
                            }`}
                          title="Fixed amount"
                        >
                          {currency}
                        </button>
                      </div>

                      {/* Value Input */}
                      <div className="w-18 shrink-0">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={fee.value}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            updateFee(fee.id, { value: isNaN(val) ? 0 : val });
                          }}
                          aria-label={`Fee value for ${fee.name || 'unnamed'}`}
                          className="w-full bg-white border border-[#D9CDB8] rounded-md px-2 py-1 text-xs font-mono font-bold text-right tabular-numbers outline-none focus:border-[#1C1917]"
                        />
                      </div>

                      {/* Compounding Toggle (Subtotal vs Subtotal+SVC) */}
                      <div className="relative inline-flex items-center shrink-0">
                        <select
                          value={fee.appliesTo}
                          onChange={(e) =>
                            updateFee(fee.id, {
                              appliesTo: e.target.value as 'subtotal' | 'subtotal_plus_service',
                            })
                          }
                          aria-label="Compound calculation base"
                          className="appearance-none bg-white border border-[#D9CDB8] rounded-md pl-2 pr-6 py-1 text-xs text-[#57534E] font-medium hover:border-[#A89F8F] focus:outline-none focus:ring-1 focus:ring-[#1C1917] cursor-pointer"
                        >
                          <option value="subtotal">On Subtotal</option>
                          <option value="subtotal_plus_service">On Subtotal + Svc</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-[#78716C] absolute right-1.5 pointer-events-none" />
                      </div>

                      {/* Discount check */}
                      <label className="flex items-center gap-1.5 text-xs text-[#57534E] cursor-pointer shrink-0 select-none ml-auto sm:ml-0">
                        <input
                          type="checkbox"
                          checked={fee.isDiscount || false}
                          onChange={(e) => updateFee(fee.id, { isDiscount: e.target.checked })}
                          className="rounded border-[#D9CDB8] text-[#C53030] focus:ring-[#C53030]"
                        />
                        <span>Discount</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grand Total Comparison Box */}
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E5DDCF] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-[#78716C] font-semibold">
                Printed Receipt Grand Total
              </span>
              <p className="text-xs text-[#78716C]">
                Bottom-line figure printed on the original receipt slip
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-[#78716C] font-bold">{currency}</span>
              <input
                type="number"
                step="0.01"
                value={targetGrandTotal !== null ? targetGrandTotal : calculation.calculatedGrandTotal}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTargetGrandTotal(isNaN(val) ? null : val);
                }}
                className="w-32 bg-white border border-[#D9CDB8] rounded-xl px-3 py-1.5 text-base font-mono font-bold text-[#1C1917] text-right focus:border-[#1C1917] outline-none tabular-numbers shadow-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Raw Text Editor / Paste Modal */}
      {showTextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E5DDCF] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-[#E5DDCF] flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h3 className="text-base font-bold text-[#1C1917] font-serif">
                  Paste or Edit Raw Receipt Lines
                </h3>
                <p className="text-xs text-[#78716C]">
                  Edit line text or paste lines from SMS, paper, or e-receipt.
                </p>
              </div>
              <button
                onClick={() => setShowTextModal(false)}
                className="text-[#78716C] hover:text-[#1C1917] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <textarea
                value={editorRawText}
                onChange={(e) => setEditorRawText(e.target.value)}
                rows={10}
                placeholder="Ebiten Ebikko Maki 1 RM9.25&#10;Chicken Katsu Curry 1 RM25.28&#10;Sub-Total RM79.25&#10;6% Gov Service Tax RM4.76&#10;Total after Rounding RM84.00"
                className="w-full bg-[#FAF7F2] border border-[#D9CDB8] rounded-xl p-3 text-xs font-mono text-[#1C1917] focus:bg-white focus:border-[#1C1917] outline-none leading-relaxed"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTextModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#D9CDB8] text-xs font-medium text-[#57534E] hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!editorRawText.trim()) return;
                    setRawOcrText(editorRawText);
                    const parsed = parseReceiptText(editorRawText);
                    if (parsed.items.length > 0) {
                      setItems(parsed.items);
                    }
                    if (parsed.fees.length > 0) {
                      setFees(parsed.fees);
                    }
                    if (parsed.grandTotal) {
                      setTargetGrandTotal(parsed.grandTotal);
                    } else if (parsed.subtotal) {
                      setTargetGrandTotal(parsed.subtotal);
                    }
                    setShowTextModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1C1917] text-white text-xs font-semibold hover:bg-[#332E2B] cursor-pointer shadow-xs"
                >
                  Re-parse into Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
