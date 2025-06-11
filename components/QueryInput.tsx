import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled?: boolean; // Added disabled prop
}

export const QueryInput: React.FC<QueryInputProps> = ({ value, onChange, onSubmit, isLoading, disabled }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className="bg-zinc-800 shadow-2xl rounded-xl p-6">
      <label htmlFor="naturalQuery" className="block text-xl font-semibold mb-3 text-cyan-400">
        Enter Your Question
      </label>
      <textarea
        id="naturalQuery"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g., How many students are placed with a salary over 500000?"
        className="w-full h-32 p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-150 resize-none placeholder-slate-500"
        disabled={isLoading || disabled}
      />
      <button
        onClick={onSubmit}
        disabled={isLoading || disabled || !value.trim()}
        className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="h-5 w-5" color="text-white" />
            <span className="ml-2">Processing...</span>
          </>
        ) : (
          'Generate & Execute SQL'
        )}
      </button>
       {disabled && !isLoading && (
        <p className="text-xs text-amber-400 mt-2 text-center">
          Database is not ready. Please load data or wait for initialization.
        </p>
      )}
    </div>
  );
};