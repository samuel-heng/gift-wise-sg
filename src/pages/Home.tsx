import { useEffect, useState, useMemo } from 'react';
import { occasionService, giftService, userProfileService, purchaseService, contactService } from '../lib/db';
import type { Occasion, Gift, UserProfile, Purchase, Contact } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { format, differenceInCalendarDays } from 'date-fns';
import { Button } from '../components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { PageLayout } from '@/components/layout/PageLayout';

// Returns the number of days left until a given date string (YYYY-MM-DD)
function getDaysLeft(dateStr: string) {
  const today = new Date();
  const date = new Date(dateStr);
  return differenceInCalendarDays(date, today);
}

// Returns a color class based on how many days are left
function getDaysLeftColor(daysLeft: number) {
  if (daysLeft < 0) return 'text-muted-foreground';
  if (daysLeft <= 7) return 'text-destructive';
  if (daysLeft <= 30) return 'text-accent';
  return 'text-muted-foreground';
}

const OCCASION_TYPE_OPTIONS = [
  'Birthday',
  'Anniversary',
  'Christmas',
  'Graduation',
  'Wedding',
  'Baby Shower',
  'Housewarming',
  'Farewell',
  'Promotion',
  'Other',
];

// Helper to get the user's local Amazon domain
function getAmazonDomain() {
  const locale = navigator.language || navigator.languages?.[0] || '';
  if (locale.startsWith('en-GB')) return 'amazon.co.uk';
  if (locale.startsWith('de')) return 'amazon.de';
  if (locale.startsWith('fr')) return 'amazon.fr';
  if (locale.startsWith('ja')) return 'amazon.co.jp';
  if (locale.startsWith('en-CA')) return 'amazon.ca';
  if (locale.startsWith('en-IN')) return 'amazon.in';
  if (locale.startsWith('en-SG') || locale.startsWith('ms-SG') || locale.startsWith('zh-SG')) return 'amazon.sg';
  // Add more as needed
  return 'amazon.com';
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

  // Only show unpurchased gifts in the Gift Ideas section
  const unpurchasedGifts = gifts.filter(gift => !gift.purchased);

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

  // Delete occasion handler
  const handleDeleteOccasion = async (occasionId: string) => {
    if (!window.confirm('Are you sure you want to delete this occasion? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await occasionService.delete(occasionId);
      toast({ description: 'Occasion deleted!' });
      const occasionsData = await occasionService.getAll(userProfile.id);
      setOccasions(occasionsData);
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : 'Failed to delete occasion' });
    } finally {
      setLoading(false);
    }
  };

  // --- Add state and logic for selectors and recommendations ---
  const [selectedContactId, setSelectedContactId] = useState<string>(contacts[0]?.id || '');
  const contactOccasions = useMemo(() => occasions.filter(o => o.contact_id === selectedContactId), [occasions, selectedContactId]);
  const [selectedOccasionId, setSelectedOccasionId] = useState<string>('none');
  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const selectedOccasion = selectedOccasionId !== 'none' ? contactOccasions.find(o => o.id === selectedOccasionId) : null;
  // Recommendation logic (replace with OpenAI API later)
  const recommendations = useMemo(() => {
    if (!selectedContact) return [];
    const age = selectedContact.birthday ? Math.floor((Date.now() - new Date(selectedContact.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined;
    const prefs = selectedContact.preferences?.toLowerCase() || '';
    const occasionType = selectedOccasion?.occasion_type || null;
    // Simple rule-based logic for now
    const recs = [];
    if (occasionType === 'Birthday') {
      if (age !== undefined && age < 12) recs.push({ name: 'LEGO Set', reason: 'Popular for kids birthdays', price: 30 });
      else if (age !== undefined && age < 18) recs.push({ name: 'Board Game', reason: 'Fun for teens', price: 25 });
      else if (prefs.includes('book')) recs.push({ name: 'Bestselling Book', reason: 'Matches their interest in books', price: 20 });
      else recs.push({ name: 'Gift Card', reason: 'Always appreciated', price: 25 });
    } else if (occasionType === 'Housewarming') {
      recs.push({ name: 'Scented Candle', reason: 'Great for new homes', price: 15 });
      recs.push({ name: 'Plant', reason: 'Brings life to a new space', price: 20 });
    } else if (occasionType === 'Farewell') {
      recs.push({ name: 'Personalized Mug', reason: 'A memorable keepsake', price: 18 });
      recs.push({ name: 'Travel Journal', reason: 'Useful for new adventures', price: 22 });
    } else if (occasionType) {
      recs.push({ name: `${occasionType} Gift`, reason: `A thoughtful gift for a ${occasionType.toLowerCase()}`, price: 25 });
    } else {
      // No occasion: general recommendations
      if (prefs.includes('coffee')) recs.push({ name: 'Coffee Sampler', reason: 'They love coffee', price: 20 });
      if (prefs.includes('tech')) recs.push({ name: 'Bluetooth Tracker', reason: 'Tech gadgets are always useful', price: 30 });
      if (prefs.includes('book')) recs.push({ name: 'Bookstore Gift Card', reason: 'Matches their interest in books', price: 25 });
      if (age !== undefined && age < 12) recs.push({ name: 'Puzzle Toy', reason: 'Great for young kids', price: 15 });
      if (recs.length === 0) recs.push({ name: 'Gift Card', reason: 'A safe, flexible choice', price: 25 });
    }
    return recs;
  }, [selectedContact, selectedOccasion]);

  return (
    <PageLayout>
      <div className="flex justify-between items-center mb-4 mt-0">
        <h1 className="text-2xl font-bold">Upcoming Occasions</h1>
        <Button onClick={() => openModal()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Occasion
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">Loading...</div>
      ) : error ? (
        <div className="text-red-500 p-4">Error: {error}</div>
      ) : (
        <>
          <div className="mb-10">
            <div className="space-y-4">
              {occasions.map((occasion) => {
                const daysLeft = getDaysLeft(occasion.date);
                const daysLeftColor = getDaysLeftColor(daysLeft);
                return (
                  <Card key={occasion.id} className="flex items-center p-4 shadow-md bg-white cursor-pointer" onClick={() => openModal(occasion)}>
                    <div className="flex-shrink-0 mr-4">
                      <div className="bg-primary/10 rounded-full p-3">
                        <CalendarIcon className="text-primary" size={32} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-lg text-primary mr-2">{occasion.contacts.name}</span>
                          <span className="text-md text-gray-500 font-medium">{occasion.occasion_type}</span>
                        </div>
                        <div className={`text-right font-semibold ${daysLeftColor}`}>
                          {daysLeft < 0 ? 'Passed' : daysLeft === 0 ? 'Today!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                        </div>
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDeleteOccasion(occasion.id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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

          <div>
            <h2 className="text-2xl font-semibold mb-4">Gift Ideas</h2>
            {/* Contact selector */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Contact</label>
                <Select
                  value={selectedContactId}
                  onValueChange={setSelectedContactId}
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
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Occasion</label>
                <Select
                  value={selectedOccasionId}
                  onValueChange={setSelectedOccasionId}
                  disabled={!selectedContactId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {contactOccasions.map(occasion => (
                      <SelectItem key={occasion.id} value={occasion.id}>{occasion.occasion_type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Recommendations */}
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle>{rec.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <div className="text-sm">
                        <span className="font-semibold">Reason:</span> {rec.reason}
                      </div>
                      {rec.price && (
                        <div className="text-sm">
                          <span className="font-semibold">Estimated Price:</span> ${rec.price}
                        </div>
                      )}
                      <a
                        href={`https://${getAmazonDomain()}/s?k=${encodeURIComponent(rec.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-sm"
                      >
                        Search on Amazon
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {recommendations.length === 0 && (
                <Card className="p-6 text-center bg-white/50 border border-dashed">
                  <p className="text-muted-foreground">No recommendations available for this selection.</p>
                </Card>
              )}
            </div>
          </div>

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
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Occasion Type</label>
                  <Select
                    value={form.occasion_type}
                    onValueChange={val => setForm(f => ({ ...f, occasion_type: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select occasion type" />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCASION_TYPE_OPTIONS.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
        </>
      )}
      <footer className="mt-8 text-xs text-muted-foreground text-center max-w-2xl mx-auto">
        <strong>Disclaimer:</strong><br />
        This website is created for learning purposes only. The information provided here should not be considered professional advice. Please note that we make no guarantees regarding the accuracy, completeness, or reliability of the contents of this website. Any actions you take based on the contents of this website are at your own risk. We are not liable for any losses or damages incurred from the use of this website.
      </footer>
    </PageLayout>
  );
} 