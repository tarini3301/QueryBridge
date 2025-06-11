
import React from 'react';

interface LoadingSpinnerProps {
  size?: string; // e.g., "h-8 w-8"
  color?: string; // e.g., "text-blue-500"
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "h-10 w-10", color = "text-cyan-500" }) => {
  return (
    <div
      className={`animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${size} ${color}`}
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
};