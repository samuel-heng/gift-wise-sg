
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search, User } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  relationship: string;
}

interface ContactListProps {
  contacts: Contact[];
}

export const ContactList: React.FC<ContactListProps> = ({ contacts }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(
    contact => contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {filteredContacts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No contacts found</p>
        </div>
      )}
      
      <div className="divide-y">
        {filteredContacts.map((contact) => (
          <Link
            key={contact.id}
            to={`/contact/${contact.id}`}
            className="flex items-center py-3 px-2 hover:bg-gift-bg/50 transition-colors rounded-md"
          >
            <div className="h-10 w-10 rounded-full bg-gift-purple/20 flex items-center justify-center mr-3">
              <User className="h-5 w-5 text-gift-purple" />
            </div>
            <div>
              <p className="font-medium">{contact.name}</p>
              <p className="text-sm text-muted-foreground">{contact.relationship}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
