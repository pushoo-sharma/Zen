import React from 'react';

type Props = { category?: string };

const COLORS: Record<string, string> = {
  ActiveDeals: 'bg-emerald-100 text-emerald-800',
  ClientLeads: 'bg-blue-100 text-blue-800',
  Showings: 'bg-indigo-100 text-indigo-800',
  Vendors: 'bg-amber-100 text-amber-800',
  Marketing: 'bg-slate-100 text-slate-800',
};

export default function CategoryBadge({ category = 'Marketing' }: Props) {
  const cls = COLORS[category] || COLORS['Marketing'];
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${cls}`}>
      {category}
    </span>
  );
}
