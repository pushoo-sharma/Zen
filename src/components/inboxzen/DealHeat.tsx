import React from 'react';

export default function DealHeat({ score }: { score: number }) {
  const color = score >= 75 ? 'text-red-600' : score >= 50 ? 'text-orange-500' : 'text-slate-600';
  return (
    <div className="text-sm">
      Deal Heat: <span className={`font-semibold ${color}`}>{score}</span>
    </div>
  );
}
