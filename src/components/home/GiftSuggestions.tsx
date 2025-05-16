import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface GiftItem {
  id: string;
  name: string;
  price: number;
  rating: number;
  category: string;
  image?: string;
}

interface GiftSuggestionsProps {
  occasionId: string;
  contactName: string;
  occasionName: string;
  suggestions: GiftItem[];
  onSelectGift: (giftId: string) => void;
}

// Helper function to get a fallback image if the original is not available
const getFallbackImage = (category: string) => {
  const fallbacks: Record<string, string> = {
    books: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80",
    cooking: "https://images.unsplash.com/photo-1556910103-1c02745adc4b?auto=format&fit=crop&w=300&q=80",
    travel: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=300&q=80",
    games: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=300&q=80",
    tech: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=300&q=80",
    stationery: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=300&q=80",
    plants: "https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&w=300&q=80",
    tea: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=300&q=80",
    coffee: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=300&q=80",
    watches: "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=300&q=80"
  };
  
  return fallbacks[category] || "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=300&q=80";
};

export const GiftSuggestions: React.FC<GiftSuggestionsProps> = ({
  occasionId,
  contactName,
  occasionName,
  suggestions,
  onSelectGift
}) => {
  // Get unique categories from suggestions
  const categories = ["all", ...Array.from(new Set(suggestions.map(g => g.category)))];
  
  // Function to handle image loading errors
  const handleImageError = (event: React.SyntheticEvent<HTMLDivElement>, category: string) => {
    const target = event.target as HTMLDivElement;
    target.style.backgroundImage = `url(${getFallbackImage(category)})`;
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Gift Ideas for {contactName}</h3>
        <p className="text-sm text-muted-foreground">{occasionName}</p>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full overflow-x-auto flex flex-nowrap pb-1">
          {categories.map(category => (
            <TabsTrigger 
              key={category}
              value={category}
              className="whitespace-nowrap"
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Render a TabsContent for each category */}
        {categories.map(category => {
          const filteredSuggestions = category === "all"
            ? suggestions
            : suggestions.filter(g => g.category === category);
            
          return (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredSuggestions.map((gift) => (
                  <Card
                    key={gift.id}
                    className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onSelectGift(gift.id)}
                  >
                    <div 
                      className="aspect-square bg-gray-100 flex items-center justify-center bg-cover bg-center"
                      style={gift.image ? { backgroundImage: `url(${gift.image})` } : { backgroundImage: `url(${getFallbackImage(gift.category)})` }}
                      onError={(e) => handleImageError(e, gift.category)}
                      data-category={gift.category}
                    >
                      {!gift.image && <span className="text-gray-400">Loading image...</span>}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm line-clamp-1">{gift.name}</p>
                      <div className="flex justify-between items-center mt-1">
                        <Badge variant="secondary" className="text-xs">
                          ${gift.price.toFixed(2)}
                        </Badge>
                        <div className="flex">
                          {"★".repeat(gift.rating)}
                          {"☆".repeat(5 - gift.rating)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {filteredSuggestions.length === 0 && (
                <Card className="p-6 text-center bg-white/50 border border-dashed">
                  <p className="text-muted-foreground">No gift suggestions in this category</p>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};
