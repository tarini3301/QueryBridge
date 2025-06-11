
import React, { useState } from 'react';

interface SchemaDisplayProps {
  schema: string;
}

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const ChevronUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
);


export const SchemaDisplay: React.FC<SchemaDisplayProps> = ({ schema }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Basic parsing for better display
  const schemaParts = schema.trim().split('\n');
  const tableNameLine = schemaParts.find(line => line.toLowerCase().startsWith("table name:")) || "Table: Unknown";
  const descriptionLine = schemaParts.find(line => line.toLowerCase().startsWith("description:")) || "";
  const columnsHeaderLine = schemaParts.findIndex(line => line.toLowerCase().startsWith("columns:"));
  
  let columns: string[] = [];
  if (columnsHeaderLine !== -1) {
    columns = schemaParts.slice(columnsHeaderLine + 1).filter(line => line.trim().startsWith("-"));
  }


  return (
    <div className="bg-zinc-800 shadow-2xl rounded-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
      >
        <h3 className="text-xl font-semibold text-cyan-400">Database Schema ({tableNameLine.split(':')[1]?.trim() || 'Details'})</h3>
        {isOpen ? <ChevronUpIcon className="w-6 h-6 text-slate-400" /> : <ChevronDownIcon className="w-6 h-6 text-slate-400" />}
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          {descriptionLine && <p className="text-sm text-slate-400 mb-3">{descriptionLine.split(':')[1]?.trim()}</p>}
          <div className="max-h-80 overflow-y-auto bg-zinc-900/70 p-4 rounded-lg">
            <h4 className="text-md font-medium text-sky-300 mb-2">Columns:</h4>
            <ul className="space-y-1">
              {columns.map((line, index) => {
                const parts = line.substring(1).trim().split(':');
                const columnName = parts[0]?.trim();
                const rest = parts.slice(1).join(':').trim().split('(');
                const columnType = rest[0]?.trim();
                const columnDesc = rest[1]?.replace(')', '').trim();
                return (
                  <li key={index} className="text-xs text-slate-300">
                    <strong className="text-slate-100">{columnName}</strong>: <span className="text-emerald-400">{columnType}</span>
                    {columnDesc && <span className="text-slate-400 italic"> ({columnDesc})</span>}
                  </li>
                );
              })}
              {columns.length === 0 && schemaParts.slice(1).map((line, index) => (
                 <p key={index} className="text-xs text-slate-300 whitespace-pre-wrap">{line}</p>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};