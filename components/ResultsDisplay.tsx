import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import type { QueryResultItem } from '../types';

interface ResultsDisplayProps {
  results: QueryResultItem[] | null;
  isLoading: boolean;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isLoading }) => {
  const renderTable = (data: QueryResultItem[]) => {
    if (data.length === 0) {
      return <p className="text-slate-400 italic">Query executed successfully, but returned no data.</p>;
    }

    // Check for a single message object (e.g. from dbService for non-SELECT)
    if (data.length === 1 && data[0] && typeof data[0].message === 'string') {
        return <p className="text-slate-300">{data[0].message}</p>;
    }

    const headers = Object.keys(data[0]);

    return (
      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full divide-y divide-zinc-700">
          <thead className="bg-zinc-700/50 sticky top-0">
            <tr>
              {headers.map(header => (
                <th key={header} scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-zinc-800 divide-y divide-zinc-700/50">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-zinc-700/40 transition-colors">
                {headers.map(header => (
                  <td key={`${rowIndex}-${header}`} className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-300">
                    {String(row[header] === null || typeof row[header] === 'undefined' ? 'NULL' : row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-zinc-800 shadow-2xl rounded-xl p-6">
      <h3 className="text-xl font-semibold mb-3 text-cyan-400">Query Results</h3>
      {isLoading ? (
        <div className="flex justify-center items-center h-48"> {/* Increased height for loading spinner visibility */}
          <LoadingSpinner />
        </div>
      ) : results ? (
        renderTable(results)
      ) : (
        <p className="text-slate-500 italic text-center py-10">
          Results from the query executed on your data will appear here...
        </p>
      )}
    </div>
  );
};