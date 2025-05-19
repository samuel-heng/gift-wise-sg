// Import React and state management hook
import React, { useState } from 'react';
// Import page layout component for consistent structure
import { PageLayout } from '@/components/layout/PageLayout';
// Import the contact list component
import { ContactList } from '@/components/contacts/ContactList';
// Import UI components
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Import contact form component for adding new contacts
import { ContactForm } from '@/components/contacts/ContactForm';
// Import navigation hook
import { useNavigate } from 'react-router-dom';
// Import mock data for demonstration
import { mockContacts } from '@/lib/mockData';

const ContactsPage = () => {
  // Hook for programmatic navigation
  const navigate = useNavigate();
  // State to track which tab is currently active
  const [activeTab, setActiveTab] = useState<string>('list');
  
  // Handler for when user submits the add contact form
  const handleAddContact = (data: any) => {
    console.log('New contact:', data);
    // In a real app, this would add the contact to the database
    setActiveTab('list');
  };

  return (
    <PageLayout>
      <div className="space-y-6 py-4">
        {/* Tabs for switching between contacts list and add new contact form */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="list">Contacts</TabsTrigger>
            <TabsTrigger value="add">Add New</TabsTrigger>
          </TabsList>
          
          {/* Contacts list tab content */}
          <TabsContent value="list" className="mt-4">
            <ContactList contacts={mockContacts} />
          </TabsContent>
          
          {/* Add new contact form tab content */}
          <TabsContent value="add" className="mt-4">
            <ContactForm onSubmit={handleAddContact} />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default ContactsPage;
