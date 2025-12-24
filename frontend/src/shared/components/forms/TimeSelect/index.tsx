import { Select } from '@mantine/core';
import type { ComboboxItem, SelectProps } from '@mantine/core';
import { forwardRef, useCallback, useMemo } from 'react';

interface TimeOption {
  value: string;
  label: string;
}

// Generate time options in 15-minute intervals
const generateTimeOptions = (): TimeOption[] => {
  const options: TimeOption[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const hour12 =
        hour === 0 ? 12
        : hour > 12 ? hour - 12
        : hour;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const time12 = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;

      options.push({
        value: time24,
        label: time12,
      });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

interface TimeSelectProps extends Omit<SelectProps, 'data' | 'value' | 'onChange'> {
  value?: string | null;
  onChange?: (value: string | null) => void;
}

export const TimeSelect = forwardRef<HTMLInputElement, TimeSelectProps>(function TimeSelectInner(
  {
    label,
    placeholder = 'Select time',
    error,
    required = false,
    disabled = false,
    value,
    onChange,
    onBlur,
    classNames,
    ...props
  },
  ref,
) {
  // Wrap onChange to match Mantine's Select signature
  const handleChange = useCallback(
    (newValue: string | null, _option: ComboboxItem) => {
      onChange?.(newValue);
    },
    [onChange],
  );

  // Find the closest time option if value is provided but not in 15-min intervals
  const normalizedValue = useMemo(() => {
    if (!value) return value;

    // If value is already in our options, use it
    if (timeOptions.some((opt) => opt.value === value)) {
      return value;
    }

    // Otherwise, round to nearest 15 minutes
    const parts = value.split(':').map(Number);
    const hours = parts[0];
    const minutes = parts[1];
    if (hours === undefined || minutes === undefined || isNaN(hours) || isNaN(minutes))
      return value;

    const roundedMinutes = Math.round(minutes / 15) * 15;
    const adjustedHours = roundedMinutes === 60 ? hours + 1 : hours;
    const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;

    return `${adjustedHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
  }, [value]);

  return (
    <Select
      ref={ref}
      label={label}
      placeholder={placeholder}
      data={timeOptions}
      value={normalizedValue ?? null}
      onChange={handleChange}
      onBlur={onBlur}
      error={error}
      required={required}
      disabled={disabled}
      searchable
      clearable
      maxDropdownHeight={280}
      {...(classNames ? { classNames } : {})}
      comboboxProps={{
        position: 'bottom',
        middlewares: { flip: true, shift: true },
        offset: 5,
        withinPortal: true,
      }}
      styles={{
        dropdown: {
          maxHeight: '280px',
        },
        input: {
          fontSize: '16px',
        },
      }}
      {...props}
    />
  );
});

TimeSelect.displayName = 'TimeSelect';
