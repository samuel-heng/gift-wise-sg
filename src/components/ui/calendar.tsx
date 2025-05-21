import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, useNavigation } from "react-day-picker";
import { useState } from 'react';

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function CustomCaption({ displayMonth, fromYear, toYear }) {
  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();
  const [openDropdown, setOpenDropdown] = useState<'month' | 'year' | null>(null);
  const years = [];
  for (let y = fromYear; y <= toYear; y++) years.push(y);
  const { goToMonth } = useNavigation();

  return (
    <div className="flex items-center gap-6 justify-center">
      <div className="relative mr-2">
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-accent focus:outline-none"
          onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
        >
          {months[month]}
        </button>
        {openDropdown === 'month' && (
          <div
            className="absolute left-0 z-20 bg-white border rounded shadow mt-1 h-48 overflow-y-auto min-w-[120px] pointer-events-auto"
            onWheel={e => e.stopPropagation()}
          >
            {months.map((m, idx) => (
              <div
                key={m}
                className={`px-3 py-1 cursor-pointer hover:bg-accent ${idx === month ? 'bg-primary text-white font-bold' : ''}`}
                onClick={() => {
                  setOpenDropdown(null);
                  goToMonth(new Date(year, idx, 1));
                }}
              >
                {m}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="relative ml-2">
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-accent focus:outline-none"
          onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}
        >
          {year}
        </button>
        {openDropdown === 'year' && (
          <div
            className="absolute right-0 z-20 bg-white border rounded shadow mt-1 h-48 overflow-y-auto min-w-[80px] pointer-events-auto"
            onWheel={e => e.stopPropagation()}
          >
            {years.map((y) => (
              <div
                key={y}
                className={`px-3 py-1 cursor-pointer hover:bg-accent ${y === year ? 'bg-primary text-white font-bold' : ''}`}
                onClick={() => {
                  setOpenDropdown(null);
                  goToMonth(new Date(y, month, 1));
                }}
              >
                {y}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  fromYear = 1920,
  toYear = new Date().getFullYear(),
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected: "bg-primary text-white font-bold",
        day_range_end: "bg-primary text-white font-bold",
        day_range_middle: "bg-primary text-white font-bold",
        day_today: "",
        day_outside:
          "day-outside text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        Caption: (captionProps) => (
          <CustomCaption
            displayMonth={captionProps.displayMonth}
            fromYear={fromYear}
            toYear={toYear}
          />
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
