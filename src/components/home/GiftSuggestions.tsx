
import React, { useState } from 'react';
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

export const GiftSuggestions: React.FC<GiftSuggestionsProps> = ({
  occasionId,
  contactName,
  occasionName,
  suggestions,
  onSelectGift
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Get unique categories from suggestions
  const categories = ["all", ...Array.from(new Set(suggestions.map(g => g.category)))];
  
  const filteredSuggestions = selectedCategory === "all"
    ? suggestions
    : suggestions.filter(g => g.category === selectedCategory);

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
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={selectedCategory} className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredSuggestions.map((gift) => (
              <Card
                key={gift.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectGift(gift.id)}
              >
                <div 
                  className="aspect-square bg-gray-100 flex items-center justify-center"
                  style={gift.image ? { backgroundImage: `url(${gift.image})`, backgroundSize: 'cover' } : {}}
                >
                  {!gift.image && <span className="text-gray-400">No Image</span>}
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
      </Tabs>
    </div>
  );
};
