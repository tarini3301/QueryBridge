
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface SqlExplanationDisplayProps {
  explanation: string;
  isLoading: boolean;
}

export const SqlExplanationDisplay: React.FC<SqlExplanationDisplayProps> = ({ explanation, isLoading }) => {
  if (!isLoading && !explanation) {
    return null; // Don't render if there's nothing to show and not loading
  }

  return (
    <div className="bg-zinc-800 shadow-2xl rounded-xl p-6">
      <h3 className="text-xl font-semibold mb-3 text-cyan-400">SQL Explanation</h3>
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner />
        </div>
      ) : explanation ? (
        <pre className="bg-zinc-900/70 p-4 rounded-lg text-sm text-slate-300 overflow-x-auto whitespace-pre-wrap break-all max-h-96">
          {explanation}
        </pre>
      ) : (
        <p className="text-slate-500 italic text-center py-10">Click "Explain SQL" to see an explanation here...</p>
      )}
    </div>
  );
};