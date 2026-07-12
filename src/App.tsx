import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Landmark,
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
  Play,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Coins,
  CheckCircle,
} from "lucide-react";
import { ThemeToggle } from "./components/ThemeToggle";
import { UploadZone } from "./components/UploadZone";
import { StatsCards } from "./components/StatsCards";
import { EditableTable } from "./components/EditableTable";
import { InteractivePreview } from "./components/InteractivePreview";
import { ExtractionResult, Transaction } from "./types";

// Animated messages list to loop through during OCR parsing
const PROGRESS_MESSAGES = [
  "Uploading statement securely to parsing sandbox...",
  "Initializing Google Gemini Vision API parser...",
  "Analyzing page layout and identifying transaction tables...",
  "Applying computer vision to rotate, deskew and optimize readable structures...",
  "Reading transactions line-by-line, ignoring logos and headers...",
  "Normalizing statement currencies and float amounts...",
  "Automatically classifying transaction rows into standard categories...",
  "Generating notes and validating balance integrity...",
  "Formatting structured transactions for download...",
];

// Sample data for demo testing
const DEMO_EXTRACTION: ExtractionResult = {
  bankName: "Stellar Global Bank",
  statementPeriod: "01/04/2026 - 30/04/2026",
  currency: "USD",
  totalDeposits: 52120.0,
  totalWithdrawals: 6511.5,
  transactions: [
    {
      id: "demo-1",
      date: "02/04/2026",
      description: "Amazon Web Services Hosting",
      amount: -149.0,
      category: "Bills",
      notes: "Debit",
    },
    {
      id: "demo-2",
      date: "03/04/2026",
      description: "Salary Paycheck Deposit - Stellar Tech Corp",
      amount: 52000.0,
      category: "Salary",
      notes: "Salary Credit",
    },
    {
      id: "demo-3",
      date: "05/04/2026",
      description: "Organic Groceries Whole Foods Market",
      amount: -112.5,
      category: "Food",
      notes: "Debit",
    },
    {
      id: "demo-4",
      date: "10/04/2026",
      description: "Chevron Fuel Station",
      amount: -65.0,
      category: "Fuel",
      notes: "Auto Debit",
    },
    {
      id: "demo-5",
      date: "12/04/2026",
      description: "OpenAI API Subscription",
      amount: -20.0,
      category: "Bills",
      notes: "Debit",
    },
    {
      id: "demo-6",
      date: "15/04/2026",
      description: "ATM Cash Withdrawal - Main St Branch",
      amount: -300.0,
      category: "ATM Withdrawal",
      notes: "Cash Withdrawal",
    },
    {
      id: "demo-7",
      date: "18/04/2026",
      description: "Stripe Payout - App Store Revenue",
      amount: 120.0,
      category: "Income",
      notes: "Credit",
    },
    {
      id: "demo-8",
      date: "20/04/2026",
      description: "Rent Payment - City Apartments Ltd",
      amount: -2200.0,
      category: "Rent",
      notes: "Recurring Payment",
    },
    {
      id: "demo-9",
      date: "22/04/2026",
      description: "SaaS Enterprise Monthly Subscription",
      amount: -1450.0,
      category: "Bills",
      notes: "Debit",
    },
    {
      id: "demo-10",
      date: "25/04/2026",
      description: "Delta Airlines Flights Booking",
      amount: -715.0,
      category: "Travel",
      notes: "Debit",
    },
  ],
};

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [progressIdx, setProgressIdx] = useState<number>(0);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [themeDark, setThemeDark] = useState<boolean>(true);

  // Interval hook to step through beautiful loading logs during heavy-lifting API request
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExtracting) {
      setProgressIdx(0);
      interval = setInterval(() => {
        setProgressIdx((prev) => (prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev));
      }, 3500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isExtracting]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
  };

  const handleFileClear = () => {
    setSelectedFile(null);
    setExtractionResult(null);
    setErrorMsg(null);
  };

  // Perform full-stack Gemini transaction extraction call
  const triggerExtraction = async () => {
    if (!selectedFile) return;

    setIsExtracting(true);
    setExtractionResult(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse bank statement. Please try again.");
      }

      const result: ExtractionResult = await response.json();
      
      // Inject client-side IDs to allow seamless deletion and updates in table views
      const normalizedResult: ExtractionResult = {
        ...result,
        transactions: (result.transactions || []).map((t, idx) => ({
          ...t,
          id: `extracted-${Date.now()}-${idx}`,
        })),
      };

      setExtractionResult(normalizedResult);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred. Please verify your connection.");
    } finally {
      setIsExtracting(false);
    }
  };

  // Update transaction rows modified inside EditableTable, re-calculating financial summaries accordingly
  const handleTransactionsUpdate = (updatedTransactions: Transaction[]) => {
    if (!extractionResult) return;

    // Recalculate totals
    let deposits = 0;
    let withdrawals = 0;

    updatedTransactions.forEach((t) => {
      if (t.amount >= 0) {
        deposits += t.amount;
      } else {
        withdrawals += Math.abs(t.amount);
      }
    });

    setExtractionResult({
      ...extractionResult,
      totalDeposits: deposits,
      totalWithdrawals: withdrawals,
      transactions: updatedTransactions,
    });
  };

  // Immediate load of sample mock transactions to showcase interface capabilities instantly
  const loadDemoData = () => {
    setExtractionResult({ ...DEMO_EXTRACTION });
    setErrorMsg(null);
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 pb-16">
      {/* Header Bar */}
      <header
        id="app-header-bar"
        className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-xl text-white shadow-md">
              <Landmark className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Bank Statement OCR
              </h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                Document AI Transaction Parser
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Gemini 3.5 Engine Ready</span>
            </span>

            <button
              id="try-demo-btn"
              onClick={loadDemoData}
              className="px-3.5 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              Demo Mode
            </button>

            <ThemeToggle onThemeChange={setThemeDark} />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Intro Hero Section (visible if nothing extracted yet) */}
        {!extractionResult && !isExtracting && (
          <div id="intro-hero" className="max-w-3xl mx-auto text-center space-y-4 mb-4">
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Generation computer vision OCR</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
              Instant Bank Statement Parsing
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Upload scanned statement images or multi-page PDF documents. Our Gemini-powered Vision OCR processes messy columns, standardizes currencies, and formats entries into a clean spreadsheet instantly.
            </p>
          </div>
        )}

        {/* Action Panel - Uploder & Previews */}
        {!extractionResult && (
          <div
            id="workspace-grid"
            className={`grid grid-cols-1 ${
              selectedFile ? "lg:grid-cols-2" : "max-w-xl mx-auto"
            } gap-6 items-stretch`}
          >
            {/* Upload Zone Card */}
            <div className="flex flex-col space-y-4 h-full">
              <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                    Select Document
                  </h3>
                  <UploadZone
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile}
                    onFileClear={handleFileClear}
                  />
                </div>

                {selectedFile && !isExtracting && (
                  <button
                    id="trigger-extraction-btn"
                    onClick={triggerExtraction}
                    className="w-full mt-6 bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md cursor-pointer group"
                  >
                    <span>Extract Transactions</span>
                    <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                  </button>
                )}
              </div>
            </div>

            {/* Document Preview Panel */}
            {selectedFile && (
              <InteractivePreview file={selectedFile} />
            )}
          </div>
        )}

        {/* Loading Overlay State */}
        {isExtracting && (
          <div
            id="ocr-extraction-loader"
            className="max-w-xl mx-auto p-8 rounded-3xl border border-indigo-100 dark:border-indigo-950/40 bg-white dark:bg-zinc-900 shadow-lg flex flex-col items-center text-center space-y-6"
          >
            <div className="relative">
              <div className="p-5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-3xl animate-spin duration-[4000ms]">
                <Loader2 className="h-10 w-10 shrink-0" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-indigo-500 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-zinc-800 dark:text-zinc-200">
                Running OCR Extraction Pipeline
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-sm">
                This process usually takes between 3 to 10 seconds depending on document length and resolution. Please do not close this window.
              </p>
            </div>

            {/* Simulated Live Processing Logs */}
            <div className="w-full bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 text-left">
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                Pipeline Progress:
              </p>
              <div className="flex items-center space-x-2.5 mt-2">
                <Loader2 className="h-3.5 w-3.5 text-indigo-500 animate-spin shrink-0" />
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 animate-pulse leading-snug">
                  {PROGRESS_MESSAGES[progressIdx]}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification Alert */}
        {errorMsg && (
          <div
            id="global-error-alert"
            className="max-w-xl mx-auto p-5 rounded-2xl border border-red-200 dark:border-red-950/60 bg-red-50/50 dark:bg-red-950/10 text-red-600 dark:text-red-400 text-sm font-medium flex items-start space-x-3.5"
          >
            <AlertCircle className="h-5.5 w-5.5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Extraction Failed</p>
              <p className="text-xs leading-relaxed opacity-90">{errorMsg}</p>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  triggerExtraction();
                }}
                className="mt-2.5 inline-flex items-center space-x-1 px-3 py-1 text-[11px] font-bold bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/40 rounded-lg hover:bg-red-50 hover:dark:bg-red-950/20 text-red-600 dark:text-red-400 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry Extraction</span>
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Results State */}
        {extractionResult && (
          <div id="extraction-results-view" className="space-y-6">
            
            {/* Header Dashboard Bar with reset option */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Parsed Account Dashboard
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Verify statement entries, filter records, or download exact reports.
                </p>
              </div>

              <button
                id="parse-new-document-btn"
                onClick={handleFileClear}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Parse New Document</span>
              </button>
            </div>

            {/* KPI Summary Cards */}
            <StatsCards
              bankName={extractionResult.bankName}
              statementPeriod={extractionResult.statementPeriod}
              currency={extractionResult.currency}
              totalDeposits={extractionResult.totalDeposits}
              totalWithdrawals={extractionResult.totalWithdrawals}
            />

            {/* Editable Rich Transactions Table */}
            <EditableTable
              transactions={extractionResult.transactions}
              onTransactionsUpdate={handleTransactionsUpdate}
              currency={extractionResult.currency}
            />
          </div>
        )}
      </main>
    </div>
  );
}
