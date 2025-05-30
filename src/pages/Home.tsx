import { useEffect, useState, useMemo } from 'react';
import { occasionService, giftService, userProfileService, purchaseService, contactService } from '../lib/db';
import type { Occasion, Gift, UserProfile, Purchase, Contact } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { format, differenceInCalendarDays } from 'date-fns';
import { Button } from '../components/ui/button';
import { PlusCircle, Trash2, RefreshCw, ShoppingBag, ShoppingCart, Store } from 'lucide-react';
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
import { fetchGiftIdeas } from "../services/giftIdeasService";
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

// Returns the number of days left until a given date string (YYYY-MM-DD)
function getDaysLeft(dateStr: string) {
  const today = new Date();
  const date = new Date(dateStr);
  return differenceInCalendarDays(date, today);
}

// Returns a color class based on how many days are left
function getDaysLeftColor(daysLeft: number) {
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
  // Check all user languages for a Singapore locale
  const languages = navigator.languages || [navigator.language];
  for (const lang of languages) {
    // Match any language with -SG (e.g., en-SG, ms-SG, zh-SG)
    if (/[-_]SG$/i.test(lang)) return 'amazon.sg';
  }
  // Fallbacks for other major regions
  for (const lang of languages) {
    if (lang.startsWith('en-GB')) return 'amazon.co.uk';
    if (lang.startsWith('de')) return 'amazon.de';
    if (lang.startsWith('fr')) return 'amazon.fr';
    if (lang.startsWith('ja')) return 'amazon.co.jp';
    if (lang.startsWith('en-CA')) return 'amazon.ca';
    if (lang.startsWith('en-IN')) return 'amazon.in';
  }
  // Default fallback
  return 'amazon.com';
}

