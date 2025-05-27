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

export function History() {
  const [purchases, setPurchases] = useState<any[]>([]); // Use any for now due to deep join
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
      try {
        const profile = await userProfileService.getDefaultProfile();
        if (!profile) {
          setError('You must be logged in to view this page.');
          setLoading(false);
          return;
        }
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
    loadAll();
  }, []);

  // Update occasion options when contact changes
  const updateOccasionOptions = (contactId: string) => {
    const filtered = occasions.filter((o) => o.contact_id === contactId);
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
    setEditModalOpen(true);
  };

  // Edit button handler
  const handleEdit = (purchase: any) => {
    setCategoryManuallySet(false);
    setEditPurchase(purchase);
    // Defensive: Only update options if data exists
    const isNoneOccasion = !purchase.gifts?.occasion_id;
    const contactId = isNoneOccasion
      ? (purchase.gifts?.contact_id || purchase.contact_id || '')
      : (purchase.gifts?.occasions?.contact_id || '');
    const occasionId = isNoneOccasion ? 'none' : (purchase.gifts?.occasions?.id || '');
    if (contactId) updateOccasionOptions(contactId);
    else setOccasionOptions([]);
    if (!isNoneOccasion && occasionId) updateGiftOptions(occasionId);
    else setGiftOptions([]);
    setEditModalOpen(true);
  };

  // Form logic
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

  // When modal opens, set form values for edit
  useEffect(() => {
    if (editModalOpen) {
      if (editPurchase) {
        const isNoneOccasion = !editPurchase.gifts?.occasion_id;
        // Log values for debugging
        console.log('Edit modal open: editPurchase', editPurchase);
        let occasionId = isNoneOccasion ? 'none' : (editPurchase.gifts?.occasions?.id || '');
        // Fallback: if not in options, set to 'none'
        if (occasionId !== 'none' && !occasionOptions.some(o => o.id === occasionId)) {
          console.warn('OccasionId not found in options, defaulting to none:', occasionId);
          occasionId = 'none';
        }
        let purchaseDate = editPurchase.purchase_date ? new Date(editPurchase.purchase_date) : undefined;
        if (purchaseDate && !(purchaseDate instanceof Date) || isNaN(purchaseDate)) {
          console.warn('Invalid purchaseDate, defaulting to undefined:', purchaseDate);
          purchaseDate = undefined;
        }
        form.reset({
          contactId: isNoneOccasion
            ? (editPurchase.gifts?.contact_id || editPurchase.contact_id || '')
            : (editPurchase.gifts?.occasions?.contact_id || ''),
          occasionId,
          price: editPurchase.price,
          purchaseDate,
          notes: editPurchase.notes || '',
          category: editPurchase.category || CATEGORY_OPTIONS[0],
          giftName: editPurchase.gifts?.name || '',
        });
        console.log('Form reset values:', { occasionId, purchaseDate });
      } else {
        form.reset({
          contactId: contacts[0]?.id || '',
          occasionId: 'none',
          price: 0,
          purchaseDate: undefined,
          notes: '',
          category: CATEGORY_OPTIONS[0],
          giftName: '',
        });
      }
    }
    // eslint-disable-next-line
  }, [editModalOpen, editPurchase, contacts, occasionOptions]);

  // Watch for contact/occasion changes to update dropdowns
  const contactId = form.watch('contactId');
  const occasionId = form.watch('occasionId');
  useEffect(() => {
    if (contactId) {
      updateOccasionOptions(contactId);
      form.setValue('occasionId', '');
      setGiftOptions([]);
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
      const payload = {
        gift_id: giftId,
        price: values.price,
        purchase_date: values.purchaseDate.toISOString().slice(0, 10),
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

  return (
    <PageLayout>
      <div className="flex justify-between items-center mb-4 mt-0">
        <h1 className="text-2xl font-bold">Purchase History</h1>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Purchase
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">Loading purchase history...</div>
      ) : error ? (
        <div className="text-red-500 p-4">Error: {error}</div>
      ) : (
        <>
          {/* Group purchases by year */}
          {(() => {
            // Group purchases by year
            const purchasesByYear = purchases.reduce((acc, purchase) => {
              const year = new Date(purchase.purchase_date).getFullYear();
              if (!acc[year]) acc[year] = [];
              acc[year].push(purchase);
              return acc;
            }, {} as Record<number, typeof purchases>);
            const sortedYears = Object.keys(purchasesByYear).map(Number).sort((a, b) => b - a);
            return (
              <div className="space-y-8">
                {sortedYears.map(year => (
                  <div key={year} className="space-y-4">
                    <h3 className="text-lg font-medium">{year}</h3>
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
                      const dateObj: Date = new Date(purchase.purchase_date as string | number | Date);
                      const formattedDate = purchase.purchase_date && isValidDate(dateObj)
                        ? format(dateObj as any, 'MMM d, yyyy')
                        : 'Unknown';
                      return (
                        <Card key={purchase.id} className="rounded-xl shadow-none border mb-3 w-full">
                          <div className="flex flex-row items-center justify-between px-6 py-4 w-full">
                            {/* Category Icon */}
                            <div className="flex-shrink-0 mr-4">
                              <div className="rounded-full bg-slate-100 flex items-center justify-center w-12 h-12">
                                <Icon className="h-7 w-7 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="font-semibold text-lg text-gray-900 whitespace-nowrap overflow-auto" style={{ maxWidth: '100%' }}>{purchase.gifts.name}</div>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1 whitespace-nowrap overflow-auto" style={{ maxWidth: '100%' }}>
                                <span>For: {contactName}</span>
                                <span className="mx-1">•</span>
                                <span>{occasionName}</span>
                                <span className="mx-1">•</span>
                                <span>{formattedDate}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end ml-4 flex-shrink-0">
                              <span className="bg-white border border-gray-300 rounded-full px-4 py-1 font-semibold text-base text-gray-900">${purchase.price.toFixed(2)}</span>
                              <div className="flex gap-1 mt-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(purchase)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeletePurchase(purchase.id)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
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
            <DialogContent>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                      // Log value for debugging
                      console.log('OccasionId field value:', field.value, 'Options:', occasionOptions.map(o => o.id));
                      return (
                      <FormItem>
                        <FormLabel>Occasion</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!contactId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select occasion" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {occasionOptions.map((o) => (
                              <SelectItem key={o.id} value={o.id}>
                                {o.occasion_type} ({o.date})
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
                      // Robustly coerce value to Date or undefined
                      const coercedValue = coerceToDate(field.value);
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