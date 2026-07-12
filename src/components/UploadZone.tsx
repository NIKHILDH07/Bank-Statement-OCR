import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onFileClear: () => void;
}

export function UploadZone({ onFileSelect, selectedFile, onFileClear }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const maxSizeBytes = 15 * 1024 * 1024; // 15MB

    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported file format. Please upload PDF, PNG, JPG, or JPEG.");
      return false;
    }

    if (file.size > maxSizeBytes) {
      setError("File exceeds the 15MB size limit. Please choose a smaller file.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div id="upload-zone-container" className="w-full">
      {selectedFile ? (
        <div
          id="selected-file-card"
          className="relative p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <FileText className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 max-w-[200px] sm:max-w-md">
                {selectedFile.name}
              </p>
              <div className="flex items-center space-x-2 mt-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Ready for OCR extraction</span>
                <span className="text-zinc-400 dark:text-zinc-500">•</span>
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>
            </div>
          </div>
          <button
            id="clear-file-btn"
            onClick={(e) => {
              e.stopPropagation();
              onFileClear();
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
            title="Remove file"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      ) : (
        <div
          id="drag-drop-zone"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`flex flex-col items-center justify-center w-full min-h-[220px] p-6 text-center border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
            isDragActive
              ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10 scale-[0.99]"
              : "border-zinc-300 dark:border-zinc-800 hover:border-indigo-400 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
          }`}
        >
          <input
            id="statement-file-input"
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,image/png,image/jpeg,image/jpg"
            onChange={handleFileInput}
          />
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4 shadow-sm">
            <UploadCloud className="h-8 w-8" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Upload your bank statement
          </h3>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
            Drag and drop your statement file here, or <span className="text-indigo-600 dark:text-indigo-400 font-medium">browse local files</span>.
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 mt-4">
            <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md">
              PDF
            </span>
            <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md">
              PNG
            </span>
            <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md">
              JPG
            </span>
            <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md">
              Max 15MB
            </span>
          </div>
        </div>
      )}

      {error && (
        <div
          id="upload-error-alert"
          className="mt-3 p-3 flex items-start space-x-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 text-red-600 dark:text-red-400 text-xs font-medium"
        >
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