const LOCAL_STORAGE_KEY = "giftwise-gpt-home-state";
function saveHomeState(state: any) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
}
function loadHomeState() {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Helper to convert days to {value, unit}
function daysToValueUnit(days: number) {
  if (days % 30 === 0) return { value: days / 30, unit: 'months' };
  if (days % 7 === 0) return { value: days / 7, unit: 'weeks' };
  return { value: days, unit: 'days' };
}
function valueUnitToDays(value: number, unit: string) {
  if (unit === 'months') return value * 30;
  if (unit === 'weeks') return value * 7;
  return value;
}

// Helper function for robust date parsing
function parseLocalDate(date: string | Date | undefined): Date | undefined {
  if (!date) return undefined;
  if (date instanceof Date) return date;
  if (typeof date === 'string') return new Date(date + 'T00:00:00');
  return undefined;
}

export function Home() {
  const { user, userLoading } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  // State for user profile, contacts, occasions, gifts, purchases, loading, error, modal, and form
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
      if (!user || !user.email) {
        setError('You must be logged in to view this page.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch user profile to get the id
        const profile = await userProfileService.getDefaultProfile();
        if (!profile) throw new Error('User profile not found');
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
    if (!userLoading) loadData();
  }, [user, userLoading]);

  // Add state for reminder timing
  const [reminderValue, setReminderValue] = useState(2);
  const [reminderUnit, setReminderUnit] = useState('weeks');

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
      const { value, unit } = daysToValueUnit(occasion.reminder_days_before ?? 14);
      setReminderValue(value);
      setReminderUnit(unit);
    } else {
      setEditOccasion(null);
      // Default to next birthday if occasion_type is 'Birthday' and contact has a birthday
      let defaultDate: Date | undefined = undefined;
      let defaultContactId = contacts.length > 0 ? contacts[0].id : '';
      if (defaultContactId) {
        const contact = contacts.find(c => c.id === defaultContactId);
        if (contact && contact.birthday) {
          const dob = new Date(contact.birthday);
          const today = new Date();
          let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          if (
            nextBirthday < today ||
            (nextBirthday.getDate() === today.getDate() && nextBirthday.getMonth() === today.getMonth() && nextBirthday.getFullYear() === today.getFullYear())
          ) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
          }
          defaultDate = nextBirthday;
        }
      }
      setForm({
        contactId: defaultContactId,
        occasion_type: '',
        date: undefined,
        notes: '',
      });
      setReminderValue(2);
      setReminderUnit('weeks');
    }
    setModalOpen(true);
  };

  // Handles saving a new or edited occasion
  // Converts the Date object to a YYYY-MM-DD string for the database
  const handleSave = async () => {
    if (!userProfile) return;
    if (!form.contactId || !form.occasion_type || !form.date) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const dateStr = form.date ? `${form.date.getFullYear()}-${String(form.date.getMonth() + 1).padStart(2, '0')}-${String(form.date.getDate()).padStart(2, '0')}` : '';
      const reminder_days_before = valueUnitToDays(reminderValue, reminderUnit);
      if (editOccasion) {
        await occasionService.update(editOccasion.id, {
          contact_id: form.contactId,
          occasion_type: form.occasion_type,
          date: dateStr,
          notes: form.notes,
          reminder_days_before,
        });
      } else {
        await occasionService.create({
          contact_id: form.contactId,
          occasion_type: form.occasion_type,
          date: dateStr,
          notes: form.notes,
          reminder_days_before,
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
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [recommendationCache, setRecommendationCache] = useState<Record<string, any[]>>({});

  const fetchAIRecommendations = async (forceRefresh = false) => {
    if (!selectedContact) return;
    // Allow occasion to be null/none
    const occasionKey = selectedOccasion ? selectedOccasion.id : 'none';
    const cacheKey = `${selectedContact.id}-${occasionKey}`;
    if (!forceRefresh && recommendationCache[cacheKey]) {
      setAiRecommendations(recommendationCache[cacheKey]);
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      // Get past purchases for this contact
      const pastPurchases = purchases
        .filter(p => {
          // Try to get contact_id from joined gift, fallback to purchase
          const giftContactId = p.gifts && 'contact_id' in p.gifts ? p.gifts.contact_id : undefined;
          return (
            p.gifts && p.gifts.name &&
            (giftContactId === selectedContact.id || p.contact_id === selectedContact.id)
          );
        })
        .map(p => p.gifts.name);
      const aiResults = await fetchGiftIdeas({
        recipient: selectedContact.name,
        relationship: selectedContact.relationship || "",
        contactNotes: selectedContact.notes || "",
        occasion: selectedOccasion ? selectedOccasion.occasion_type : "None",
        occasionNotes: selectedOccasion ? selectedOccasion.notes || "" : "",
        preferences: selectedContact.preferences || "",
        pastPurchases,
        forceRefresh,
      });
      setAiRecommendations(aiResults);
      setRecommendationCache(prev => ({ ...prev, [cacheKey]: aiResults }));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err));
      setAiRecommendations([]);
    }
    setAiLoading(false);
  };

  useEffect(() => {
    if (selectedContact) {
      fetchAIRecommendations();
    } else {
      setAiRecommendations([]);
    }
    // eslint-disable-next-line
  }, [selectedContact, selectedOccasion, purchases]);

  // Reset occasion to 'none' when contact changes
  useEffect(() => {
    setSelectedOccasionId('none');
  }, [selectedContactId]);

  // Restore state from localStorage on mount
  useEffect(() => {
    const saved = loadHomeState();
    if (saved) {
      setSelectedContactId(saved.selectedContactId || '');
      setSelectedOccasionId(saved.selectedOccasionId || 'none');
      setRecommendationCache(saved.recommendationCache || {});
    }
  }, []);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    saveHomeState({
      selectedContactId,
      selectedOccasionId,
      recommendationCache,
    });
  }, [selectedContactId, selectedOccasionId, recommendationCache]);

  // Add state for calendar popover open/close
  const [calendarOpen, setCalendarOpen] = useState(false);

  // 1. Add state for occasion filter
  const [occasionFilter, setOccasionFilter] = useState<'upcoming' | 'past'>('upcoming');

  // 2. Filtered occasions
  const filteredOccasions = useMemo(() => {
    const today = new Date();
    return occasions.filter(o => {
      const date = new Date(o.date);
      if (occasionFilter === 'upcoming') return date >= today;
      return date < today;
    });
  }, [occasions, occasionFilter]);

  const navigate = useNavigate();

  // When the user selects 'Birthday' as the occasion type, auto-fill the date with the next birthday if available
  const handleOccasionTypeChange = (type: string) => {
    setForm(f => {
      if (type === 'Birthday') {
        const contact = contacts.find(c => c.id === f.contactId);
        if (contact && contact.birthday) {
          const dob = new Date(contact.birthday);
          const today = new Date();
          let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
          }
          return { ...f, occasion_type: type, date: nextBirthday };
        }
      }
      return { ...f, occasion_type: type };
    });
  };

  return (
    <PageLayout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 mt-0 gap-2 md:gap-0">
        <h1 className="text-xl md:text-2xl font-bold w-full text-left">Important Occasions</h1>
        <div className="flex w-full justify-between items-center mt-2 md:mt-0">
          <div className="flex gap-2">
            <Button variant={occasionFilter === 'upcoming' ? 'default' : 'outline'} size="sm" onClick={() => setOccasionFilter('upcoming')}>Upcoming</Button>
            <Button variant={occasionFilter === 'past' ? 'default' : 'outline'} size="sm" onClick={() => setOccasionFilter('past')}>Past</Button>
          </div>
          <Button onClick={() => openModal()} className="ml-2">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Occasion
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">Loading...</div>
      ) : error ? (
        <div className="text-red-500 p-4">Error: {error}</div>
      ) : (
        <>
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-center text-base text-muted-foreground mb-4">You have no contacts yet. Go to the Contacts page to add your first contact and get started!</p>
              <Button onClick={() => navigate('/contacts')} className="w-fit">Go to Contacts</Button>
            </div>
          ) : (
            <>
              {filteredOccasions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-center text-base text-muted-foreground mb-4">You have contacts but no occasions. Add an occasion to start tracking important dates!</p>
                </div>
              )}
              <div className="mb-10">
                <div className="space-y-4">
                  {filteredOccasions.map((occasion) => {
                    const daysLeft = getDaysLeft(occasion.date);
                    const isPassed = daysLeft < 0;
                    return (
                      <Card key={occasion.id} className="flex items-center p-2 md:p-4 shadow-md bg-white cursor-pointer mb-4" onClick={() => openModal(occasion)}>
                        {/* Calendar icon on the left */}
                        <div className="flex-shrink-0 mr-4">
                          <div className="bg-primary/10 rounded-full p-2 md:p-3">
                            <CalendarIcon className="text-primary" size={window.innerWidth < 768 ? 22 : 32} />
                          </div>
                        </div>
                        {/* Main content */}
                        <div className="flex-1 flex flex-col">
                          {/* Top row: contact name and delete icon */}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg text-primary mr-2">{occasion.contacts.name}</span>
                            <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDeleteOccasion(occasion.id); }} className="text-destructive ml-2">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {/* Second row: occasion type and status */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-md font-medium text-[#233A6A]">{occasion.occasion_type}</span>
                            <span className={
                              isPassed
                                ? 'px-3 py-1 rounded-full font-semibold text-gray-400 ring-2 ring-gray-300 bg-gray-50'
                                : 'px-3 py-1 rounded-full font-semibold text-blue-700 ring-2 ring-blue-200 bg-blue-50'
                            }>
                              {isPassed ? 'Passed' : daysLeft === 0 ? 'Today!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                            </span>
                          </div>
                          {/* Date and notes */}
                          <div className="text-gray-600 mt-1">
                            <span className="font-semibold">Date:</span> {occasion.date && parseLocalDate(occasion.date) ? format(parseLocalDate(occasion.date) as Date, 'dd/MM/yyyy') : 'Unknown'}
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
                <div className="flex items-center mb-4">
                  <h2 className="text-2xl font-semibold mr-2">Gift Ideas</h2>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => fetchAIRecommendations(true)}
                    disabled={aiLoading || !selectedContact}
                    aria-label="Refresh gift ideas"
                    className="ml-1 bg-[#233A6A] hover:bg-[#1a2b4d] text-white"
                  >
                    <RefreshCw className={aiLoading ? 'animate-spin' : ''} />
                  </Button>
                </div>
                <div className="mb-2 text-sm text-muted-foreground">
                  Our AI-powered idea generator takes into account the contact's preferences, the occasion, and their past purchases to suggest thoughtful gifts.
                </div>
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
                {/* AI Recommendations */}
                <div className="space-y-4">
                  {aiRecommendations.map((rec, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle>{rec.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          <div className="text-sm">
                            <span className="font-semibold">Reason:</span> {rec.reason}
                          </div>
                          <div className="text-sm mt-2">
                            <span className="font-semibold">Start shopping on:</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <a
                              href={`https://${getAmazonDomain()}/s?k=${encodeURIComponent(rec.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 rounded-full bg-[#232F3E] text-white text-sm font-medium hover:bg-[#1a232e] transition"
                            >
                              <ShoppingBag className="w-4 h-4 mr-1" /> Amazon
                            </a>
                            <a
                              href={`https://shopee.sg/search?keyword=${encodeURIComponent(rec.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF5722] text-white text-sm font-medium hover:bg-[#e64a19] transition"
                              title="You may need to log in to Shopee to see search results"
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" /> Shopee
                            </a>
                            <a
                              href={`https://www.lazada.sg/catalog/?q=${encodeURIComponent(rec.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 rounded-full bg-[#1a9cff] text-white text-sm font-medium hover:bg-[#157acc] transition"
                            >
                              <Store className="w-4 h-4 mr-1" /> Lazada
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {aiRecommendations.length === 0 && !aiLoading && (
                    <Card className="p-6 text-center bg-white/50 border border-dashed">
                      <p className="text-muted-foreground">No recommendations available for this selection.</p>
                    </Card>
                  )}
                  {aiError && (
                    <div className="text-red-500">{aiError}</div>
                  )}
                </div>
              </div>

              {aiLoading && (
                <div className="flex flex-col items-center justify-center my-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                  <div className="text-sm text-muted-foreground">Generating ideas, this may take a few seconds...</div>
                </div>
              )}

              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto p-2 md:p-6">
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
                        onValueChange={handleOccasionTypeChange}
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
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                      <PopoverContent disablePortal className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.date instanceof Date ? form.date : (form.date ? new Date(form.date) : undefined)}
                          onSelect={date => {
                            setForm(f => ({ ...f, date: date instanceof Date && !Number.isNaN(date?.getTime()) ? date : undefined }));
                            if (date) setCalendarOpen(false);
                          }}
                          initialFocus
                          captionLayout="dropdown"
                          fromYear={2020}
                          toYear={new Date().getFullYear() + 10}
                          defaultMonth={form.date instanceof Date ? form.date : (form.date ? new Date(form.date) : new Date())}
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium">Remind me:</label>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={reminderValue}
                        onChange={e => setReminderValue(Number(e.target.value))}
                        className="w-16"
                      />
                      <Select value={reminderUnit} onValueChange={setReminderUnit}>
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">days</SelectItem>
                          <SelectItem value="weeks">weeks</SelectItem>
                          <SelectItem value="months">months</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">before the occasion</span>
                    </div>
                    <Textarea
                      placeholder="Notes (optional)"
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSave} disabled={loading || !form.contactId || !form.occasion_type || !form.date}>
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </>
      )}
    </PageLayout>
  );
} 