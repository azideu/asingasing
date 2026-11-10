'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useReceipt } from '@/context/ReceiptContext';
import { preprocessImage, parseReceiptText, PreprocessOptions } from '@/lib/ocr';
import {
  UploadCloud,
  Camera,
  Sliders,
  Loader2,
  Image as ImageIcon,
  Zap,
  Sparkles,
  FileText,
  X,
  ClipboardPaste,
  KeyRound,
  ShieldCheck,
  Cpu,
  ChevronDown,
} from 'lucide-react';

const GEMINI_LOCAL_KEY = 'asingasing_gemini_key';

export function ReceiptCapture() {
  const {
    setReceiptImage,
    setRawOcrText,
    setItems,
    setFees,
    setTargetGrandTotal,
    setStep,
    receiptImage,
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
  const [showOfflineOptions, setShowOfflineOptions] = useState<boolean>(false);

  // Modals state
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>('');

  // Hydrate custom API key from localStorage after mount to prevent SSR hydration mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GEMINI_LOCAL_KEY) || localStorage.getItem('betsubetsu_gemini_key') || '';
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCustomApiKey(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMode, setProcessingMode] = useState<'ai' | 'ocr' | null>(null);
  const [ocrStage, setOcrStage] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveApiKey = (keyToSave: string) => {
    const trimmed = keyToSave.trim();
    setCustomApiKey(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem(GEMINI_LOCAL_KEY, trimmed);
      } else {
        localStorage.removeItem(GEMINI_LOCAL_KEY);
      }
    } catch {
      // ignore
    }
    setShowKeyModal(false);
  };

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

  // Run AI Vision parser via Gemini
  const handleStartAI = async () => {
    const targetImage = rawImageSrc || processedImageSrc;
    if (!targetImage) return;

    setIsProcessing(true);
    setProcessingMode('ai');
    setErrorMsg(null);
    setOcrProgress(25);
    setOcrStage('Sending photo to Gemini Vision AI...');

    try {
      const interval = setInterval(() => {
        setOcrProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 500);

      const res = await fetch('/api/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: targetImage,
          apiKey: customApiKey || undefined,
        }),
      });

      clearInterval(interval);
      setOcrProgress(90);
      setOcrStage('Parsing structured items & taxes...');

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze receipt with AI.');
      }

      if (!data.items || data.items.length === 0) {
        throw new Error('No items detected in receipt. You can verify the image or try local OCR.');
      }

      setRawOcrText(data.rawOcrText || '');
      setItems(data.items);
      setFees(data.fees || []);

      if (data.grandTotal) {
        setTargetGrandTotal(data.grandTotal);
      } else if (data.subtotal) {
        setTargetGrandTotal(data.subtotal);
      }

      setOcrProgress(100);
      setOcrStage('Completed! Moving to review table...');

      setTimeout(() => {
        setIsProcessing(false);
        setStep(2); // advance to Review & Edit
      }, 400);
    } catch (err: unknown) {
      console.error('AI Scan Error:', err);
      setIsProcessing(false);
      setProcessingMode(null);
      const msg = err instanceof Error ? err.message : 'Failed to scan receipt with AI.';
      setErrorMsg(msg);
    }
  };

  // Run Tesseract OCR as fallback
  const handleStartOCR = async () => {
    const targetImage = processedImageSrc || rawImageSrc;
    if (!targetImage) return;

    setIsProcessing(true);
    setProcessingMode('ocr');
    setErrorMsg(null);
    setOcrProgress(5);
    setOcrStage('Initializing local OCR engine...');

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

      // PSM 4: single column of variable sizes
      await worker.setParameters({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tessedit_pageseg_mode: 4 as any,
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
          "We transcribed the text, but couldn't detect clear price line items. You can paste the receipt text directly, or try AI Smart Scan."
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
      }, 500);
    } catch (err: unknown) {
      console.error('OCR Error:', err);
      setIsProcessing(false);
      setProcessingMode(null);
      setErrorMsg(
        'Failed to run local OCR on this image. You can try AI Smart Scan or paste text directly.'
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
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5EFE6] font-serif">
          Capture &amp; Parse Receipt
        </h2>
        <p className="text-sm text-[#A89F91] max-w-md mx-auto">
          Snap a photo or upload an image. Gemini Vision extracts items,
          quantities, taxes, and service charges in seconds.
        </p>
      </div>

      {/* Main Upload Box */}
      <div className="bg-[#1C1A17] rounded-2xl border-2 border-dashed border-[#3D372F] hover:border-[#7D7569] transition-all p-6 sm:p-8 shadow-xs">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          aria-label="Upload receipt image file"
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          aria-label="Capture receipt with camera"
          className="hidden"
        />

        {!rawImageSrc ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
            <div className="w-16 h-16 rounded-full bg-[#171513] border border-[#2E2A24] flex items-center justify-center text-[#F5EFE6]">
              <UploadCloud className="w-8 h-8 stroke-[1.5]" />
            </div>

            <div className="space-y-1">
              <p className="text-base font-semibold text-[#F5EFE6]">
                Drop your receipt image here, or browse
              </p>
              <p className="text-xs text-[#7D7569]">
                Supports JPEG, PNG, or WEBP from phone camera
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-[#F5EFE6] text-[#121110] px-5 py-3 min-h-[44px] rounded-xl text-xs font-semibold hover:bg-[#E6DDD0] active:scale-95 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5EFE6]"
              >
                <ImageIcon className="w-4 h-4" />
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-[#1C1A17] border border-[#3D372F] text-[#F5EFE6] px-5 py-3 min-h-[44px] rounded-xl text-xs font-semibold hover:bg-[#26231F] active:scale-95 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5EFE6]"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                className="inline-flex items-center gap-2 bg-[#171513] border border-[#2E2A24] text-[#A89F91] hover:text-[#F5EFE6] px-4 py-3 min-h-[44px] rounded-xl text-xs font-semibold hover:bg-[#26231F] active:scale-95 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5EFE6]"
              >
                <ClipboardPaste className="w-4 h-4" />
                Paste Text
              </button>
            </div>

            {/* Custom Gemini API Key trigger button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className="inline-flex items-center gap-1.5 text-xs text-[#7D7569] hover:text-[#F5EFE6] bg-[#171513] hover:bg-[#26231F] border border-[#2E2A24] px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#A89F91]" />
                <span>
                  Gemini API Key:{' '}
                  <strong suppressHydrationWarning className="text-[#F5EFE6]">
                    {customApiKey ? 'Custom key active' : 'Server default'}
                  </strong>
                </span>
                <span className="text-xs text-[#A89F91] font-medium underline ml-1">Configure</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Preview & Pre-processing Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-[#7D7569]">
                  <span>Receipt Preview</span>
                  <button
                    onClick={() => {
                      setRawImageSrc(null);
                      setProcessedImageSrc(null);
                    }}
                    className="text-[#E05353] hover:underline cursor-pointer"
                  >
                    Remove &amp; Retake
                  </button>
                </div>
                <div className="relative aspect-3/4 max-h-80 w-full bg-[#171513] rounded-xl overflow-hidden border border-[#2E2A24] flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={processedImageSrc || rawImageSrc}
                    alt="Receipt target"
                    className="max-h-full object-contain rounded"
                  />
                </div>
              </div>

              {/* Processing & Mode Selection */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#D4A373] bg-[#2E2419] border border-[#D4A373]/30 px-2 py-0.5 rounded">
                      <Sparkles className="w-3 h-3 text-[#D4A373]" />
                      Recommended
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowKeyModal(true)}
                      className="inline-flex items-center gap-1 text-xs text-[#A89F91] hover:text-[#F5EFE6] hover:underline cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span suppressHydrationWarning>
                        {customApiKey ? 'Custom key active' : 'API Key Settings'}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-[#A89F91] leading-relaxed pt-1">
                    Best for wrinkled receipts, dim lighting, and automatic tax breakdowns.
                  </p>
                </div>

                {/* Primary Action Button: Gemini Vision */}
                <button
                  onClick={handleStartAI}
                  disabled={isProcessing}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#F5EFE6] text-[#121110] py-3.5 px-4 rounded-xl text-sm font-semibold hover:bg-[#E6DDD0] active:scale-98 transition-all disabled:opacity-60 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5EFE6]"
                >
                  {isProcessing && processingMode === 'ai' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scanning receipt...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#8C6D3F] fill-[#8C6D3F]" />
                      <span>Scan with AI</span>
                    </>
                  )}
                </button>

                {/* Progressive Disclosure: Offline OCR & Manual Options */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowOfflineOptions(!showOfflineOptions)}
                    className="w-full flex items-center justify-between text-xs text-[#A89F91] hover:text-[#F5EFE6] bg-[#171513] hover:bg-[#26231F] border border-[#2E2A24] px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <span className="font-medium flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-[#A89F91]" />
                      Offline OCR &amp; Manual Options
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#A89F91] transition-transform ${showOfflineOptions ? 'rotate-180' : ''}`} />
                  </button>

                  {showOfflineOptions && (
                    <div className="mt-2.5 space-y-3 p-3.5 bg-[#171513] rounded-xl border border-[#2E2A24] text-xs animate-fadeIn">
                      <div className="flex flex-col sm:flex-row items-stretch gap-2">
                        <button
                          type="button"
                          onClick={handleStartOCR}
                          disabled={isProcessing}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#1C1A17] border border-[#3D372F] hover:border-[#F5EFE6] text-[#F5EFE6] py-2.5 px-3 rounded-lg font-medium cursor-pointer shadow-2xs transition-colors"
                        >
                          {isProcessing && processingMode === 'ocr' ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Running OCR...</span>
                            </>
                          ) : (
                            <>
                              <Cpu className="w-3.5 h-3.5 text-[#A89F91]" />
                              <span>Run Local OCR (Offline)</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPasteModal(true)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#1C1A17] border border-[#3D372F] hover:border-[#F5EFE6] text-[#F5EFE6] py-2.5 px-3 rounded-lg font-medium cursor-pointer shadow-2xs transition-colors"
                        >
                          <ClipboardPaste className="w-3.5 h-3.5 text-[#A89F91]" />
                          <span>Paste Text Lines</span>
                        </button>
                      </div>

                      {/* Image Contrast & Preprocessing Controls */}
                      <div className="pt-2 border-t border-[#2E2A24] space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#F5EFE6]">
                          <span>Image Tuning (For faint paper prints)</span>
                          <button
                            type="button"
                            onClick={() => setShowPreprocessControls(!showPreprocessControls)}
                            className="text-[#A89F91] hover:underline flex items-center gap-1"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            {showPreprocessControls ? 'Hide Sliders' : 'Adjust'}
                          </button>
                        </div>

                        {showPreprocessControls && (
                          <div className="space-y-3 pt-1">
                            <label className="flex items-center justify-between cursor-pointer">
                              <span className="font-medium text-[#F5EFE6]">Grayscale Filter</span>
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
                                className="rounded border-[#3D372F] bg-[#1C1A17] text-[#F5EFE6] focus:ring-[#F5EFE6]"
                              />
                            </label>

                            <div className="space-y-1">
                              <div className="flex justify-between font-medium text-[#F5EFE6]">
                                <span>Contrast Boost</span>
                                <span className="font-mono text-[#A89F91]">+{contrast}%</span>
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
                                className="w-full accent-[#F5EFE6]"
                              />
                            </div>

                            <div className="space-y-2 pt-1 border-t border-[#2E2A24]">
                              <label className="flex items-center justify-between cursor-pointer">
                                <span className="font-medium text-[#F5EFE6]">
                                  High-Contrast Ink Binarization
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
                                  className="rounded border-[#3D372F] bg-[#1C1A17] text-[#F5EFE6] focus:ring-[#F5EFE6]"
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
                                  className="w-full accent-[#F5EFE6]"
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress / Status feedback */}
            {isProcessing && (
              <div className="space-y-2 bg-[#171513] p-4 rounded-xl border border-[#2E2A24]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#F5EFE6] font-medium flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F5EFE6]" />
                    {ocrStage}
                  </span>
                  <span className="text-[#7D7569]">{ocrProgress}%</span>
                </div>
                <div className="w-full bg-[#2E2A24] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#F5EFE6] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-xl bg-[#201414] border border-[#E05353]/30 text-xs text-[#F5EFE6] space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-[#E05353] font-bold">Error:</span>
                  <div>{errorMsg}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={handleStartAI}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#F5EFE6] hover:underline cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Retry AI Scan
                  </button>
                  <span className="text-[#3D372F]">•</span>
                  <button
                    onClick={handleStartOCR}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#A89F91] hover:underline cursor-pointer"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    Try Local OCR
                  </button>
                  <span className="text-[#3D372F]">•</span>
                  <button
                    onClick={() => setShowPasteModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#A89F91] hover:underline cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Paste Text Manually
                  </button>
                  <span className="text-[#3D372F]">•</span>
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#A89F91] hover:text-[#F5EFE6] hover:underline cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Custom API Key
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-[#1C1A17] rounded-2xl max-w-md w-full border border-[#2E2A24] shadow-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#2E2A24] flex items-center justify-between bg-[#171513]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#F5EFE6]" />
                <h3 className="text-base font-bold text-[#F5EFE6] font-serif">
                  Gemini API Key Settings
                </h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-[#7D7569] hover:text-[#F5EFE6] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5 text-xs text-[#A89F91]">
                <p>
                  By default, AsingAsing uses the server-configured Gemini API key.
                </p>
                <p>
                  You can also enter your own free key from{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#F5EFE6] font-semibold underline"
                  >
                    Google AI Studio
                  </a>
                  . It is stored solely on your device in <code className="bg-[#26231F] text-[#F5EFE6] px-1 py-0.5 rounded">localStorage</code>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#F5EFE6] block">
                  Custom Gemini API Key
                </label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="Leave empty to use server default key"
                  className="w-full bg-[#171513] border border-[#3D372F] rounded-xl px-3 py-2.5 text-xs font-mono text-[#F5EFE6] placeholder:text-[#7D7569] focus:bg-[#121110] focus:border-[#F5EFE6] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#2E2A24]">
                <ShieldCheck className="w-4 h-4 text-[#2ECC71] shrink-0" />
                <p className="text-xs text-[#A89F91]">
                  Free tier: 1,500 scans/day. No credit card required.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#3D372F] text-xs font-medium text-[#A89F91] hover:bg-[#26231F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveApiKey(customApiKey)}
                  className="px-4 py-2 rounded-xl bg-[#F5EFE6] text-[#121110] text-xs font-semibold hover:bg-[#E6DDD0] cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5EFE6]"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paste / Manual Text Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-[#1C1A17] rounded-2xl max-w-lg w-full border border-[#2E2A24] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-[#2E2A24] flex items-center justify-between bg-[#171513]">
              <div>
                <h3 className="text-base font-bold text-[#F5EFE6] font-serif">
                  Paste or Edit Receipt Text
                </h3>
                <p className="text-xs text-[#7D7569]">
                  Paste text lines from SMS, e-receipt, or WhatsApp. We will parse quantities, items, and taxes automatically.
                </p>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-[#7D7569] hover:text-[#F5EFE6] p-1 rounded-lg cursor-pointer"
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
                className="w-full bg-[#171513] border border-[#3D372F] rounded-xl p-3 text-xs font-mono text-[#F5EFE6] placeholder:text-[#7D7569] focus:bg-[#121110] focus:border-[#F5EFE6] outline-none leading-relaxed"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#3D372F] text-xs font-medium text-[#A89F91] hover:bg-[#26231F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParseManualText}
                  className="px-4 py-2 rounded-xl bg-[#F5EFE6] text-[#121110] text-xs font-semibold hover:bg-[#E6DDD0] cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5EFE6]"
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
