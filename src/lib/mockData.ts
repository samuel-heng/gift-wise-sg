// Mock data for development purposes
// In a real application, these would come from an API or database

export const mockContacts = [
  {
    id: "1",
    name: "Sarah Tan",
    relationship: "family",
    birthday: new Date(1985, 5, 15).toISOString(),
    preferences: "Books, cooking, travel",
    notes: "Allergic to nuts"
  },
  {
    id: "2",
    name: "Michael Lim",
    relationship: "friend",
    birthday: new Date(1982, 8, 23).toISOString(),
    preferences: "Tech gadgets, coffee, watches",
    notes: "Loves specialty coffee"
  },
  {
    id: "3",
    name: "Priya Singh",
    relationship: "colleague",
    birthday: new Date(1990, 3, 10).toISOString(),
    preferences: "Stationery, plants, tea",
    notes: "Prefers practical gifts"
  },
  {
    id: "4",
    name: "David Wong",
    relationship: "partner",
    birthday: new Date(1988, 11, 5).toISOString(),
    preferences: "Video games, board games, sci-fi books",
    notes: "Collector of limited edition items"
  },
  {
    id: "5",
    name: "Lisa Chen",
    relationship: "family",
    birthday: new Date(1962, 2, 28).toISOString(),
    preferences: "Gardening, cooking, jewelry",
    notes: "Prefers handmade gifts"
  }
];

export const mockOccasions = [
  {
    id: "1",
    contactId: "1",
    contactName: "Sarah Tan",
    occasionType: "Birthday",
    date: "June 15, 2025",
    daysLeft: 12
  },
  {
    id: "2",
    contactId: "4",
    contactName: "David Wong",
    occasionType: "Anniversary",
    date: "May 22, 2025",
    daysLeft: 3
  },
  {
    id: "3",
    contactId: "3",
    contactName: "Priya Singh",
    occasionType: "Farewell",
    date: "June 1, 2025",
    daysLeft: 7
  },
  {
    id: "4",
    contactId: "2",
    contactName: "Michael Lim",
    occasionType: "Birthday",
    date: "September 23, 2025",
    daysLeft: 95
  }
];

// Helper function to get a fallback image if the original is not available
const getFallbackImage = (category) => {
  const fallbacks = {
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

export const mockGiftSuggestions = [
  // For Sarah's Birthday
  {
    id: "g1",
    occasionId: "1",
    name: "Best-selling Novel Set",
    price: 45.99,
    rating: 4,
    category: "books",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "g2",
    occasionId: "1",
    name: "Professional Knife Set",
    price: 89.99,
    rating: 5,
    category: "cooking",
    image: "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "g3",
    occasionId: "1",
    name: "Travel Journal",
    price: 24.50,
    rating: 4,
    category: "travel",
    image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "g4",
    occasionId: "1",
    name: "Cooking Class Voucher",
    price: 120.00,
    rating: 5,
    category: "cooking",
    image: "https://images.unsplash.com/photo-1556910103-1c02745adc4b?auto=format&fit=crop&w=300&q=80"
  },
  
  // For David's Anniversary
  {
    id: "g5",
    occasionId: "2",
    name: "Limited Edition Board Game",
    price: 65.00,
    rating: 5,
    category: "games",
    image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "g6",
    occasionId: "2",
    name: "Premium Gaming Headset",
    price: 129.99,
    rating: 4,
    category: "tech",
    image: "https://images.unsplash.com/photo-1585298723682-5cff35142ab3?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "g7",
    occasionId: "2",
    name: "Sci-Fi Book Collection",
    price: 55.00,
    rating: 4,
    category: "books",
    image: "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&w=300&q=80"
  },
  
  // For Priya's Farewell
  {
    id: "g8",
    occasionId: "3",
    name: "Luxury Stationery Set",
    price: 39.99,
    rating: 4,
    category: "stationery",
    image: "https://images.unsplash.com/photo-1565116175827-64847f972a3f?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "g9",
    occasionId: "3",
    name: "Indoor Plant Collection",
    price: 60.00,
    rating: 5,
    category: "plants",
    image: "https://images.unsplash.com/photo-1463320898484-cdee8141c787?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "g10",
    occasionId: "3",
    name: "Premium Tea Set",
    price: 75.00,
    rating: 4,
    category: "tea",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=300&q=80"
  },
  
  // For Michael's Birthday
  {
    id: "g11",
    occasionId: "4",
    name: "Smart Watch",
    price: 199.99,
    rating: 5,
    category: "tech",
    image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "g12",
    occasionId: "4",
    name: "Coffee Subscription",
    price: 80.00,
    rating: 4,
    category: "coffee",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "g13",
    occasionId: "4",
    name: "Leather Watch Case",
    price: 45.00,
    rating: 4,
    category: "watches",
    image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=300&q=80"
  }
];

export const mockPurchaseData = [
  {
    id: "p1",
    contactName: "Sarah Tan",
    contactId: "1",
    occasionName: "Birthday",
    date: "2024-06-15",
    item: "Novel Collection",
    amount: 45.99
  },
  {
    id: "p2",
    contactName: "David Wong",
    contactId: "4",
    occasionName: "Christmas",
    date: "2023-12-24",
    item: "PlayStation 5",
    amount: 499.99
  },
  {
    id: "p3",
    contactName: "Priya Singh",
    contactId: "3",
    occasionName: "Birthday",
    date: "2024-04-10",
    item: "Desk Plant Set",
    amount: 35.50
  },
  {
    id: "p4",
    contactName: "Michael Lim",
    contactId: "2",
    occasionName: "Birthday",
    date: "2023-09-23",
    item: "Coffee Machine",
    amount: 120.00
  },
  {
    id: "p5",
    contactName: "Lisa Chen",
    contactId: "5",
    occasionName: "Mother's Day",
    date: "2024-05-12",
    item: "Pearl Necklace",
    amount: 89.99
  },
  {
    id: "p6",
    contactName: "David Wong",
    contactId: "4",
    occasionName: "Anniversary",
    date: "2024-05-22",
    item: "Limited Edition Board Game",
    amount: 65.00
  },
  {
    id: "p7",
    contactName: "Sarah Tan",
    contactId: "1",
    occasionName: "Christmas",
    date: "2023-12-24",
    item: "Cooking Class Voucher",
    amount: 120.00
  }
];

export const mockSpendingCategories = [
  { name: "Birthday", value: 200, color: "#9b87f5" },
  { name: "Christmas", value: 620, color: "#0EA5E9" },
  { name: "Anniversary", value: 65, color: "#7E69AB" },
  { name: "Other", value: 90, color: "#F1D592" }
];
