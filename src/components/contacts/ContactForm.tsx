import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Zod schema for validating contact form fields
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
  phone: z.string().regex(/^(8|9)\d{7}$/, { message: "Enter a valid SG phone (8 digits, starts with 8 or 9)" }).optional().or(z.literal('')),
  relationship: z.string().min(1, { message: "Relationship is required" }),
  birthday: z.date().optional(),
  preferences: z.string().optional(),
  notes: z.string().optional(),
});

// Type for form values inferred from schema
type FormValues = z.infer<typeof formSchema>;

interface ContactFormProps {
  initialValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  isEditing?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({ 
  initialValues,
  onSubmit,
  isEditing = false
}) => {
  // Initialize react-hook-form with zod validation and default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || '',
      email: initialValues?.email || '',
      phone: initialValues?.phone || '',
      relationship: initialValues?.relationship || '',
      birthday: initialValues?.birthday,
      preferences: initialValues?.preferences || '',
      notes: initialValues?.notes || '',
    },
  });

  // Add state for calendar popover open/close
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Handles form submission, calls parent onSubmit, resets if adding
  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
    if (!isEditing) {
      form.reset();
    }
    toast.success(isEditing ? 'Contact updated!' : 'Contact added!');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Name field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone field */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="8-digit SG phone (8xxxxxxx or 9xxxxxxx)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Relationship field (dropdown) */}
        <FormField
          control={form.control}
          name="relationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="colleague">Colleague</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Birthday field (calendar popover) */}
        <FormField
          control={form.control}
          name="birthday"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Birthday</FormLabel>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value instanceof Date ? field.value : (field.value ? new Date(field.value) : undefined)}
                    onSelect={date => {
                      field.onChange(date instanceof Date && !isNaN(date) ? date : undefined);
                      if (date) setCalendarOpen(false);
                    }}
                    disabled={date => date > new Date()}
                    initialFocus
                    captionLayout="dropdown"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                    defaultMonth={field.value instanceof Date ? field.value : (field.value ? new Date(field.value) : undefined)}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preferences field (textarea) */}
        <FormField
          control={form.control}
          name="preferences"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gift Preferences</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="E.g., likes books, photography, wine, tech gadgets..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes field (textarea) */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any other details to remember..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit button */}
        <Button type="submit" className="w-full">
          {isEditing ? 'Update Contact' : 'Add Contact'}
        </Button>
      </form>
    </Form>
  );
};
