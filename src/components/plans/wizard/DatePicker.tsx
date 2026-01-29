import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, normalizeDateToMidnight } from "@/lib/utils";

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Date picker component that only allows selecting Mondays
 */
export function DatePicker({ value, onChange, disabled, error }: DatePickerProps) {
  // Function to disable all days except Mondays
  const disableNonMondays = (date: Date) => {
    return date.getDay() !== 1; // 1 = Monday
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            error && "border-destructive"
          )}
          disabled={disabled}
          aria-invalid={!!error}
        >
          <CalendarIcon className="size-4" />
          {value ? format(value, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={(date) => {
            const normalizedDate = normalizeDateToMidnight(date);
            return disableNonMondays(normalizedDate);
          }}
          weekStartsOn={1}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
