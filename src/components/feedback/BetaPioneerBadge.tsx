import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BetaPioneerBadgeProps {
  showTooltip?: boolean;
}

export function BetaPioneerBadge({ showTooltip = true }: BetaPioneerBadgeProps) {
  const badge = (
    <Badge variant="secondary" className="gap-1 bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30">
      <Award className="h-3 w-3" />
      Beta Pioneer
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>Early supporter of InboxAgent.ai</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
