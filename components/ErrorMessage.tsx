
import React from 'react';

interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
}

const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="bg-red-500/20 text-red-300 border border-red-500 p-4 rounded-lg flex items-start space-x-3 shadow-lg">
      <XCircleIcon className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-grow">
        <p className="font-semibold">Error</p>
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-400 hover:text-red-200 transition-colors duration-150"
          title="Close message"
        >
           <XCircleIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};