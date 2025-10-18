import React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Suggestion = { address?: string; whenText?: string; title: string };

export default function CalendarSuggest({ 
  suggestion, 
  onAdd 
}: { 
  suggestion: Suggestion | null; 
  onAdd: () => void 
}) {
  if (!suggestion) return null;
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-blue-900">{suggestion.title}</p>
            {suggestion.address && (
              <p className="text-xs text-blue-700 mt-1">{suggestion.address}</p>
            )}
            {suggestion.whenText && (
              <p className="text-xs text-blue-600 mt-1">{suggestion.whenText}</p>
            )}
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add to Calendar
        </Button>
      </div>
    </div>
  );
}
