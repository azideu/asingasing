'use client';

import React, { useState, useRef } from 'react';
import { useReceipt } from '@/context/ReceiptContext';
import { preprocessImage, parseReceiptText, PreprocessOptions } from '@/lib/ocr';
import { formatCurrency } from '@/lib/calculator';
import {
  UploadCloud,
  Camera,
  Sliders,
  Loader2,
  Image as ImageIcon,
  Zap,
  FileText,
  X,
  ClipboardPaste,
} from 'lucide-react';

export function ReceiptCapture() {
  const {
    setReceiptImage,
    setRawOcrText,
    setItems,
    setFees,
    setTargetGrandTotal,
    setStep,
    receiptImage,
    currency,
  } = useReceipt();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [rawImageSrc, setRawImageSrc] = useState<string | null>(receiptImage);
  const [processedImageSrc, setProcessedImageSrc] = useState<string | null>(null);

  // Preprocessing controls (default to gentle enhancement so thermal ink isn't destroyed)
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [contrast, setContrast] = useState<number>(15);
  const [useThreshold, setUseThreshold] = useState<boolean>(false);
  const [threshold, setThreshold] = useState<number>(140);
  const [showPreprocessControls, setShowPreprocessControls] = useState<boolean>(false);

  // Paste text modal state
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>('');

  // OCR state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrStage, setOcrStage] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const src = event.target?.result as string;
      setRawImageSrc(src);
      setReceiptImage(src);
      applyPreprocessing(src, {
        grayscale,
        contrast,
        threshold: useThreshold ? threshold : undefined,
        autoScale: true,
      });
    };
    reader.readAsDataURL(file);
  };

  const applyPreprocessing = async (src: string, options: PreprocessOptions) => {
    try {
      const result = await preprocessImage(src, options);
      setProcessedImageSrc(result.dataUrl);
    } catch (err) {
      console.error('Preprocessing error:', err);
    }
  };

  const handleControlChange = (
    newGrayscale: boolean,
    newContrast: number,
    newUseThreshold: boolean,
    newThreshold: number
  ) => {
    setGrayscale(newGrayscale);
    setContrast(newContrast);
    setUseThreshold(newUseThreshold);
    setThreshold(newThreshold);
    if (rawImageSrc) {
      applyPreprocessing(rawImageSrc, {
        grayscale: newGrayscale,
        contrast: newContrast,
        threshold: newUseThreshold ? newThreshold : undefined,
        autoScale: true,
      });
    }
  };

  // Run Tesseract OCR with column segmentation
  const handleStartOCR = async () => {
    const targetImage = processedImageSrc || rawImageSrc;
    if (!targetImage) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setOcrProgress(5);
    setOcrStage('Initializing OCR engine...');

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const p = Math.round((m.progress || 0) * 85);
            setOcrProgress(15 + p);
            setOcrStage(`Scanning thermal receipt text (${p}%)...`);
          } else if (m.status === 'loading tesseract core') {
            setOcrProgress(10);
            setOcrStage('Loading OCR core...');
          } else if (m.status === 'initializing api') {
            setOcrProgress(15);
            setOcrStage('Calibrating character recognition...');
          }
        },
      });

      // Crucial: Set single-column layout mode & preserve spaces for receipt tables
      await worker.setParameters({
        tessedit_pageseg_mode: 4 as any, // PSM 4: single column of variable sizes
        preserve_interword_spaces: '1',
      });

      setOcrStage('Running character extraction...');
      const ret = await worker.recognize(targetImage);
      await worker.terminate();

      const text = ret.data.text;
      setRawOcrText(text);

      setOcrStage('Parsing line items and extra fees...');
      setOcrProgress(95);

      const parsed = parseReceiptText(text);

      if (parsed.items.length === 0) {
        setErrorMsg(
          "We transcribed the text, but couldn't detect clear price line items. You can paste the receipt text directly, or edit the table manually."
        );
        setManualText(text);
        setItems([
          {
            id: `item-${Date.now()}`,
            name: 'Sample Item',
            qty: 1,
            unitPrice: 10.0,
            totalPrice: 10.0,
            assignedTo: [],
          },
        ]);
      } else {
        setItems(parsed.items);
      }

      setFees(parsed.fees);
      if (parsed.grandTotal) {
        setTargetGrandTotal(parsed.grandTotal);
      } else if (parsed.subtotal) {
        setTargetGrandTotal(parsed.subtotal);
      }

      setOcrProgress(100);
      setOcrStage('Completed! Moving to review table...');

      setTimeout(() => {
        setIsProcessing(false);
        setStep(2); // advance to Review & Edit
      }, 600);
    } catch (err: unknown) {
      console.error('OCR Error:', err);
      setIsProcessing(false);
      setErrorMsg(
        'Failed to run OCR on this image. You can try a clearer photo or paste the text directly.'
      );
    }
  };

  // Handle direct text paste
  const handleParseManualText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualText.trim()) return;

    setRawOcrText(manualText);
    const parsed = parseReceiptText(manualText);

    if (parsed.items.length > 0) {
      setItems(parsed.items);
    } else {
      setItems([
        {
          id: `item-${Date.now()}`,
          name: 'Manual Item',
          qty: 1,
          unitPrice: 10.0,
          totalPrice: 10.0,
          assignedTo: [],
        },
      ]);
    }

    setFees(parsed.fees);
    if (parsed.grandTotal) {
      setTargetGrandTotal(parsed.grandTotal);
    } else if (parsed.subtotal) {
      setTargetGrandTotal(parsed.subtotal);
    }

    setShowPasteModal(false);
    setStep(2);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Introduction Banner */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1917] font-serif">
          Capture &amp; Parse Receipt
        </h2>
        <p className="text-sm text-[#78716C] max-w-md mx-auto">
          Snap a photo or upload an image. Our client-side OCR transcribes items,
          quantities, taxes, and service charges with zero server upload.
        </p>
      </div>

      {/* Main Upload Box */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-[#D9CDB8] hover:border-[#A89F8F] transition-all p-6 sm:p-8 shadow-xs">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {!rawImageSrc ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#E5DDCF] flex items-center justify-center text-[#1C1917]">
              <UploadCloud className="w-8 h-8 stroke-[1.5]" />
            </div>

            <div className="space-y-1">
              <p className="text-base font-semibold text-[#1C1917]">
                Drop your receipt image here, or browse
              </p>
              <p className="text-xs text-[#78716C]">
                Supports JPEG, PNG, or WEBP from phone camera
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-[#1C1917] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#332E2B] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-white border border-[#D9CDB8] text-[#1C1917] px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#FAF7F2] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                className="inline-flex items-center gap-2 bg-[#FAF7F2] border border-[#D9CDB8] text-[#57534E] hover:text-[#1C1917] px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#F3ECE1] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <ClipboardPaste className="w-4 h-4" />
                Paste Text
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Preview & Pre-processing Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-[#78716C]">
                  <span>Receipt Preview</span>
                  <button
                    onClick={() => {
                      setRawImageSrc(null);
                      setProcessedImageSrc(null);
                    }}
                    className="text-[#C53030] hover:underline cursor-pointer"
                  >
                    Remove &amp; Retake
                  </button>
                </div>
                <div className="relative aspect-3/4 max-h-80 w-full bg-[#FAF7F2] rounded-xl overflow-hidden border border-[#E5DDCF] flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={processedImageSrc || rawImageSrc}
                    alt="Receipt target"
                    className="max-h-full object-contain rounded"
                  />
                </div>
              </div>

              {/* Preprocessing Toolbar */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#1C1917] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#78716C]" />
                    Optical Tuning
                  </h4>
                  <button
                    onClick={() =>
                      setShowPreprocessControls(!showPreprocessControls)
                    }
                    className="text-xs text-[#1C1917] font-medium underline cursor-pointer"
                  >
                    {showPreprocessControls ? 'Hide Controls' : 'Fine Tune'}
                  </button>
                </div>

                <p className="text-xs text-[#78716C]">
                  Optimized for receipts: high-DPI scaling and column segmentation automatically extract items and Malaysian taxes (SST/Gov Service Tax).
                </p>

                {showPreprocessControls && (
                  <div className="space-y-3 bg-[#FAF7F2] p-4 rounded-xl border border-[#E5DDCF] text-xs">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-medium text-[#1C1917]">Grayscale Filter</span>
                      <input
                        type="checkbox"
                        checked={grayscale}
                        onChange={(e) =>
                          handleControlChange(
                            e.target.checked,
                            contrast,
                            useThreshold,
                            threshold
                          )
                        }
                        className="rounded border-[#D9CDB8] text-[#1C1917] focus:ring-[#1C1917]"
                      />
                    </label>

                    <div className="space-y-1">
                      <div className="flex justify-between font-medium text-[#1C1917]">
                        <span>Contrast Boost</span>
                        <span className="font-mono text-[#78716C]">+{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        value={contrast}
                        onChange={(e) =>
                          handleControlChange(
                            grayscale,
                            parseInt(e.target.value, 10),
                            useThreshold,
                            threshold
                          )
                        }
                        className="w-full accent-[#1C1917]"
                      />
                    </div>

                    <div className="space-y-2 pt-1 border-t border-[#E5DDCF]">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="font-medium text-[#1C1917]">
                          Thermal Ink Binarization
                        </span>
                        <input
                          type="checkbox"
                          checked={useThreshold}
                          onChange={(e) =>
                            handleControlChange(
                              grayscale,
                              contrast,
                              e.target.checked,
                              threshold
                            )
                          }
                          className="rounded border-[#D9CDB8] text-[#1C1917] focus:ring-[#1C1917]"
                        />
                      </label>
                      {useThreshold && (
                        <input
                          type="range"
                          min="80"
                          max="200"
                          value={threshold}
                          onChange={(e) =>
                            handleControlChange(
                              grayscale,
                              contrast,
                              useThreshold,
                              parseInt(e.target.value, 10)
                            )
                          }
                          className="w-full accent-[#1C1917]"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleStartOCR}
                    disabled={isProcessing}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#1C1917] text-white py-3 px-4 rounded-xl text-sm font-semibold hover:bg-[#332E2B] active:scale-98 transition-all disabled:opacity-60 cursor-pointer shadow-sm"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Transcribing Receipt...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>Run OCR &amp; Extract Items</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPasteModal(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917] hover:underline cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Or Paste / Edit Receipt Text Manually</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Progress / Status feedback */}
            {isProcessing && (
              <div className="space-y-2 bg-[#FAF7F2] p-4 rounded-xl border border-[#E5DDCF]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#1C1917] font-medium flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1C1917]" />
                    {ocrStage}
                  </span>
                  <span className="text-[#78716C]">{ocrProgress}%</span>
                </div>
                <div className="w-full bg-[#E5DDCF] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1C1917] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">Notice:</span>
                  <div>{errorMsg}</div>
                </div>
                <button
                  onClick={() => setShowPasteModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 underline cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Text Editor / Paste Receipt Lines</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paste / Manual Text Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E5DDCF] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-[#E5DDCF] flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h3 className="text-base font-bold text-[#1C1917] font-serif">
                  Paste or Edit Receipt Text
                </h3>
                <p className="text-xs text-[#78716C]">
                  Paste text lines from SMS, e-receipt, or WhatsApp. We will parse quantities, items, and taxes automatically.
                </p>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-[#78716C] hover:text-[#1C1917] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Paste receipt lines here..."
                rows={10}
                className="w-full bg-[#FAF7F2] border border-[#D9CDB8] rounded-xl p-3 text-xs font-mono text-[#1C1917] placeholder:text-[#A8A29E] focus:bg-white focus:border-[#1C1917] outline-none leading-relaxed"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#D9CDB8] text-xs font-medium text-[#57534E] hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParseManualText}
                  className="px-4 py-2 rounded-xl bg-[#1C1917] text-white text-xs font-semibold hover:bg-[#332E2B] cursor-pointer shadow-xs"
                >
                  Parse Lines into Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
