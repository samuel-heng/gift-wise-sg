
import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface Occasion {
  id: string;
  contactName: string;
  occasionType: string;
  date: string;
  daysLeft: number;
}

interface UpcomingOccasionsProps {
  occasions: Occasion[];
  onSelectOccasion: (occasionId: string) => void;
}

export const UpcomingOccasions: React.FC<UpcomingOccasionsProps> = ({ 
  occasions,
  onSelectOccasion
}) => {
  if (occasions.length === 0) {
    return (
      <Card className="p-6 text-center bg-white/50 border border-dashed">
        <p className="text-muted-foreground">No upcoming occasions</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {occasions.map((occasion) => (
        <Card 
          key={occasion.id}
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelectOccasion(occasion.id)}
        >
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-full mr-3">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{occasion.contactName}</p>
              <p className="text-sm text-muted-foreground">{occasion.occasionType}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{occasion.date}</p>
              <p className={`text-xs ${occasion.daysLeft <= 7 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {occasion.daysLeft === 0 ? 'Today' : 
                  occasion.daysLeft === 1 ? 'Tomorrow' : 
                  `${occasion.daysLeft} days left`}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
