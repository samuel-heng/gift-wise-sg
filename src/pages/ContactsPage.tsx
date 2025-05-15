
import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ContactList } from '@/components/contacts/ContactList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactForm } from '@/components/contacts/ContactForm';
import { useNavigate } from 'react-router-dom';
import { mockContacts } from '@/lib/mockData';

const ContactsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('list');
  
  const handleAddContact = (data: any) => {
    console.log('New contact:', data);
    // In a real app, this would add the contact to the database
    setActiveTab('list');
  };

  return (
    <PageLayout>
      <div className="space-y-6 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="list">Contacts</TabsTrigger>
            <TabsTrigger value="add">Add New</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="mt-4">
            <ContactList contacts={mockContacts} />
          </TabsContent>
          
          <TabsContent value="add" className="mt-4">
            <ContactForm onSubmit={handleAddContact} />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default ContactsPage;
