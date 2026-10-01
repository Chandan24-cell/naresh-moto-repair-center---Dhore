import { useEffect, useState } from 'react';
import { BUSINESS_INFO } from '../data/siteData';

interface HoursOverride {
  enabled: boolean;
  isClosedToday: boolean;
  notice: string;
  startDate: string;
  endDate: string;
  openTime: string;
  closeTime: string;
  active: boolean;
}

// Use Kathmandu time so opening hours don't depend on the visitor's device zone.
function getNepalNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: Number(values.hour) * 60 + Number(values.minute)
  };
}

// Put configured HH:mm times on the same scale as the current local time.
function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function useBusinessHours() {
  const [override, setOverride] = useState<HoursOverride | null>(null);
  const [now, setNow] = useState(() => getNepalNow());

  useEffect(() => {
    // Refresh the override alongside the clock because special hours can change during the day.
    let active = true;
    const refresh = () => fetch('/api/public/data')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (active && data?.hoursOverride) setOverride(data.hoursOverride); })
      .catch(() => undefined);
    refresh();
    const refreshId = window.setInterval(() => {
      setNow(getNepalNow());
      refresh();
    }, 30000);
    return () => {
      active = false;
      window.clearInterval(refreshId);
    };
  }, []);

  const today = override?.active && override.startDate <= now.date && override.endDate >= now.date;
  const isOpenNow = today
    ? !override.isClosedToday && now.minutes >= timeToMinutes(override.openTime) && now.minutes < timeToMinutes(override.closeTime)
    : now.minutes >= BUSINESS_INFO.openingTime * 60 && now.minutes < BUSINESS_INFO.closingTime * 60;
  const hoursText = today
    ? override.isClosedToday ? 'Closed' : `${override.openTime} – ${override.closeTime}`
    : '6:00 AM – 8:00 PM';

  return {
    isOpenNow,
    hoursText,
    notice: today ? override.notice : '',
    overrideActive: Boolean(today),
    scheduleText: today ? override.notice || (override.isClosedToday ? 'Temporary closure' : 'Special hours') : 'Open 7 Days (Sun – Sat)'
  };
}
