"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import "react-day-picker/dist/style.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold",
        nav: "space-x-1 flex items-center",
        nav_button:
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-gray-600 dark:text-gray-300",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-xs text-gray-500 dark:text-gray-400 rounded-md w-9 font-normal",
        row: "flex w-full mt-1",
        cell: "relative p-0 text-center text-xs focus-within:relative focus-within:z-20",
        day: "h-9 w-9 p-0 text-xs font-normal aria-selected:opacity-100",
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700",
        day_today:
          "border border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-200",
        day_outside: "text-gray-300 dark:text-gray-600",
        day_disabled: "text-gray-300 opacity-50 dark:text-gray-600",
        day_range_middle:
          "aria-selected:bg-blue-50 aria-selected:text-gray-900 dark:aria-selected:bg-blue-900/30 dark:aria-selected:text-blue-100",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === 'left') {
            return <ChevronLeft className="h-4 w-4" {...props} />;
          }
          return <ChevronRight className="h-4 w-4" {...props} />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

