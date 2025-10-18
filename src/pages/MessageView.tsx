import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CategoryBadge from '@/components/inboxzen/CategoryBadge';
import DealHeat from '@/components/inboxzen/DealHeat';
import CalendarSuggest from '@/components/inboxzen/CalendarSuggest';
import { scoreMessage, type Msg } from '@/inboxzen-core/prioritization/priority_pipeline';
import { extractFeatures } from '@/inboxzen-core/agents/real_estate/features';
import { trackEvent, trackAction, Events } from '@/lib/analytics';
import seedData from '../../testdata/seed_realestate_inbox.json';

// Load test data
const SAMPLE_MESSAGES: Msg[] = seedData.map(msg => ({
  id: msg.id,
  subject: msg.subject,
  body: msg.body,
  from: msg.from,
  date: msg.date,
}));

export default function MessageView() {
  const [selectedMsg, setSelectedMsg] = useState<Msg | null>(null);
  const [scoredMessages, setScoredMessages] = useState<any[]>([]);

  useEffect(() => {
    // Track page view
    trackEvent(Events.EMAIL_PRIORITIZED, { message_count: SAMPLE_MESSAGES.length });
    
    // Score all messages on load
    const scored = SAMPLE_MESSAGES.map(msg => {
      const score = scoreMessage(msg);
      const features = extractFeatures(msg);
      return { msg, score, features };
    });
    
    // Sort by score (highest first)
    scored.sort((a, b) => b.score.total - a.score.total);
    setScoredMessages(scored);
    
    // Select first message
    if (scored.length > 0) {
      setSelectedMsg(scored[0].msg);
      trackAction('message_selected', 'email', { 
        message_id: scored[0].msg.id,
        score: scored[0].score.total 
      });
    }
  }, []);

  const selectedData = scoredMessages.find(s => s.msg.id === selectedMsg?.id);

  const handleAddToCalendar = () => {
    trackAction('calendar_suggestion_accepted', 'ai', {
      message_id: selectedMsg?.id,
      has_address: selectedData?.features.hasAddress,
      has_datetime: selectedData?.features.hasDateTime
    });
    alert('Calendar event would be created here!');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">InboxAgent.ai - Real Estate</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Message List */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-lg font-semibold mb-3">Prioritized Inbox</h2>
            {scoredMessages.map(({ msg, score }) => (
              <Card
                key={msg.id}
                className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedMsg?.id === msg.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  setSelectedMsg(msg);
                  trackAction('message_selected', 'email', {
                    message_id: msg.id,
                    category: score.category,
                    score: score.total
                  });
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-sm line-clamp-1">{msg.subject}</h3>
                  <CategoryBadge category={score.category} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {msg.body}
                </p>
                <DealHeat score={score.total} />
                {score.reason && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    {score.reason}
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedData ? (
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold">{selectedData.msg.subject}</h2>
                      <p className="text-sm text-muted-foreground">
                        From: {selectedData.msg.from}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <CategoryBadge category={selectedData.score.category} />
                      <DealHeat score={selectedData.score.total} />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedData.msg.body}</p>
                  </div>

                  {/* AI Features */}
                  <div className="border-t pt-4 space-y-3">
                    <h3 className="font-semibold text-sm">AI Insights</h3>
                    
                    <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                      <p><strong>Score Breakdown:</strong></p>
                      <p>Base Score: {selectedData.score.base}</p>
                      <p>Boost: +{selectedData.score.boost}</p>
                      <p>Total: {selectedData.score.total}/100</p>
                      {selectedData.score.reason && (
                        <p className="italic text-muted-foreground mt-2">
                          Reasoning: {selectedData.score.reason}
                        </p>
                      )}
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                      <p><strong>Detected Features:</strong></p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <p>Offer: {selectedData.features.hasOffer ? '✓' : '✗'}</p>
                        <p>Escrow: {selectedData.features.hasEscrow ? '✓' : '✗'}</p>
                        <p>Inspection: {selectedData.features.hasInspection ? '✓' : '✗'}</p>
                        <p>Appraisal: {selectedData.features.hasAppraisal ? '✓' : '✗'}</p>
                        <p>Address: {selectedData.features.hasAddress ? '✓' : '✗'}</p>
                        <p>DateTime: {selectedData.features.hasDateTime ? '✓' : '✗'}</p>
                      </div>
                    </div>

                    {/* Calendar suggestion if has date/time and address */}
                    {(selectedData.features.hasDateTime || selectedData.features.hasAddress) && (
                      <CalendarSuggest
                        suggestion={{
                          title: selectedData.msg.subject,
                          address: selectedData.features.hasAddress ? '123 Main St' : undefined,
                          whenText: selectedData.features.hasDateTime ? 'Tomorrow at 2:00 PM' : undefined,
                        }}
                        onAdd={handleAddToCalendar}
                      />
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">Select a message to view details</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
