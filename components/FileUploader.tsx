import React, { useRef } from 'react';

interface FileUploaderProps {
  onFileLoaded: (content: string) => void;
  onLoadSample: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileLoaded, onLoadSample }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoaded(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Data Source</h3>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <label className="block w-full sm:w-auto">
          <span className="sr-only">Choose CSV</span>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100
              cursor-pointer
            "
          />
        </label>
        <span className="text-slate-400 text-sm">or</span>
        <button
          onClick={onLoadSample}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          Load Sample Data
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-3">
        Required format: <code>date,category,amount</code> (Income should be a category named "Income")
      </p>
    </div>
  );
};
