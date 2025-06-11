
import React, { useRef, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface DataInputProps {
  csvData: string;
  onCsvDataChange: (data: string) => void;
  onLoadData: () => void;
  isDbReady: boolean;
  dbError: string | null;
}

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

export const DataInput: React.FC<DataInputProps> = ({ csvData, onCsvDataChange, onLoadData, isDbReady, dbError }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileReadError, setFileReadError] = useState<string | null>(null);

  const handleFileChooseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileReadError(null);
    setSelectedFileName(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setFileReadError("Invalid file type. Please select a .csv file.");
        onCsvDataChange(''); // Clear previous data
        return;
      }
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onCsvDataChange(text);
      };
      reader.onerror = () => {
        setFileReadError("Error reading file.");
        onCsvDataChange(''); // Clear previous data
      }
      reader.readAsText(file);
    }
     // Reset file input value to allow selecting the same file again if needed
    if(event.target) {
        event.target.value = '';
    }
  };

  return (
    <div className="bg-zinc-800 shadow-2xl rounded-xl p-6 space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-3 text-cyan-400">
          Load Your CSV Data
        </h3>
        
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleFileChooseClick}
            className="w-full flex items-center justify-center px-4 py-2.5 border border-zinc-600 text-slate-300 hover:bg-zinc-700 hover:text-cyan-400 font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-all duration-150"
          >
            <UploadIcon className="w-5 h-5 mr-2" />
            Choose CSV File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,text/csv"
            style={{ display: 'none' }}
          />
          {selectedFileName && (
            <p className="text-xs text-slate-400 text-center">Selected file: <span className="font-medium text-slate-300">{selectedFileName}</span></p>
          )}
           {fileReadError && (
            <p className="text-xs text-red-400 text-center">{fileReadError}</p>
          )}
        </div>

        <p className="text-xs text-slate-500 my-3 text-center">Or paste CSV content below (first line should be headers):</p>
        
        <textarea
          id="csvInput"
          value={csvData}
          onChange={(e) => {
            onCsvDataChange(e.target.value);
            setSelectedFileName(null); // Clear selected file name if user types in textarea
            setFileReadError(null);
          }}
          placeholder="sl_no,gender,ssc_p,ssc_b,hsc_p,..."
          className="w-full h-32 p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-150 resize-y placeholder-slate-500 text-xs"
        />
      </div>
      
      <button
        onClick={onLoadData}
        className="w-full flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
        disabled={!csvData.trim()}
      >
        Load Data into In-Browser DB
      </button>

      {/* Status Messages */}
      {!isDbReady && !dbError && !selectedFileName && !csvData.trim() && (
         <p className="text-sm text-slate-400 text-center">Upload or paste CSV data to begin.</p>
      )}
      {!isDbReady && !dbError && (csvData.trim() || selectedFileName) && (
        <div className="flex items-center text-sm text-amber-400 justify-center">
          <LoadingSpinner size="h-4 w-4 mr-2" color="text-amber-400" />
          <span>Initializing database... (Click "Load Data" if you haven't)</span>
        </div>
      )}
      {isDbReady && !dbError && (
        <p className="text-sm text-green-400 text-center">✔ Database ready with current data.</p>
      )}
      {/* dbError is handled by ErrorMessage component in App.tsx, but local fileReadError is here */}
    </div>
  );
};