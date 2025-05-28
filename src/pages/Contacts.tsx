import { useEffect, useState } from 'react';
import { contactService, userProfileService, purchaseService, occasionService, giftService } from '../lib/db';
import type { Contact, UserProfile } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { PlusCircle, Mail, Phone, Calendar, Edit2, Trash2 } from 'lucide-react';
import { ContactForm } from '../components/contacts/ContactForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { PageLayout } from '@/components/layout/PageLayout';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { format } from 'date-fns';

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [search, setSearch] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('All');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [giftHistory, setGiftHistory] = useState<any[]>([]);
  const [giftHistoryLoading, setGiftHistoryLoading] = useState(false);

  useEffect(() => {
    async function loadContacts() {
      try {
        const profile = await userProfileService.getDefaultProfile();
        if (!profile) {
          setError('You must be logged in to view this page.');
          setLoading(false);
          return;
        }
        setUserProfile(profile);
        const data = await contactService.getAll(profile.id);
        setContacts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contacts');
      } finally {
        setLoading(false);
      }
    }
    loadContacts();
  }, []);

  const refreshContacts = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const data = await contactService.getAll(userProfile.id);
      setContacts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditContact(null);
    setSelectedContact(null);
    setModalOpen(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditContact(contact);
    setSelectedContact(contact);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact? This action cannot be undone.')) return;
    if (!userProfile) return;
    try {
      // 1. Delete all purchases for this contact
      const allPurchases = await purchaseService.getAll(userProfile.id);
      const contactPurchases = allPurchases.filter(p => (p.gifts?.contact_id || p.contact_id) === id);
      for (const purchase of contactPurchases) {
        await purchaseService.delete(purchase.id);
      }

      // 2. Delete all occasions for this contact (and their gifts)
      const occasions = await occasionService.getByContactId(id);
      for (const occasion of occasions) {
        // Delete all gifts for this occasion
        const gifts = await giftService.getByOccasionId(occasion.id, userProfile.id);
        for (const gift of gifts) {
          await giftService.update(gift.id, { occasion_id: null }); // Unlink from occasion
          await giftService.update(gift.id, { contact_id: null }); // Unlink from contact
        }
        await occasionService.delete(occasion.id);
      }

      // 3. Delete or unlink all gifts directly linked to this contact (not via occasion)
      const giftsForContact = await giftService.getByContactId(id, userProfile.id);
      for (const gift of giftsForContact) {
        // Option 1: Delete the gift
        // await giftService.delete(gift.id);
        // Option 2: Unlink the contact
        await giftService.update(gift.id, { contact_id: null });
      }

      // 4. Finally, delete the contact
      await contactService.delete(id);
      toast.success('Contact deleted');
      refreshContacts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete contact');
    }
  };

  const handleSubmit = async (form: any) => {
    if (!userProfile) return;
    try {
      if (editContact) {
        await contactService.update(editContact.id, { ...form, user_id: userProfile.id });
        toast.success('Contact updated');
      } else {
        await contactService.create({ ...form, user_id: userProfile.id });
        toast.success('Contact added');
      }
      setModalOpen(false);
      refreshContacts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save contact');
    }
  };

  // Get unique relationship types for filter buttons, sorted by count descending then alphabetically
  const relationshipCounts: Record<string, number> = {};
  contacts.forEach(c => {
    if (c.relationship) {
      relationshipCounts[c.relationship] = (relationshipCounts[c.relationship] || 0) + 1;
    }
  });
  const relationshipTypes = Array.from(new Set(contacts.map(c => c.relationship).filter(Boolean)))
    .sort((a, b) => {
      const countDiff = (relationshipCounts[b] || 0) - (relationshipCounts[a] || 0);
      if (countDiff !== 0) return countDiff;
      return a.localeCompare(b);
    });

  // Sort contacts alphabetically
  const sortedContacts = [...contacts].sort((a, b) => a.name.localeCompare(b.name));

  // Filter contacts by search and relationship
  const filteredContacts = sortedContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(search.toLowerCase());
    const matchesRelationship = relationshipFilter === 'All' || (contact.relationship && contact.relationship === relationshipFilter);
    return matchesSearch && matchesRelationship;
  });

  // Fetch gift history when selectedContact changes
  useEffect(() => {
    async function fetchHistory() {
      if (!selectedContact || !userProfile) return;
      setGiftHistoryLoading(true);
      try {
        const allPurchases = await purchaseService.getAll(userProfile.id);
        // Filter for this contact
        const contactPurchases = allPurchases.filter(p => {
          // Try to get contact_id from joined gift, fallback to purchase
          const giftContactId = p.gifts && 'contact_id' in p.gifts ? p.gifts.contact_id : undefined;
          return (
            p.gifts && p.gifts.name &&
            (giftContactId === selectedContact.id || p.contact_id === selectedContact.id)
          );
        });
        setGiftHistory(contactPurchases);
      } catch {
        setGiftHistory([]);
      }
      setGiftHistoryLoading(false);
    }
    fetchHistory();
  }, [selectedContact, userProfile]);

  // Back to Contacts handler
  const handleBackToContacts = () => {
    setModalOpen(false);
    setEditContact(null);
    setSelectedContact(null);
  };

  return (
    <PageLayout>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 mt-0 gap-2 sm:gap-0 flex-shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold w-full sm:w-auto text-left">Contacts</h1>
        <Button onClick={handleAdd} variant="default" className="w-full sm:w-auto flex items-center justify-center">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>
      {/* Search bar and filter buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 w-full">
        <Input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <div className="flex flex-nowrap gap-2 mt-2 sm:mt-0 w-full sm:w-auto overflow-x-auto scrollbar-hide">
          <Button
            variant={relationshipFilter === 'All' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRelationshipFilter('All')}
            className="min-w-[64px] px-2 sm:px-3"
          >
            All
          </Button>
          {relationshipTypes.map(type => (
            <Button
              key={type}
              variant={relationshipFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRelationshipFilter(type)}
              className="min-w-[64px] px-2 sm:px-3"
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64 text-base">Loading contacts...</div>
      ) : error ? (
        <div className="text-red-500 p-4 text-base">Error: {error}</div>
      ) : (
        <>
          {/* Scrollable contacts list */}
          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-1">
            <div className="flex flex-col gap-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-white rounded-lg shadow-sm mb-1 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => { setEditContact(contact); setSelectedContact(contact); setModalOpen(true); }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#233A6A] flex items-center justify-center text-white font-bold text-lg uppercase">
                    {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-base sm:text-lg truncate">{contact.name}</span>
                    {contact.relationship && (
                      <span className="text-sm text-muted-foreground capitalize truncate">{contact.relationship}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="p-2" onClick={e => { e.stopPropagation(); handleDelete(contact.id); }}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-2 sm:p-6">
              <div className="mb-6 flex items-center">
                <Button
                  onClick={handleBackToContacts}
                  variant="default"
                  className="bg-[#233A6A] hover:bg-[#1a2b4d] text-white px-4 py-2 flex items-center gap-2"
                >
                  <span className="text-lg">←</span> Back to Contacts
                </Button>
              </div>
              <DialogHeader>
                <DialogTitle>Contact Details</DialogTitle>
              </DialogHeader>
              {selectedContact || editContact === null ? (
                <>
                  <div className="text-xl font-semibold mb-2">{editContact ? editContact.name : selectedContact?.name || 'New Contact'}</div>
                  <Tabs defaultValue="details" className="w-full mt-2">
                    <TabsList className="w-full mb-6 flex justify-center gap-0 bg-[#f4f6fb] rounded-lg p-1">
                      <TabsTrigger value="details" className="w-1/2 py-3 text-base rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-center">Details</TabsTrigger>
                      <TabsTrigger value="history" className="w-1/2 py-3 text-base rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-center" disabled={editContact === null}>Gift History</TabsTrigger>
                    </TabsList>
                    <div className="relative h-[400px] sm:h-[500px] overflow-y-auto px-1">
                      <TabsContent value="details" className="h-full">
                        <div className="h-full flex flex-col">
                          <ContactForm
                            initialValues={
                              editContact
                                ? {
                                    name: editContact.name,
                                    relationship: editContact.relationship || '',
                                    birthday: editContact.birthday ? new Date(editContact.birthday) : undefined,
                                    preferences: editContact.preferences || '',
                                    notes: editContact.notes || '',
                                  }
                                : {
                                    name: '',
                                    relationship: '',
                                    birthday: undefined,
                                    preferences: '',
                                    notes: '',
                                  }
                            }
                            onSubmit={handleSubmit}
                            isEditing={!!editContact}
                          />
                        </div>
                      </TabsContent>
                      <TabsContent value="history" className="h-full">
                        <div className="h-full flex flex-col">
                          {editContact === null ? (
                            <div className="text-center py-8 text-muted-foreground">No gift history for a new contact.</div>
                          ) : giftHistoryLoading ? (
                            <div className="text-center py-8">Loading gift history...</div>
                          ) : giftHistory.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No gift history found for this contact.</div>
                          ) : (
                            <div className="space-y-6">
                              {Object.entries(
                                giftHistory.reduce((acc, p) => {
                                  const year = new Date(p.purchase_date).getFullYear();
                                  acc[year] = acc[year] || [];
                                  acc[year].push(p);
                                  return acc;
                                }, {} as Record<string, any[]>)
                              ).sort((a, b) => Number(b[0]) - Number(a[0])).map(([year, purchases]) => (
                                <div key={year}>
                                  <div className="font-semibold text-lg mb-2">{year}</div>
                                  <div className="space-y-3">
                                    {(purchases as any[]).map((p, idx) => (
                                      <div key={idx} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                                        <div>
                                          <div className="font-medium">{p.gifts.name}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {p.gifts.occasions?.occasion_type || ''}
                                            {p.gifts.occasions?.occasion_type && p.purchase_date ? ' • ' : ''}
                                            {p.purchase_date ? format(new Date(p.purchase_date), 'MMM d, yyyy') : ''}
                                          </div>
                                        </div>
                                        <div className="font-semibold bg-gray-100 rounded-full px-3 py-1 text-sm">${p.price.toFixed(2)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </>
              ) : null}
            </DialogContent>
          </Dialog>
        </>
      )}
    </PageLayout>
  );
} 