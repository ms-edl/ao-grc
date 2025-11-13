/**
 * Combobox Component
 * 
 * A searchable select component combining Command + Popover
 * styled like AoBtnFilter with metric/device selection capabilities.
 * 
 * @example
 * ```tsx
 * <Combobox
 *   options={[
 *     { value: "wifi", label: "Wi-Fi" },
 *     { value: "ethernet", label: "Ethernet" }
 *   ]}
 *   value="wifi"
 *   onChange={(value) => console.log(value)}
 *   placeholder="Select option..."
 *   emptyMessage="No options found."
 * />
 * ```
 */

import * as React from "react";
import { Icon } from "./icons";
import { cn } from "../../src/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

export interface ComboboxOption {
  value: string;
  label: string;
  icon?: string;
}

export interface ComboboxProps {
  /**
   * Available options
   */
  options: ComboboxOption[];
  /**
   * Currently selected value
   */
  value?: string;
  /**
   * Change handler
   */
  onChange?: (value: string) => void;
  /**
   * Placeholder text when no value is selected
   */
  placeholder?: string;
  /**
   * Message to show when no options match search
   */
  emptyMessage?: string;
  /**
   * Optional icon name for the trigger button
   */
  triggerIcon?: string;
  /**
   * Optional className for the trigger button
   */
  className?: string;
  /**
   * Optional disabled state
   */
  disabled?: boolean;
}

export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Select option...",
      emptyMessage = "No options found.",
      triggerIcon,
      className,
      disabled = false,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    const selectedOption = options.find((option) => option.value === value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "inline-flex items-center justify-center rounded-lg",
              "button-gradient-border",
              "transition-colors duration-200 ease-in-out",
              "text-content-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
            style={{
              height: "32px",
              paddingLeft: "8px",
              paddingRight: "8px",
              gap: "4px",
            }}
          >
            {triggerIcon && (
              <Icon name={triggerIcon} size={14} color="currentColor" />
            )}
            {selectedOption?.icon && (
              <Icon name={selectedOption.icon} size={14} color="currentColor" />
            )}
            <span className="ui-12-book text-content-primary">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <Icon name="chevron-down" size={12} color="currentColor" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[200px] p-0"
          align="start"
          style={{
            backgroundColor: "rgb(var(--surface-overlay))",
          }}
        >
          <Command>
            <CommandInput
              placeholder="Search..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onChange?.(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      setSearchValue("");
                    }}
                    className="hover:bg-surface-action-hover"
                  >
                    {option.icon && (
                      <Icon
                        name={option.icon}
                        size={14}
                        color="currentColor"
                        className="mr-2"
                      />
                    )}
                    <span className="flex-1">{option.label}</span>
                    {value === option.value && (
                      <Icon name="check" size={14} color="currentColor" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

Combobox.displayName = "Combobox";

