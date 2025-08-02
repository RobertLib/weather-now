"use client";

import { AlertCircle, X } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onClose: () => void;
}

export default function ErrorMessage({ message, onClose }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <span className="text-red-700">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="text-red-500 hover:text-red-700 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
