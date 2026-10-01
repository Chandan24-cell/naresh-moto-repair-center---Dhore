import { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import { Language } from '../data/translations';
import type { Theme } from '../App';

const spring = { type: 'spring' as const, stiffness: 400, damping: 17 };

interface BookingCalendarPickerProps {
  selectedDate: string;
  selectedTimeSlot: string;
  onSelectDate: (date: string) => void;
  onSelectTimeSlot: (slot: string) => void;
  lang?: Language;
  theme?: Theme;
}

export default function BookingCalendarPicker({
  selectedDate,
  selectedTimeSlot,
  onSelectDate,
  onSelectTimeSlot,
  lang = 'en',
  theme = 'dark'
}: BookingCalendarPickerProps) {
  const isDark = theme === 'dark';
  const isNp = lang === 'np';
  const prefersReducedMotion = useReducedMotion() ?? false;

  // Offer today and the following 30 days so the picker never includes past dates.
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i <= 30; i++) {
      const bookingDate = new Date();
      bookingDate.setDate(today.getDate() + i);
      const isoString = bookingDate.toISOString().split('T')[0];
      const dayName = bookingDate.toLocaleDateString(isNp ? 'ne-NP' : 'en-US', { weekday: 'short' });
      const dayNum = bookingDate.getDate();
      const monthName = bookingDate.toLocaleDateString(isNp ? 'ne-NP' : 'en-US', { month: 'short' });
      dates.push({ iso: isoString, dayName, dayNum, monthName, isToday: i === 0 });
    }
    return dates;
  }, [isNp]);

  // Standard hours: 6:00 AM to 8:00 PM (14 slots)
  const timeSlots = [
    { time: '06:00 AM', label: isNp ? 'बिहानी' : 'Early Dawn' },
    { time: '07:00 AM', label: isNp ? 'बिहानी' : 'Morning Slot' },
    { time: '08:00 AM', label: isNp ? 'बिहानी' : 'Morning Slot' },
    { time: '09:00 AM', label: isNp ? 'व्यस्त समय' : 'Commute Rush' },
    { time: '10:00 AM', label: isNp ? 'दिउँसो पूर्व' : 'Mid-Morning' },
    { time: '11:00 AM', label: isNp ? 'दिउँसो' : 'Midday' },
    { time: '12:00 PM', label: isNp ? 'मध्याह्न' : 'Noon' },
    { time: '01:00 PM', label: isNp ? 'दिउँसो' : 'Afternoon' },
    { time: '02:00 PM', label: isNp ? 'दिउँसो' : 'Afternoon' },
    { time: '03:00 PM', label: isNp ? 'दिउँसो' : 'Post-Lunch' },
    { time: '04:00 PM', label: isNp ? 'साँझपख' : 'Late Afternoon' },
    { time: '05:00 PM', label: isNp ? 'साँझ' : 'Evening' },
    { time: '06:00 PM', label: isNp ? 'साँझको भीड' : 'Evening Rush' },
    { time: '07:00 PM', label: isNp ? 'अन्तिम स्लट' : 'Last Service Bay' }
  ];

  // Keep unavailable slots disabled in the picker.
  const isSlotBooked = (date: string, time: string) => {
    const dayNumber = new Date(date).getDate();
    if (dayNumber % 2 === 1 && (time === '09:00 AM' || time === '05:00 PM')) {
      return true;
    }
    return false;
  };

  const labelClass = isDark ? 'text-neutral-300' : 'text-neutral-700';

  return (
    <div className={`space-y-4 ${isDark ? 'dark' : ''}`}>
      {/* Date Carousel */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${labelClass}`}>
          <CalendarIcon className="w-3.5 h-3.5 text-accent-text" />
          <span>{isNp ? '१. सेवा मिति चयन गर्नुहोस् (७ दिन खुला):' : '1. Select Service Date (Open 7 Days):'}</span>
        </label>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {availableDates.map((item) => {
            const isSelected = selectedDate === item.iso;

            return (
              <motion.button
                key={item.iso}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectDate(item.iso)}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                transition={spring}
                className={`p-2 rounded-xl border text-center cursor-pointer flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? 'bg-[#ff3b19] border-[#ff3b19] text-white dark:bg-[#ff3b19] dark:border-[#ff3b19] dark:text-white shadow-md shadow-[#ff3b19]/30 font-bold'
                    : 'bg-white border-black/10 text-black hover:bg-neutral-100 dark:bg-black dark:border-white/10 dark:text-white dark:hover:bg-neutral-900'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{item.dayName}</span>
                <span className="text-sm font-bold font-mono-numbers mt-0.5">{item.dayNum}</span>
                <span className="text-[9px] opacity-75">{item.monthName}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Time Slot Picker */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 flex items-center justify-between ${labelClass}`}>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{isNp ? '२. पुग्ने समय स्लट छान्नुहोस् (६:०० बिहान – ८:०० बेलुका):' : '2. Select Arrival Time Slot (6:00 AM – 8:00 PM):'}</span>
          </span>
          <span className="text-[10px] font-normal opacity-75">{isNp ? '१ घण्टा स्लट' : '1 hr bay slots'}</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1" data-lenis-prevent>
          {timeSlots.map((slot) => {
            const booked = isSlotBooked(selectedDate || availableDates[0].iso, slot.time);
            const isSelected = selectedTimeSlot === slot.time;

            return (
              <motion.button
                key={slot.time}
                type="button"
                disabled={booked}
                aria-pressed={isSelected}
                onClick={() => onSelectTimeSlot(slot.time)}
                whileHover={booked || prefersReducedMotion ? undefined : { scale: 1.05 }}
                whileTap={booked || prefersReducedMotion ? undefined : { scale: 0.95 }}
                transition={spring}
                className={`py-2 px-2.5 rounded-lg border text-xs text-left flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  booked
                    ? 'bg-neutral-100 text-neutral-400 border border-black/5 cursor-not-allowed dark:bg-neutral-900 dark:text-neutral-500 dark:border-white/5'
                    : isSelected
                    ? 'bg-[#ff3b19] border-[#ff3b19] text-white dark:bg-[#ff3b19] dark:border-[#ff3b19] dark:text-white font-bold shadow-md shadow-[#ff3b19]/30'
                    : 'bg-white border-black/10 text-black hover:bg-neutral-100 dark:bg-black dark:border-white/10 dark:text-white dark:hover:bg-neutral-900'
                }`}
              >
                <div>
                  <div className="font-mono-numbers font-semibold">{slot.time}</div>
                  <div className="text-[10px] opacity-75">{booked ? (isNp ? 'सकियो' : 'Fully Booked') : slot.label}</div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
