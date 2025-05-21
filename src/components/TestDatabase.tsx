import { useEffect, useState } from 'react';
import { contactService, occasionService, giftService, purchaseService } from '../lib/db';
import type { Contact, Occasion, Gift, Purchase } from '../lib/supabase';

export function TestDatabase() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [occasions, setOccasions] = useState<(Occasion & { contacts: { name: string } })[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [purchases, setPurchases] = useState<(Purchase & { gifts: { name: string } })[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [contactsData, occasionsData, purchasesData] = await Promise.all([
          contactService.getAll(),
          occasionService.getAll(),
          purchaseService.getAll()
        ]);

        setContacts(contactsData);
        setOccasions(occasionsData);
        setPurchases(purchasesData);

        // Load gifts for each occasion
        const giftsPromises = occasionsData.map(occasion => 
          giftService.getByOccasionId(occasion.id)
        );
        const giftsData = await Promise.all(giftsPromises);
        setGifts(giftsData.flat());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    }

    loadData();
  }, []);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Database Test Results</h2>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Contacts</h3>
        <div className="grid gap-2">
          {contacts.map(contact => (
            <div key={contact.id} className="p-2 border rounded">
              {contact.name} - {contact.email}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Occasions</h3>
        <div className="grid gap-2">
          {occasions.map(occasion => (
            <div key={occasion.id} className="p-2 border rounded">
              {occasion.contacts.name} - {occasion.occasion_type} on {new Date(occasion.date).toLocaleDateString()}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Gifts</h3>
        <div className="grid gap-2">
          {gifts.map(gift => (
            <div key={gift.id} className="p-2 border rounded">
              {gift.name} - ${gift.price} ({gift.purchased ? 'Purchased' : 'Not Purchased'})
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Purchases</h3>
        <div className="grid gap-2">
          {purchases.map(purchase => (
            <div key={purchase.id} className="p-2 border rounded">
              {purchase.gifts.name} - ${purchase.price} on {new Date(purchase.purchase_date).toLocaleDateString()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 