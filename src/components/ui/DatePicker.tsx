import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  className?: string;
}

function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Sélectionner une date",
  required = false,
  min,
  max,
  className = ""
}: DatePickerProps) {
  // Crée une date locale à partir d'une chaîne YYYY-MM-DD sans décalage de fuseau horaire
  const createLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Formatage de la date en YYYY-MM-DD sans décalage de fuseau horaire
  const formatDateToISOString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? createLocalDate(value) : null
  );
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const date = createLocalDate(value);
      setSelectedDate(date);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      setInputValue(formatInputDate(date));
    } else {
      setInputValue('');
    }
  }, [value]);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const formatInputDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR');
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const parseInputDate = (input: string): Date | null => {
    // Support multiple formats: DD/MM/YYYY, DD/MM/YY, DD/MM, DD-MM-YYYY, etc.
    const cleanInput = input.replace(/[^\d]/g, '');
    
    if (cleanInput.length >= 4) {
      let day, month, year;
      
      if (cleanInput.length === 4) {
        // DDMM format
        day = parseInt(cleanInput.substring(0, 2));
        month = parseInt(cleanInput.substring(2, 4));
        year = new Date().getFullYear();
      } else if (cleanInput.length === 6) {
        // DDMMYY format
        day = parseInt(cleanInput.substring(0, 2));
        month = parseInt(cleanInput.substring(2, 4));
        year = parseInt(cleanInput.substring(4, 6));
        year = year < 50 ? 2000 + year : 1900 + year; // Assume 00-49 is 2000-2049, 50-99 is 1950-1999
      } else if (cleanInput.length === 8) {
        // DDMMYYYY format
        day = parseInt(cleanInput.substring(0, 2));
        month = parseInt(cleanInput.substring(2, 4));
        year = parseInt(cleanInput.substring(4, 8));
      } else {
        return null;
      }

      // Validate date
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
        const date = new Date(year, month - 1, day);
        // Check if the date is valid (handles invalid dates like 31/02)
        if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
          return date;
        }
      }
    }
    
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setInputValue(input);

    // Try to parse the date as user types
    const parsedDate = parseInputDate(input);
    if (parsedDate) {
      setSelectedDate(parsedDate);
      const dateStr = formatDateToISOString(parsedDate);
      onChange(dateStr);
      setCurrentMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    if (selectedDate) {
      setInputValue(formatInputDate(selectedDate));
    } else if (inputValue) {
      // Try one more time to parse
      const parsedDate = parseInputDate(inputValue);
      if (parsedDate) {
        setSelectedDate(parsedDate);
        const dateStr = formatDateToISOString(parsedDate);
        onChange(dateStr);
        setInputValue(formatInputDate(parsedDate));
      } else {
        setInputValue('');
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(selectedDate ? formatInputDate(selectedDate) : '');
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateDisabled = (date: Date) => {
    const dateStr = formatDateToISOString(date);
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    
    setSelectedDate(date);
    const dateStr = formatDateToISOString(date);
    onChange(dateStr);
    setInputValue(formatInputDate(date));
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    handleDateSelect(today);
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="relative">
      {/* Input Field */}
      <div className="relative">
        {isEditing ? (
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              placeholder="JJ/MM/AAAA"
              className={`w-full pl-11 pr-12 py-3 bg-primary-50 border border-accent rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 ${className}`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-400 hover:text-accent transition-colors duration-200"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full px-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 cursor-pointer flex items-center justify-between hover:border-accent ${className}`}
          >
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-primary-400" />
              <span className={selectedDate ? 'text-primary-800' : 'text-primary-400'}>
                {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className="text-primary-400 hover:text-accent transition-colors duration-200 p-1"
                title="Saisir manuellement"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <ChevronRight className={`w-4 h-4 text-primary-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
            </div>
          </div>
        )}
      </div>

      {/* Calendar Dropdown */}
      {isOpen && !isEditing && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Calendar */}
          <div className="absolute top-full left-0 mt-2 bg-white border border-primary-200 rounded-xl shadow-2xl z-20 p-4 w-80 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-primary-100 rounded-lg transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4 text-primary-600" />
              </button>
              
              <h3 className="text-lg font-semibold text-primary-800">
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-primary-100 rounded-lg transition-colors duration-200"
              >
                <ChevronRight className="w-4 h-4 text-primary-600" />
              </button>
            </div>

            {/* Quick Navigation */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <button
                type="button"
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-accent bg-opacity-10 text-accent hover:bg-accent hover:text-white rounded-lg transition-all duration-200"
              >
                Aujourd'hui
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setIsOpen(false);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className="px-3 py-1 text-sm bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg transition-all duration-200 flex items-center space-x-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Saisir</span>
              </button>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-primary-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="h-10" />;
                }

                const isSelected = selectedDate && 
                  day.getDate() === selectedDate.getDate() &&
                  day.getMonth() === selectedDate.getMonth() &&
                  day.getFullYear() === selectedDate.getFullYear();

                const isToday = 
                  day.getDate() === new Date().getDate() &&
                  day.getMonth() === new Date().getMonth() &&
                  day.getFullYear() === new Date().getFullYear();

                const isDisabled = isDateDisabled(day);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    disabled={isDisabled}
                    className={`h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                      isSelected
                        ? 'bg-accent text-white shadow-lg'
                        : isToday
                        ? 'bg-accent bg-opacity-10 text-accent border border-accent'
                        : isDisabled
                        ? 'text-primary-300 cursor-not-allowed'
                        : 'text-primary-700 hover:bg-primary-100'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Help Text */}
            <div className="mt-4 pt-4 border-t border-primary-200">
              <p className="text-xs text-primary-600 text-center">
                💡 Astuce : Cliquez sur "Saisir" ou l'icône ✏️ pour taper directement la date
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DatePicker;