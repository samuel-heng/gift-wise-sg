import { useEffect, useState, useRef } from 'react';
import { purchaseService, userProfileService } from '../lib/db';
import type { Purchase, UserProfile } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { format } from 'date-fns';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Edit2, Trash2, Book, Monitor, Shirt, Gamepad, Gift, Star, Home, Utensils, Heart, ShoppingBag, Smile, Badge, Trophy, Music, Camera, Palette, Car, Plane, Phone, Watch, CreditCard, Coffee, Cake, Wine, User, PlusCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../components/ui/form';
import { contactService, occasionService, giftService } from '../lib/db';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { PageLayout } from '@/components/layout/PageLayout';
import { useUser } from '@/context/UserContext';

const CATEGORY_OPTIONS = [
  'Electronics & Gadgets',
  'Books & Stationery',
  'Clothing & Accessories',
  'Toys & Games',
  'Gift Cards & Vouchers',
  'Experiences & Events',
  'Home & Kitchen',
  'Beauty & Personal Care',
  'Food & Drink',
  'Other',
];

const purchaseSchema = z.object({
  contactId: z.string().min(1, 'Contact is required'),
  occasionId: z.string().min(1, 'Occasion is required').or(z.literal('none')),
  price: z.coerce.number().min(0, 'Price must be positive'),
  purchaseDate: z.date({ required_error: 'Purchase date is required' }),
  notes: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  giftName: z.string().optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

function isValidDate(d: any): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

function coerceToDate(val: any): Date | undefined {
  if (!val) return undefined;
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

function parseLocalDate(dateInput: string | Date | undefined | null): Date | undefined {
  if (!dateInput) return undefined;
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'string') {
    const [year, month, day] = dateInput.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return undefined;
}

export function History() {
  const { user, userLoading } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]); // Use any for now due to deep join
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPurchase, setEditPurchase] = useState<any | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [occasions, setOccasions] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [occasionOptions, setOccasionOptions] = useState<any[]>([]);
  const [giftOptions, setGiftOptions] = useState<any[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [pendingEditPurchase, setPendingEditPurchase] = useState<any | null>(null);
  const [filterContactId, setFilterContactId] = useState<string>('all');

  // Move form initialization here, before any use of form
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      contactId: '',
      occasionId: '',
      price: 0,
      purchaseDate: undefined,
      notes: '',
      category: CATEGORY_OPTIONS[0],
      giftName: '',
    },
  });

  // Map category to Lucide icon
  const CATEGORY_ICONS: Record<string, React.ElementType> = {
    'Books & Stationery': Book,
    'Electronics & Gadgets': Monitor,
    'Clothing & Accessories': Shirt,
    'Toys & Games': Gamepad,
    'Gift Cards & Vouchers': CreditCard,
    'Experiences & Events': Star,
    'Home & Kitchen': Home,
    'Beauty & Personal Care': Smile,
    'Food & Drink': Utensils,
    'Other': Gift,
  };

  // Fetch all data needed for dropdowns
  useEffect(() => {
    async function loadAll() {
      if (!user || !user.email) {
        setError('You must be logged in to view this page.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const profile = await userProfileService.getDefaultProfile();
        if (!profile) throw new Error('User profile not found');
        setUserProfile(profile);
        const [contactsData, occasionsData] = await Promise.all([
          contactService.getAll(profile.id),
          occasionService.getAll(profile.id),
        ]);
        setContacts(contactsData);
        setOccasions(occasionsData);
        setPurchases(await purchaseService.getAll(profile.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    if (!userLoading) loadAll();
  }, [user, userLoading]);

  // Update occasion options when contact changes, always include current occasion if editing
  const updateOccasionOptions = async (contactId: string, currentOccasionId?: string) => {
    let filtered = occasions.filter((o) => o.contact_id === contactId);
    if (
      currentOccasionId &&
      currentOccasionId !== 'none' &&
      !filtered.some((o) => o.id === currentOccasionId)
    ) {
      // Try to find the occasion in all occasions
      let found = occasions.find((o) => o.id === currentOccasionId);
      if (!found) {
        // Fetch from backend if not found locally
        try {
          found = await occasionService.getById(currentOccasionId);
        } catch (e) {
          console.warn('Could not fetch occasion by ID:', currentOccasionId, e);
        }
      }
      if (found) {
        filtered = [...filtered, found];
      }
    }
    setOccasionOptions(filtered);
  };

  // Update gift options when occasion changes
  const updateGiftOptions = async (occasionId: string) => {
    if (!userProfile) return;
    setFormLoading(true);
    try {
      let giftsData = [];
      if (occasionId && occasionId !== 'none') {
        giftsData = await giftService.getByOccasionId(occasionId, userProfile.id);
      } else {
        // If no occasion, show all gifts for the contact
        const contactId = form.getValues('contactId');
        if (!contactId) {
          setGiftOptions([]);
          return;
        }
        const occs = occasions.filter((o) => o.contact_id === contactId);
        if (occs.length === 0) {
          setGiftOptions([]);
          return;
        }
        const allGifts = await Promise.all(
          occs.map((o) => giftService.getByOccasionId(o.id, userProfile.id))
        );
        giftsData = allGifts.flat();
      }
      setGiftOptions(giftsData);
    } catch (err) {
      setGiftOptions([]);
      toast.error('Failed to load gifts');
    } finally {
      setFormLoading(false);
    }
  };

  // Add Purchase button handler
  const handleAdd = () => {
    setCategoryManuallySet(false);
    setEditPurchase(null);
    setOccasionOptions([]);
    setGiftOptions([]);
    form.reset({
      contactId: '',
      occasionId: 'none',
      price: 0,
      purchaseDate: undefined,
      notes: '',
      category: CATEGORY_OPTIONS[0],
      giftName: '',
    });
    setEditModalOpen(true);
  };

  // Edit button handler
  const handleEdit = async (purchase: any) => {
    setCategoryManuallySet(false);
    setPendingEditPurchase(purchase);
    const isNoneOccasion = !purchase.gifts?.occasion_id;
    const contactId = isNoneOccasion
      ? (purchase.gifts?.contact_id || purchase.contact_id || '')
      : (purchase.gifts?.occasions?.contact_id || '');
    const occasionId = isNoneOccasion ? 'none' : (purchase.gifts?.occasions?.id || 'none');
    await updateOccasionOptions(contactId, occasionId !== 'none' ? occasionId : undefined);
  };

  // Open modal and reset form only after options are ready and pendingEditPurchase is set
  useEffect(() => {
    if (pendingEditPurchase && occasionOptions.length > 0) {
      const purchase = pendingEditPurchase;
      setEditPurchase(purchase);
      setPendingEditPurchase(null);
      const isNoneOccasion = !purchase.gifts?.occasion_id;
      const contactId = isNoneOccasion
        ? (purchase.gifts?.contact_id || purchase.contact_id || '')
        : (purchase.gifts?.occasions?.contact_id || '');
      const occasionId = isNoneOccasion ? 'none' : (purchase.gifts?.occasions?.id || 'none');
      let purchaseDate = purchase.purchase_date ? parseLocalDate(purchase.purchase_date) : undefined;
      if (purchaseDate && (!(purchaseDate instanceof Date) || isNaN((purchaseDate as Date).getTime()))) {
        purchaseDate = undefined;
      }
      form.reset({
        contactId: String(contactId),
        occasionId: String(occasionId),
        price: purchase.price,
        purchaseDate,
        notes: purchase.notes || '',
        category: purchase.category || CATEGORY_OPTIONS[0],
        giftName: purchase.gifts?.name || '',
      });
      setEditModalOpen(true);
    }
  }, [pendingEditPurchase, occasionOptions]);

  // Watch for contact/occasion changes to update dropdowns
  const contactId = form.watch('contactId');
  const occasionId = form.watch('occasionId');
  useEffect(() => {
    if (contactId) {
      updateOccasionOptions(contactId, occasionId !== 'none' ? occasionId : undefined).then(() => {
        // Only reset occasionId if the current value is not in the new options
        if (occasionId && occasionId !== 'none' && !occasionOptions.some(o => o.id === occasionId)) {
          form.setValue('occasionId', 'none');
        }
      });
      setGiftOptions([]);
    } else {
      setOccasionOptions([]);
      setGiftOptions([]);
      form.setValue('occasionId', 'none');
    }
  }, [contactId]);
  useEffect(() => {
    if (occasionId) {
      updateGiftOptions(occasionId);
    }
    // eslint-disable-next-line
  }, [occasionId]);

  // Helper: auto-suggest category based on gift name using a mapping object
  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    'Books & Stationery': ['book', 'novel', 'stationery', 'notebook', 'journal'],
    'Electronics & Gadgets': ['watch', 'headphone', 'gadget', 'phone', 'laptop', 'tablet', 'camera', 'earbud', 'speaker'],
    'Clothing & Accessories': ['shirt', 'dress', 'clothing', 'scarf', 'hat', 'belt', 'jacket', 'jeans', 'socks', 'tie'],
    'Toys & Games': ['toy', 'game', 'lego', 'puzzle', 'board game', 'doll', 'action figure'],
    'Gift Cards & Vouchers': ['card', 'voucher', 'gift card', 'coupon'],
    'Experiences & Events': ['ticket', 'trip', 'experience', 'event', 'concert', 'show', 'class', 'lesson'],
    'Home & Kitchen': ['kitchen', 'mug', 'pan', 'bottle', 'towel', 'blanket', 'pillow', 'candle', 'bowl', 'plate'],
    'Beauty & Personal Care': ['beauty', 'perfume', 'skincare', 'makeup', 'lotion', 'soap', 'shampoo', 'conditioner'],
    'Food & Drink': ['wine', 'chocolate', 'food', 'drink', 'snack', 'tea', 'coffee', 'cookie', 'cake', 'candy'],
  };
  function suggestCategory(giftName: string) {
    const name = giftName.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return category;
      }
    }
    return 'Other';
  }

  // Helper to get contact name by id
  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? contact.name : 'Unknown';
  };

  // Handle form submit
  const onSubmit = async (values: PurchaseFormValues) => {
    if (!userProfile) return;
    setFormLoading(true);
    try {
      let giftId = '';
      if (editPurchase) {
        if (editPurchase.gifts && editPurchase.gifts.id) {
          // Update the existing gift
          await giftService.update(editPurchase.gifts.id, {
            name: values.giftName || '',
            price: values.price,
            occasion_id: values.occasionId !== 'none' ? values.occasionId : null,
            contact_id: values.contactId || null,
            purchased: true,
          });
          giftId = editPurchase.gifts.id;
        } else {
          toast.error('This purchase is missing its gift record and cannot be updated.');
          setFormLoading(false);
          return;
        }
      } else {
        // Create a new gift for a new purchase
        const newGift = await giftService.create({
          name: values.giftName || '',
          price: values.price,
          occasion_id: values.occasionId !== 'none' ? values.occasionId : null,
          contact_id: values.contactId || null,
          purchased: true,
        }, userProfile.id);
        giftId = newGift.id;
      }
      // In onSubmit, use local time for purchaseDate string
      const purchaseDateStr = values.purchaseDate instanceof Date && !isNaN(values.purchaseDate.getTime())
        ? `${values.purchaseDate.getFullYear()}-${String(values.purchaseDate.getMonth() + 1).padStart(2, '0')}-${String(values.purchaseDate.getDate()).padStart(2, '0')}`
        : '';
      const payload = {
        gift_id: giftId,
        price: values.price,
        purchase_date: purchaseDateStr,
        notes: values.notes,
        user_id: userProfile.id,
        category: values.category,
        occasion_id: values.occasionId !== 'none' ? values.occasionId : null,
        contact_id: values.contactId || null,
      };
      if (editPurchase) {
        await purchaseService.update(editPurchase.id, payload);
        toast.success('Purchase updated!');
        setEditModalOpen(false);
      } else {
        await purchaseService.create(payload, userProfile.id);
        toast.success('Purchase added!');
        setEditModalOpen(false);
      }
      setPurchases(await purchaseService.getAll(userProfile.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save purchase');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete purchase handler
  const handleDeletePurchase = async (purchaseId: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase? This action cannot be undone.')) return;
    setFormLoading(true);
    try {
      await purchaseService.delete(purchaseId);
      toast.success('Purchase deleted!');
      setPurchases(await purchaseService.getAll(userProfile.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete purchase');
    } finally {
      setFormLoading(false);
    }
  };

  // Calculate total spent (filtered or all)
  const filteredPurchases = filterContactId === 'all'
    ? purchases
    : purchases.filter(p => {
        const contactId = p.gifts?.contact_id || p.contact_id;
        return contactId === filterContactId;
      });
  const totalSpent = filteredPurchases.reduce((sum, p) => sum + (p.price || 0), 0);

  return (
    <PageLayout>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 mt-0 gap-2 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold w-full sm:w-auto text-left">Purchase History</h1>
        <Button onClick={handleAdd} className="w-full sm:w-auto flex items-center justify-center">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Purchase
        </Button>
      </div>
      {/* Total spending and filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
        <div className="w-full sm:w-auto flex items-center gap-2">
          <span className="font-semibold text-base sm:text-lg text-gray-900">Total Spent:</span>
          <span className="bg-blue-50 text-blue-900 font-bold rounded-full px-3 py-1 text-base sm:text-lg">${totalSpent.toFixed(2)}</span>
        </div>
        <div className="w-full sm:w-auto flex items-center gap-2">
          <Select value={filterContactId} onValueChange={setFilterContactId}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by contact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contacts</SelectItem>
              {contacts.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64 text-base">Loading purchase history...</div>
      ) : error ? (
        <div className="text-red-500 p-4 text-base">Error: {error}</div>
      ) : (
        <>
          {(() => {
            // Group filtered purchases by year
            const purchasesByYear = filteredPurchases.reduce((acc, purchase) => {
              const dateObj = parseLocalDate(purchase.purchase_date);
              const year = dateObj && !isNaN(dateObj.getTime()) ? dateObj.getFullYear() : 'Unknown';
              if (!acc[year]) acc[year] = [];
              acc[year].push(purchase);
              return acc;
            }, {} as Record<number | string, typeof filteredPurchases>);
            const sortedYears = Object.keys(purchasesByYear)
              .sort((a, b) => {
                const aNum = Number(a);
                const bNum = Number(b);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                  return bNum - aNum;
                }
                if (!isNaN(aNum)) return -1;
                if (!isNaN(bNum)) return 1;
                return String(b).localeCompare(String(a));
              });
            return (
              <div className="space-y-6">
                {sortedYears.map(year => (
                  <div key={year} className="space-y-3">
                    <h3 className="text-base sm:text-lg font-medium pl-1 sm:pl-0">{year}</h3>
                    {purchasesByYear[year].map((purchase) => {
                      const isNoneOccasion = !purchase.gifts?.occasion_id;
                      const contactName = isNoneOccasion
                        ? (purchase.gifts?.contact_id || purchase.contact_id ? getContactName(purchase.gifts?.contact_id || purchase.contact_id) : 'Unknown')
                        : (purchase.gifts?.occasions?.contacts?.name || 'Unknown');
                      const occasionName = isNoneOccasion
                        ? 'None'
                        : (purchase.gifts?.occasions?.occasion_type || 'Unknown');
                      const category = purchase.category || 'Other';
                      const Icon = CATEGORY_ICONS[category] || Gift;
                      const dateObj: Date = parseLocalDate(purchase.purchase_date);
                      const formattedDate = dateObj
                        ? format(dateObj, 'MMM d, yyyy')
                        : 'Unknown';
                      return (
                        <Card
                          key={purchase.id}
                          className="relative rounded-xl shadow-none border mb-2 w-full cursor-pointer hover:bg-slate-50 transition"
                          onClick={() => handleEdit(purchase)}
                          tabIndex={0}
                          role="button"
                          aria-label={`Edit purchase: ${purchase.gifts.name}`}
                        >
                          <div className="relative flex flex-row items-center gap-3 px-3 sm:px-6 py-3 sm:py-4">
                            {/* Icon */}
                            <div className="rounded-full bg-slate-100 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" aria-hidden>
                              <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                            </div>
                            {/* Main content */}
                            <div className="flex-1 flex flex-col justify-center min-w-0">
                              <div className="flex items-start justify-between w-full">
                                <div className="font-semibold text-base sm:text-lg break-words max-w-[180px] sm:max-w-none" style={{ color: '#233A6A' }}>{purchase.gifts.name}</div>
                                {/* Delete button */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="ml-2 mt-[-4px] sm:mt-0 absolute right-0 top-0 z-10 p-1 sm:p-2"
                                  onClick={e => { e.stopPropagation(); handleDeletePurchase(purchase.id); }}
                                  aria-label="Delete purchase"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                                <span>For: {contactName}</span>
                                <span className="mx-1">•</span>
                                <span>{occasionName}</span>
                              </div>
                              <div className="flex items-center justify-between mt-1 w-full">
                                <span className="text-xs sm:text-sm text-muted-foreground">{formattedDate}</span>
                                <span className="bg-white border border-gray-300 rounded-full px-3 sm:px-4 py-1 font-semibold text-base text-gray-900 ml-auto">${purchase.price.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Add/Edit Purchase Modal */}
          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto p-2 sm:p-6">
              <DialogHeader>
                <DialogTitle>{editPurchase ? 'Edit Purchase' : 'Add Purchase'}</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                {editPurchase ? 'Update the details for this purchase.' : 'Fill in the details to add a new purchase.'}
              </DialogDescription>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contactId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact</FormLabel>
                        <Select
                          onValueChange={value => {
                            field.onChange(value);
                            updateOccasionOptions(value);
                            form.setValue('occasionId', '');
                            setGiftOptions([]);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contact" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contacts.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="occasionId"
                    render={({ field }) => {
                      // Improved logging: log value and all option IDs and labels
                      console.log('[Select render] OccasionId field value:', field.value, 'Options:', occasionOptions.map(o => ({ id: o.id, label: o.occasion_type ? `${o.occasion_type} (${o.date})` : o.id })));
                      return (
                      <FormItem>
                        <FormLabel>Occasion</FormLabel>
                        <Select 
                          key={occasionOptions.map(o => o.id).join(',') + field.value}
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!contactId}>
                          <FormControl>
                            <SelectTrigger>
                              {(() => {
                                const selectedOption = occasionOptions.find(o => o.id === field.value);
                                return (
                                  <SelectValue placeholder={selectedOption ? (selectedOption.occasion_type ? `${selectedOption.occasion_type} (${selectedOption.date})` : selectedOption.id) : "Select occasion"} />
                                );
                              })()}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {occasionOptions.map((o) => (
                              <SelectItem key={o.id} value={o.id}>
                                {o.occasion_type ? `${o.occasion_type} (${o.date})` : o.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="giftName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gift</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Gift name"
                            {...field}
                            onChange={e => {
                              field.onChange(e);
                              if (!categoryManuallySet) {
                                const suggested = suggestCategory(e.target.value);
                                form.setValue('category', suggested);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={0.01} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => {
                      // In the purchase modal, ensure field.value is string or Date before calling parseLocalDate
                      const coercedValue = field.value instanceof Date || typeof field.value === 'string' ? parseLocalDate(field.value) : undefined;
                      console.log('PurchaseDate field coerced value:', coercedValue, 'typeof:', typeof coercedValue);
                      return (
                      <FormItem>
                        <FormLabel>Purchase Date</FormLabel>
                        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                    !coercedValue && 'text-muted-foreground'
                                )}
                              >
                                  {coercedValue ? format(coercedValue as any, 'dd/MM/yyyy') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                            <PopoverContent disablePortal className="calendar-popover w-auto p-0 z-[9999] pointer-events-auto" align="start">
                            <Calendar
                              mode="single"
                                selected={coercedValue}
                              onSelect={date => {
                                  console.log('Calendar onSelect date:', date, 'typeof:', typeof date);
                                  field.onChange(date instanceof Date && !isNaN(date.getTime()) ? date : undefined);
                                setDatePopoverOpen(false);
                              }}
                              initialFocus
                              captionLayout="dropdown"
                              fromYear={1920}
                              toYear={new Date().getFullYear()}
                                defaultMonth={coercedValue}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={val => {
                            field.onChange(val);
                            setCategoryManuallySet(true);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Notes (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} disabled={formLoading}>Cancel</Button>
                    <Button type="submit" disabled={formLoading}>{editPurchase ? 'Update Purchase' : 'Add Purchase'}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </PageLayout>
  );
} 