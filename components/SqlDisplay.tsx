import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface SqlDisplayProps {
  sqlQuery: string;
  isLoading: boolean;
  onExplainSql: () => void;
  isExplainLoading: boolean;
  disabled?: boolean; // Added disabled prop for explain button based on AI availability
}

const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 4.625v2.625m-7.5-2.625v2.625m0-2.625H12m0 0V9.75M12 12.75v2.625" />
  </svg>
);

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L24 5.25l-.813 2.846a4.5 4.5 0 00-3.09 3.09L17.25 12l2.846.813a4.5 4.5 0 003.09 3.09L24 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L18.25 12zM12 2.25l.813 2.846a4.5 4.5 0 003.09 3.09L18.75 9l-2.846.813a4.5 4.5 0 00-3.09 3.09L12 15.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L5.25 9l2.846-.813a4.5 4.5 0 003.09-3.09L12 2.25z" />
  </svg>
);


export const SqlDisplay: React.FC<SqlDisplayProps> = ({ sqlQuery, isLoading, onExplainSql, isExplainLoading, disabled }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (sqlQuery) {
      navigator.clipboard.writeText(sqlQuery).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const canExplain = sqlQuery && !isLoading && !isExplainLoading && !disabled;

  return (
    <div className="bg-zinc-800 shadow-2xl rounded-xl p-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-semibold text-cyan-400">Generated SQL Query</h3>
        <div className="flex items-center space-x-2">
          {sqlQuery && !isLoading && (
            <>
              <button
                onClick={onExplainSql}
                disabled={!canExplain}
                className="flex items-center p-1.5 rounded-md hover:bg-zinc-700 text-slate-400 hover:text-cyan-400 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                title={disabled ? "Explain SQL (AI not ready)" : "Explain SQL"}
              >
                {isExplainLoading ? <LoadingSpinner size="h-5 w-5" color="text-slate-400"/> : <SparklesIcon className="w-5 h-5" />}
                <span className="ml-1 text-xs hidden sm:inline">Explain</span>
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-zinc-700 text-slate-400 hover:text-cyan-400 transition-colors duration-150"
                title={copied ? "Copied!" : "Copy SQL"}
              >
                {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                 <span className="ml-1 text-xs hidden sm:inline sr-only">{copied ? "Copied" : "Copy"}</span>
              </button>
            </>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner />
        </div>
      ) : sqlQuery ? (
        <pre className="bg-zinc-900/70 p-4 rounded-lg text-sm text-sky-300 overflow-x-auto whitespace-pre-wrap break-all max-h-96">
          {sqlQuery}
        </pre>
      ) : (
        <p className="text-slate-500 italic text-center py-10">SQL query will appear here...</p>
      )}
    </div>
  );
};