
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ContactForm } from '@/components/contacts/ContactForm';
import { PurchaseHistory } from '@/components/history/PurchaseHistory';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockContacts, mockPurchaseData } from '@/lib/mockData';

const ContactDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Find the contact by ID
  const contact = mockContacts.find(c => c.id === id);
  
  if (!contact) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-40">
          <p>Contact not found</p>
          <Button variant="link" onClick={() => navigate('/contacts')}>
            Back to Contacts
          </Button>
        </div>
      </PageLayout>
    );
  }

  const handleUpdateContact = (data: any) => {
    console.log('Updated contact:', data);
    // In a real app, this would update the contact in the database
  };

  return (
    <PageLayout>
      <div className="space-y-6 py-4">
        <Button 
          variant="ghost" 
          className="p-0 mb-4 flex items-center text-muted-foreground"
          onClick={() => navigate('/contacts')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Contacts
        </Button>
        
        <h2 className="text-xl font-medium">{contact.name}</h2>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">Gift History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4">
            <ContactForm 
              initialValues={{
                name: contact.name,
                relationship: contact.relationship,
                // Add other fields as needed
              }} 
              onSubmit={handleUpdateContact}
              isEditing={true}
            />
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            <PurchaseHistory 
              purchases={mockPurchaseData} 
              filterContactId={id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default ContactDetailPage;
