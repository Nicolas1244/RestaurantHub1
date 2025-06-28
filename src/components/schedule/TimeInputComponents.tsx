import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, X } from 'lucide-react';
import { TimeInputType } from '../../types';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  type: TimeInputType;
  options?: string[];
  compact?: boolean;
  responsive?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// CRITICAL: Enhanced Visual Time Picker Component with FULL hour visibility and NO auto-suggestions
const VisualTimePicker: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
  responsive?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}> = ({ value, onChange, disabled, placeholder, compact = false, responsive = 'lg' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(value ? parseInt(value.split(':')[0]) : -1); // CRITICAL: -1 means no selection
  const [selectedMinute, setSelectedMinute] = useState(value ? parseInt(value.split(':')[1]) : -1); // CRITICAL: -1 means no selection
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // CRITICAL: Update internal state when value changes externally
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      setSelectedHour(hours);
      setSelectedMinute(minutes);
    } else {
      setSelectedHour(-1);
      setSelectedMinute(-1);
    }
  }, [value]);

  // CRITICAL: ONLY update when BOTH hour and minute are selected - NO auto-suggestions
  const handleTimeSelect = (hour: number, minute: number) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    
    // CRITICAL: Only call onChange when BOTH values are explicitly selected
    if (hour >= 0 && minute >= 0) {
      const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      onChange(formattedTime);
      setIsOpen(false);
    }
  };

  // CRITICAL: Reset function to clear the time value
  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSelectedHour(-1);
    setSelectedMinute(-1);
    setIsOpen(false);
  };

  // CRITICAL: Enhanced hour range from 6 AM to 2 AM next day (06:00 to 02:00)
  const hours = [
    6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2
  ];

  // CRITICAL: 5-minute intervals for minutes
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // CRITICAL: Comprehensive responsive sizing
  const getResponsiveClasses = () => {
    switch (responsive) {
      case 'xs':
        return {
          buttonWidth: 'w-12',
          buttonHeight: 'h-5',
          textSize: 'text-xs',
          iconSize: 8,
          resetSize: 6,
          popupWidth: 'min-w-[200px]',
          popupPadding: 'p-2',
          titleSize: 'text-sm',
          labelSize: 'text-xs',
          itemSize: 'text-xs',
          maxHeight: 'max-h-24'
        };
      case 'sm':
        return {
          buttonWidth: 'w-14',
          buttonHeight: 'h-6',
          textSize: 'text-xs',
          iconSize: 10,
          resetSize: 8,
          popupWidth: 'min-w-[220px]',
          popupPadding: 'p-3',
          titleSize: 'text-sm',
          labelSize: 'text-xs',
          itemSize: 'text-xs',
          maxHeight: 'max-h-28'
        };
      case 'md':
        return {
          buttonWidth: compact ? 'w-16' : 'w-18',
          buttonHeight: compact ? 'h-6' : 'h-7',
          textSize: 'text-xs',
          iconSize: compact ? 10 : 11,
          resetSize: compact ? 8 : 10,
          popupWidth: compact ? 'min-w-[240px]' : 'min-w-[260px]',
          popupPadding: 'p-3',
          titleSize: 'text-base',
          labelSize: 'text-xs',
          itemSize: 'text-xs',
          maxHeight: compact ? 'max-h-32' : 'max-h-36'
        };
      case 'lg':
        return {
          buttonWidth: compact ? 'w-16' : 'w-20',
          buttonHeight: compact ? 'h-6' : 'h-8',
          textSize: compact ? 'text-xs' : 'text-sm',
          iconSize: compact ? 10 : 12,
          resetSize: compact ? 10 : 12,
          popupWidth: compact ? 'min-w-[260px]' : 'min-w-[300px]',
          popupPadding: 'p-4',
          titleSize: compact ? 'text-base' : 'text-lg',
          labelSize: compact ? 'text-xs' : 'text-sm',
          itemSize: compact ? 'text-xs' : 'text-sm',
          maxHeight: compact ? 'max-h-36' : 'max-h-40'
        };
      case 'xl':
      default:
        return {
          buttonWidth: compact ? 'w-18' : 'w-22',
          buttonHeight: compact ? 'h-7' : 'h-9',
          textSize: compact ? 'text-sm' : 'text-base',
          iconSize: compact ? 12 : 14,
          resetSize: compact ? 12 : 14,
          popupWidth: compact ? 'min-w-[280px]' : 'min-w-[320px]',
          popupPadding: 'p-4',
          titleSize: compact ? 'text-lg' : 'text-xl',
          labelSize: compact ? 'text-sm' : 'text-base',
          itemSize: compact ? 'text-sm' : 'text-base',
          maxHeight: compact ? 'max-h-40' : 'max-h-44'
        };
    }
  };

  const classes = getResponsiveClasses();

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`${classes.buttonWidth} ${classes.buttonHeight} ${classes.textSize} p-1 border rounded disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between pr-6`}
        >
          <span className="truncate">{value || placeholder}</span>
          <Clock size={classes.iconSize} className="text-gray-400 flex-shrink-0" />
        </button>

        {/* CRITICAL: Reset symbol positioned on the right */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleReset}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors"
            title="Effacer l'heure"
          >
            <X size={classes.resetSize} />
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <div className={`absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg ${classes.popupPadding} ${classes.popupWidth}`}>
          {/* CRITICAL: Display current selection or prompt */}
          <div className="text-center mb-3">
            <div className={`font-semibold text-gray-800 ${classes.titleSize}`}>
              {selectedHour >= 0 && selectedMinute >= 0 
                ? `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`
                : 'Sélectionnez l\'heure'
              }
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* CRITICAL: Hours - FULL RANGE VISIBLE from 6 AM to 2 AM */}
            <div>
              <div className={`font-medium text-gray-700 mb-2 text-center ${classes.labelSize}`}>Heures</div>
              <div className={`overflow-y-auto border rounded ${classes.maxHeight}`}>
                {hours.map(hour => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleTimeSelect(hour, selectedMinute)}
                    className={`w-full px-3 py-1 ${classes.itemSize} hover:bg-blue-50 transition-colors ${
                      selectedHour === hour ? 'bg-blue-100 text-blue-700 font-medium' : ''
                    }`}
                  >
                    {hour.toString().padStart(2, '0')}h
                  </button>
                ))}
              </div>
            </div>

            {/* CRITICAL: Minutes - 5-minute intervals */}
            <div>
              <div className={`font-medium text-gray-700 mb-2 text-center ${classes.labelSize}`}>Minutes</div>
              <div className={`overflow-y-auto border rounded ${classes.maxHeight}`}>
                {minutes.map(minute => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleTimeSelect(selectedHour, minute)}
                    className={`w-full px-3 py-1 ${classes.itemSize} hover:bg-blue-50 transition-colors ${
                      selectedMinute === minute ? 'bg-blue-100 text-blue-700 font-medium' : ''
                    }`}
                  >
                    {minute.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CRITICAL: Instructions */}
          <div className="mt-3 text-center">
            <p className={`text-gray-500 ${classes.labelSize}`}>
              Sélectionnez d'abord l'heure, puis les minutes
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// CRITICAL: Enhanced Direct Text Input Component with NO auto-suggestions
const DirectTextInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
  responsive?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}> = ({ value, onChange, disabled, placeholder, compact = false, responsive = 'lg' }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/[^\d:]/g, ''); // Only allow digits and colon
    
    // Auto-format as user types
    if (inputValue.length === 2 && !inputValue.includes(':')) {
      inputValue += ':';
    }
    
    // Limit to HH:MM format
    if (inputValue.length > 5) {
      inputValue = inputValue.substring(0, 5);
    }
    
    setLocalValue(inputValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // CRITICAL: Validate against 6 AM to 2 AM range
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (timeRegex.test(localValue)) {
      const [hours, minutes] = localValue.split(':').map(Number);
      
      // CRITICAL: Validate hour range (6-23, 0-2)
      const isValidHour = (hours >= 6 && hours <= 23) || (hours >= 0 && hours <= 2);
      
      if (isValidHour) {
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        setLocalValue(formattedTime);
        onChange(formattedTime);
      } else {
        // Invalid hour range
        setLocalValue(value);
        if (localValue !== '') {
          alert('Heure invalide. Veuillez entrer une heure entre 06:00 et 02:00.');
        }
      }
    } else if (localValue === '') {
      onChange('');
    } else {
      // Invalid format
      setLocalValue(value);
      if (localValue !== '') {
        alert('Format invalide. Veuillez utiliser le format HH:MM (ex: 14:30).');
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  // CRITICAL: Reset function
  const handleReset = () => {
    setLocalValue('');
    onChange('');
  };

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // CRITICAL: Responsive sizing with reset button accommodation
  const getResponsiveClasses = () => {
    switch (responsive) {
      case 'xs':
        return {
          inputWidth: 'w-full min-w-[48px] max-w-[60px]',
          inputHeight: 'h-5',
          textSize: 'text-xs',
          padding: 'px-1 py-0.5 pr-5',
          borderRadius: 'rounded',
          focusRing: 'focus:ring-1',
          resetSize: 6
        };
      case 'sm':
        return {
          inputWidth: 'w-full min-w-[56px] max-w-[72px]',
          inputHeight: 'h-6',
          textSize: 'text-xs',
          padding: 'px-1.5 py-1 pr-6',
          borderRadius: 'rounded',
          focusRing: 'focus:ring-1',
          resetSize: 8
        };
      case 'md':
        return {
          inputWidth: compact 
            ? 'w-full min-w-[64px] max-w-[80px]' 
            : 'w-full min-w-[72px] max-w-[88px]',
          inputHeight: compact ? 'h-6' : 'h-7',
          textSize: 'text-xs',
          padding: compact ? 'px-2 py-1 pr-6' : 'px-2 py-1.5 pr-7',
          borderRadius: 'rounded-md',
          focusRing: 'focus:ring-2',
          resetSize: compact ? 8 : 10
        };
      case 'lg':
        return {
          inputWidth: compact 
            ? 'w-full min-w-[72px] max-w-[88px]' 
            : 'w-full min-w-[80px] max-w-[96px]',
          inputHeight: compact ? 'h-6' : 'h-8',
          textSize: compact ? 'text-xs' : 'text-sm',
          padding: compact ? 'px-2 py-1 pr-7' : 'px-2.5 py-1.5 pr-8',
          borderRadius: 'rounded-md',
          focusRing: 'focus:ring-2',
          resetSize: compact ? 10 : 12
        };
      case 'xl':
      default:
        return {
          inputWidth: compact 
            ? 'w-full min-w-[80px] max-w-[96px]' 
            : 'w-full min-w-[88px] max-w-[104px]',
          inputHeight: compact ? 'h-7' : 'h-9',
          textSize: compact ? 'text-sm' : 'text-base',
          padding: compact ? 'px-2.5 py-1.5 pr-8' : 'px-3 py-2 pr-9',
          borderRadius: 'rounded-md',
          focusRing: 'focus:ring-2',
          resetSize: compact ? 12 : 14
        };
    }
  };

  const classes = getResponsiveClasses();

  return (
    <div className="relative">
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          ${classes.inputWidth} 
          ${classes.inputHeight} 
          ${classes.textSize} 
          ${classes.padding}
          ${classes.borderRadius}
          border 
          border-gray-300 
          text-center
          font-mono
          transition-all
          duration-200
          disabled:bg-gray-100 
          disabled:text-gray-500 
          disabled:cursor-not-allowed
          focus:outline-none 
          ${classes.focusRing}
          focus:ring-blue-500 
          focus:border-blue-500
          hover:border-gray-400
          ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          ${disabled ? 'bg-gray-100' : 'bg-white'}
        `}
        maxLength={5}
        title="Format: HH:MM (06:00 à 02:00)"
        style={{
          WebkitAppearance: 'none',
          MozAppearance: 'textfield',
        }}
      />
      
      {/* CRITICAL: Reset symbol for text input */}
      {value && !disabled && (
        <button
          type="button"
          onClick={handleReset}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors"
          title="Effacer l'heure"
        >
          <X size={classes.resetSize} />
        </button>
      )}
      
      {/* Visual feedback for focus state */}
      {isFocused && !disabled && (
        <div className="absolute -inset-0.5 bg-blue-500 rounded-md opacity-20 pointer-events-none transition-opacity duration-200" />
      )}
    </div>
  );
};

// CRITICAL: Enhanced Dropdown Selection Component with full hour range and 5-minute intervals
const DropdownSelection: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  options: string[];
  compact?: boolean;
  responsive?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}> = ({ value, onChange, disabled, placeholder, options, compact = false, responsive = 'lg' }) => {
  
  // CRITICAL: Generate enhanced time options from 6 AM to 2 AM with 5-minute intervals
  const generateEnhancedTimeOptions = (): string[] => {
    const timeOptions: string[] = [];
    
    // CRITICAL: Hours from 6 AM to 2 AM next day (06:00 to 02:00)
    const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2];
    
    // CRITICAL: 5-minute intervals: 00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
    const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    
    hours.forEach(hour => {
      minutes.forEach(minute => {
        timeOptions.push(
          `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        );
      });
    });
    
    return timeOptions;
  };

  // Use enhanced options if no custom options provided
  const timeOptions = options.length > 0 ? options : generateEnhancedTimeOptions();

  // CRITICAL: Reset function
  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // CRITICAL: Comprehensive responsive sizing with reset button accommodation
  const getResponsiveClasses = () => {
    switch (responsive) {
      case 'xs':
        return {
          selectWidth: 'w-full min-w-[48px] max-w-[60px]',
          selectHeight: 'h-5',
          textSize: 'text-xs',
          padding: 'px-1 py-0.5 pr-5',
          resetSize: 6
        };
      case 'sm':
        return {
          selectWidth: 'w-full min-w-[56px] max-w-[72px]',
          selectHeight: 'h-6',
          textSize: 'text-xs',
          padding: 'px-1.5 py-1 pr-6',
          resetSize: 8
        };
      case 'md':
        return {
          selectWidth: compact 
            ? 'w-full min-w-[64px] max-w-[80px]' 
            : 'w-full min-w-[72px] max-w-[88px]',
          selectHeight: compact ? 'h-6' : 'h-7',
          textSize: 'text-xs',
          padding: compact ? 'px-2 py-1 pr-6' : 'px-2 py-1.5 pr-7',
          resetSize: compact ? 8 : 10
        };
      case 'lg':
        return {
          selectWidth: compact 
            ? 'w-full min-w-[72px] max-w-[88px]' 
            : 'w-full min-w-[80px] max-w-[96px]',
          selectHeight: compact ? 'h-6' : 'h-8',
          textSize: compact ? 'text-xs' : 'text-sm',
          padding: compact ? 'px-2 py-1 pr-7' : 'px-2.5 py-1.5 pr-8',
          resetSize: compact ? 10 : 12
        };
      case 'xl':
      default:
        return {
          selectWidth: compact 
            ? 'w-full min-w-[80px] max-w-[96px]' 
            : 'w-full min-w-[88px] max-w-[104px]',
          selectHeight: compact ? 'h-7' : 'h-9',
          textSize: compact ? 'text-sm' : 'text-base',
          padding: compact ? 'px-2.5 py-1.5 pr-8' : 'px-3 py-2 pr-9',
          resetSize: compact ? 12 : 14
        };
    }
  };

  const classes = getResponsiveClasses();

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          ${classes.selectWidth} 
          ${classes.selectHeight} 
          ${classes.textSize} 
          ${classes.padding}
          border 
          border-gray-300
          rounded-md
          text-center
          transition-all
          duration-200
          disabled:bg-gray-100 
          disabled:text-gray-500 
          disabled:cursor-not-allowed
          focus:outline-none 
          focus:ring-2 
          focus:ring-blue-500 
          focus:border-blue-500
          hover:border-gray-400
          ${disabled ? 'bg-gray-100' : 'bg-white'}
          appearance-none
        `}
        style={{ 
          minHeight: classes.selectHeight,
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
        }}
        title="Sélectionnez une heure (06:00 à 02:00)"
      >
        <option value="">{placeholder}</option>
        {timeOptions.map(time => (
          <option key={time} value={time}>{time}</option>
        ))}
      </select>

      {/* CRITICAL: Reset symbol for dropdown */}
      {value && !disabled && (
        <button
          type="button"
          onClick={handleReset}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors z-10"
          title="Effacer l'heure"
        >
          <X size={classes.resetSize} />
        </button>
      )}
    </div>
  );
};

// CRITICAL: Main Time Input Component with Enhanced Features and NO auto-suggestions
const TimeInput: React.FC<TimeInputProps> = ({ 
  value, 
  onChange, 
  disabled, 
  placeholder, 
  type, 
  options = [],
  compact = false,
  responsive = 'lg'
}) => {
  switch (type) {
    case 'timePicker':
      return (
        <VisualTimePicker
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          compact={compact}
          responsive={responsive}
        />
      );
    
    case 'textInput':
      return (
        <DirectTextInput
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          compact={compact}
          responsive={responsive}
        />
      );
    
    case 'dropdown':
    default:
      return (
        <DropdownSelection
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          options={options}
          compact={compact}
          responsive={responsive}
        />
      );
  }
};

export default TimeInput;