import { useEffect, useState } from 'react';
import { occasionService, giftService, userProfileService, purchaseService, contactService } from '../lib/db';
import type { Occasion, Gift, UserProfile, Purchase, Contact } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { format, differenceInCalendarDays } from 'date-fns';
import { Button } from '../components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { FormControl } from '@/components/ui/form';

// Returns the number of days left until a given date string (YYYY-MM-DD)
function getDaysLeft(dateStr: string) {
  const today = new Date();
  const date = new Date(dateStr);
  return differenceInCalendarDays(date, today);
}

// Returns a color class based on how many days are left
function getDaysLeftColor(daysLeft: number) {
  if (daysLeft < 0) return 'text-gray-400';
  if (daysLeft <= 7) return 'text-red-500';
  if (daysLeft <= 30) return 'text-orange-500';
  return 'text-gray-600';
}

export function Home() {
  // State for user profile, contacts, occasions, gifts, purchases, loading, error, modal, and form
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [occasions, setOccasions] = useState<(Occasion & { contacts: { name: string; id?: string } })[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [purchases, setPurchases] = useState<(Purchase & { gifts: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOccasion, setEditOccasion] = useState<any>(null);
  // The form state keeps the selected date as a Date object
  const [form, setForm] = useState({ contactId: '', occasion_type: '', date: undefined as Date | undefined, notes: '' });

  // Budget tracker logic
  const budget = userProfile?.yearly_budget ?? 500;
  const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.price, 0);
  const percentUsed = Math.min((totalSpent / budget) * 100, 100);
  const remaining = Math.max(budget - totalSpent, 0);

  // Loads all data for the Home page (profile, contacts, occasions, gifts, purchases)
  useEffect(() => {
    async function loadData() {
      try {
        const profile = await userProfileService.getDefaultProfile();
        setUserProfile(profile);
        const contactsData = await contactService.getAll(profile.id);
        setContacts(contactsData);
        const occasionsData = await occasionService.getAll(profile.id);
        setOccasions(occasionsData);
        const giftsData = await Promise.all(
          occasionsData.map(occasion =>
            giftService.getByOccasionId(occasion.id, profile.id)
          )
        ).then(results => results.flat());
        setGifts(giftsData);
        const purchasesData = await purchaseService.getAll(profile.id);
        setPurchases(purchasesData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Opens the modal for adding or editing an occasion
  // If editing, pre-fills the form with the occasion's data
  const openModal = (occasion?: any) => {
    if (occasion) {
      setEditOccasion(occasion);
      setForm({
        contactId: occasion.contact_id,
        occasion_type: occasion.occasion_type,
        date: occasion.date ? new Date(occasion.date + 'T00:00:00') : undefined,
        notes: occasion.notes || '',
      });
    } else {
      setEditOccasion(null);
      setForm({ contactId: contacts[0]?.id || '', occasion_type: '', date: undefined, notes: '' });
    }
    setModalOpen(true);
  };

  // Handles saving a new or edited occasion
  // Converts the Date object to a YYYY-MM-DD string for the database
  const handleSave = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const dateStr = form.date ? `${form.date.getFullYear()}-${String(form.date.getMonth() + 1).padStart(2, '0')}-${String(form.date.getDate()).padStart(2, '0')}` : '';
      if (editOccasion) {
        await occasionService.update(editOccasion.id, {
          contact_id: form.contactId,
          occasion_type: form.occasion_type,
          date: dateStr,
          notes: form.notes,
        });
      } else {
        await occasionService.create({
          contact_id: form.contactId,
          occasion_type: form.occasion_type,
          date: dateStr,
          notes: form.notes,
        }, userProfile.id);
      }
      // Refresh data after save
      const occasionsData = await occasionService.getAll(userProfile.id);
      setOccasions(occasionsData);
      const purchasesData = await purchaseService.getAll(userProfile.id);
      setPurchases(purchasesData);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save occasion');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Yearly Budget Tracker at the top */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-lg">Yearly Budget</span>
          <span className="font-semibold text-blue-600 text-lg">${totalSpent.toFixed(2)} / ${budget.toFixed(2)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div
            className="bg-purple-400 h-4 rounded-full transition-all duration-500"
            style={{ width: `${percentUsed}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm">
          <span>{percentUsed.toFixed(0)}% used</span>
          <span className="text-gray-600">${remaining.toFixed(2)} remaining</span>
        </div>
      </div>

      {/* Add Occasion Button */}
      <div className="flex justify-end mb-4">
        <Button onClick={() => openModal()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Occasion
        </Button>
      </div>

      {/* Upcoming Occasions full width */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Upcoming Occasions</h2>
        <div className="space-y-4">
          {occasions.map((occasion) => {
            const daysLeft = getDaysLeft(occasion.date);
            const daysLeftColor = getDaysLeftColor(daysLeft);
            return (
              <Card key={occasion.id} className="flex items-center p-4 shadow-md bg-white cursor-pointer" onClick={() => openModal(occasion)}>
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-purple-100 rounded-full p-3">
                    <CalendarIcon className="text-purple-500" size={32} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-lg text-gift-text mr-2">{occasion.contacts.name}</span>
                      <span className="text-md text-gray-500 font-medium">{occasion.occasion_type}</span>
                    </div>
                    <div className={`text-right font-semibold ${daysLeftColor}`}>
                      {daysLeft < 0 ? 'Passed' : daysLeft === 0 ? 'Today!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                    </div>
                  </div>
                  <div className="text-gray-600 mt-1">
                    <span className="font-semibold">Date:</span> {occasion.date ? format(new Date(occasion.date), 'dd/MM/yyyy') : ''}
                  </div>
                  {occasion.notes && (
                    <div className="text-sm text-gray-400 mt-1">
                      <span className="font-semibold">Notes:</span> {occasion.notes}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Gift Ideas below, full width */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Gift Ideas</h2>
        <div className="space-y-4">
          {gifts.map((gift) => (
            <Card key={gift.id}>
              <CardHeader>
                <CardTitle>{gift.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <div className="text-sm">
                    <span className="font-semibold">Price:</span> ${gift.price}
                  </div>
                  {gift.url && (
                    <div className="text-sm">
                      <span className="font-semibold">Link:</span>{' '}
                      <a href={gift.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        View Item
                      </a>
                    </div>
                  )}
                  {gift.notes && (
                    <div className="text-sm">
                      <span className="font-semibold">Notes:</span> {gift.notes}
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-semibold">Status:</span>{' '}
                    {gift.purchased ? 'Purchased' : 'Not Purchased'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add/Edit Occasion Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editOccasion ? 'Edit Occasion' : 'Add Occasion'}</DialogTitle>
            <DialogDescription>
              {editOccasion
                ? 'Update the details for this occasion.'
                : 'Fill in the details to add a new occasion.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={form.contactId}
              onValueChange={val => setForm(f => ({ ...f, contactId: val }))}
              disabled={contacts.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Occasion Type (e.g. Birthday)"
              value={form.occasion_type}
              onChange={e => setForm(f => ({ ...f, occasion_type: e.target.value }))}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !form.date && "text-muted-foreground"
                  )}
                >
                  {form.date ? (
                    format(form.date, "dd/MM/yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.date}
                  onSelect={date => setForm(f => ({ ...f, date: date ?? undefined }))}
                  initialFocus
                  captionLayout="dropdown"
                  fromYear={1920}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
            <Textarea
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={loading}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 