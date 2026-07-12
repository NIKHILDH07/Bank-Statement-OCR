import { useState, useEffect } from "react";
import { FileText, Eye, ImageIcon, Lock, CheckCircle } from "lucide-react";

interface InteractivePreviewProps {
  file: File | null;
}

export function InteractivePreview({ file }: InteractivePreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!file) {
    return (
      <div
        id="empty-preview-container"
        className="flex flex-col items-center justify-center h-[340px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/10 rounded-2xl p-6 text-center"
      >
        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-xl mb-3">
          <FileText className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          No File Uploaded
        </h4>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-[200px] mx-auto">
          Upload a statement to visualize the active preview.
        </p>
      </div>
    );
  }

  const isImage = file.type.startsWith("image/");

  return (
    <div
      id="interactive-preview-card"
      className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col h-[340px]"
    >
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3 mb-3 shrink-0">
        <div className="flex items-center space-x-2.5">
          {isImage ? (
            <ImageIcon className="h-4.5 w-4.5 text-indigo-500" />
          ) : (
            <FileText className="h-4.5 w-4.5 text-red-500" />
          )}
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 line-clamp-1 max-w-[220px]">
            {file.name}
          </span>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md uppercase">
          {file.type.split("/")[1] || "File"}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-zinc-50 dark:bg-zinc-950/60 p-2 border border-zinc-100 dark:border-zinc-800/40 relative group">
        {isImage && objectUrl ? (
          <img
            id="preview-img-tag"
            src={objectUrl}
            alt="Uploaded statement preview"
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-105 shadow-xs"
          />
        ) : (
          /* Elegant Document Cover Placeholder for PDF */
          <div
            id="pdf-placeholder-container"
            className="flex flex-col items-center justify-center text-center p-6 space-y-4"
          >
            <div className="relative">
              <div className="p-5 bg-red-100/60 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl shadow-sm">
                <FileText className="h-10 w-10" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full">
                <CheckCircle className="h-3 w-3" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Secure Document Loaded
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[200px]">
                PDF has been loaded in-memory and is prepared for secure server-side OCR extraction.
              </p>
            </div>
            {objectUrl && (
              <a
                id="view-pdf-tab-link"
                href={objectUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 px-3 py-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-900/40 transition-all cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Open in New Tab</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
