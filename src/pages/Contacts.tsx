import { useEffect, useState } from 'react';
import { contactService, userProfileService } from '../lib/db';
import type { Contact, UserProfile } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { PlusCircle, Mail, Phone, Calendar, Edit2, Trash2 } from 'lucide-react';
import { ContactForm } from '../components/contacts/ContactForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { PageLayout } from '@/components/layout/PageLayout';

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  useEffect(() => {
    async function loadContacts() {
      try {
        const profile = await userProfileService.getDefaultProfile();
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
    setModalOpen(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditContact(contact);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact? This action cannot be undone.')) return;
    try {
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

  return (
    <PageLayout>
      <div className="flex justify-between items-center mb-6 mt-0 flex-shrink-0">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">Loading contacts...</div>
      ) : error ? (
        <div className="text-red-500 p-4">Error: {error}</div>
      ) : (
        <>
          {/* Scrollable contacts grid */}
          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-1">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contacts.map((contact) => (
                <Card key={contact.id}>
                  <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>{contact.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(contact)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(contact.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {contact.relationship && (
                        <div className="text-sm text-muted-foreground">{contact.relationship.charAt(0).toUpperCase() + contact.relationship.slice(1)}</div>
                      )}
                      {contact.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="mr-2 h-4 w-4" />
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="mr-2 h-4 w-4" />
                          {contact.phone}
                        </div>
                      )}
                      {contact.birthday && (
                        <div className="flex items-center text-sm">
                          <Calendar className="mr-2 h-4 w-4" />
                          {new Date(contact.birthday).toLocaleDateString()}
                        </div>
                      )}
                      {contact.preferences && (
                        <div className="text-sm"><b>Preferences:</b> {contact.preferences}</div>
                      )}
                      {contact.notes && (
                        <div className="text-sm"><b>Notes:</b> {contact.notes}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                {editContact ? 'Update the details for this contact.' : 'Fill in the details to add a new contact.'}
              </DialogDescription>
              <ContactForm
                initialValues={editContact ? {
                  ...editContact,
                  birthday: editContact.birthday ? new Date(editContact.birthday) : undefined,
                } : {}}
                onSubmit={handleSubmit}
                isEditing={!!editContact}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </PageLayout>
  );
} 