import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, BarChart3, Bell, CalendarDays, Check, LogOut, Plus, Settings2, Trash2, Wrench } from 'lucide-react';
import { PRICING_TIERS, TEAM_MEMBERS, DEFAULT_CATALOG_SERVICES, EXPANDED_SERVICES, type TeamMember, type CatalogService } from '../data/siteData';
import { WORKSHOP_GALLERY } from '../data/workshopGallery';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';
import type { AnnouncementItem } from './TopAnnouncementBar';
import AdminLoginModal from './AdminLoginModal';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { supabase } from '../utils/supabase';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  standalone?: boolean;
  lang?: Language;
  theme?: Theme;
}

type PricingOverride = {
  priceNPR?: number;
  nameEn?: string;
  nameNp?: string;
  descriptionEn?: string;
  descriptionNp?: string;
  popular?: boolean;
  active?: boolean;
};

type RowFeedback = { status: 'saving' | 'saved' | 'error'; message?: string };

type QueueData = { bikesAhead: number; estimatedWaitMinutes: number; customMessage: string; isVisible: boolean };
type HoursData = { enabled: boolean; isClosedToday: boolean; notice: string; startDate: string; endDate: string; openTime: string; closeTime: string };
type AdminBooking = { id: string; referenceId?: string; customerName?: string; name: string; phone: string; bikeNumber?: string; bikeNo?: string; bikeModel: string; serviceType: string; date: string; timeSlot: string; notes?: string; adminNote?: string; createdAt?: string; status: string };
type AdminReview = { id: string; author: string; location: string; bikeModel: string; rating: number; comment: string; status: string };
type GalleryItem = { id: string; category: string; src: string; titleEn: string; titleNp: string; captionEn: string; captionNp: string };
type SiteImageSlot = { key: string; label: string; src: string };

const SITE_IMAGE_SLOTS: SiteImageSlot[] = [
  { key: 'before-after-before', label: 'Before/After · Before', src: '/images/before-after/before.png' },
  { key: 'before-after-after', label: 'Before/After · After', src: '/images/before-after/after.png' },
  { key: 'payment-qr', label: 'Payments · eSewa QR', src: '/images/esewa-qr.jpg' },
  { key: 'about-workshop', label: 'About · Workshop photo', src: '/images/workshop/gallery-21.jpg' },
  { key: 'feed-post1', label: 'Live feed · Workshop activity', src: '/images/workshop/live-feed-01.jpg' },
  { key: 'feed-post2', label: 'Live feed · Service supplies', src: '/images/workshop/live-feed-02.jpg' },
  { key: 'feed-post3', label: 'Live feed · Workshop repairs', src: '/images/workshop/live-feed-03.jpg' },
  { key: 'feed-post4', label: 'Live feed · Service area', src: '/images/workshop/live-feed-04.jpg' },
  ...EXPANDED_SERVICES.map((service) => ({
    key: service.id,
    label: `Service · ${service.title}`,
    src: service.image
  })),
  ...TEAM_MEMBERS.map((member) => ({
    key: `team-${member.id}`,
    label: `Mechanic · ${member.name}`,
    src: member.photo
  })),
  ...WORKSHOP_GALLERY.map((image) => ({
    key: image.id,
    label: `Gallery · ${image.alt}`,
    src: image.src
  }))
];

const inputClass = 'w-full min-w-0 rounded border border-[var(--border-mid)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-base)]';
const tabs = ['overview', 'queue', 'announcements', 'bookings', 'reviews', 'hours', 'pricing', 'mechanics', 'services', 'gallery', 'analytics'] as const;
type Tab = typeof tabs[number];

// Older saved profiles may omit optional fields, so normalize them before editing.
const normalizeMechanics = (items: TeamMember[]): TeamMember[] => items.map((mechanic) => ({
  ...mechanic,
  roleNp: mechanic.roleNp ?? '',
  specialtyEn: mechanic.specialtyEn ?? mechanic.specialty ?? '',
  specialtyNp: mechanic.specialtyNp ?? '',
  photo: mechanic.photo ?? '',
  experienceYears: Number.isFinite(Number(mechanic.experienceYears)) ? Number(mechanic.experienceYears) : 0,
  isFounder: mechanic.isFounder === true
}));

export default function AdminDashboardModal({
  isOpen,
  onClose,
  standalone = false,
  lang = 'en',
  theme = 'dark'
}: AdminDashboardProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [queue, setQueue] = useState<QueueData>({ bikesAhead: 2, estimatedWaitMinutes: 40, customMessage: '', isVisible: true });
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [hours, setHours] = useState<HoursData>({ enabled: false, isClosedToday: false, notice: '', startDate: '', endDate: '', openTime: '06:00', closeTime: '20:00' });
  const [pricing, setPricing] = useState<Record<string, PricingOverride>>({});
  const [mechanics, setMechanics] = useState<TeamMember[]>(TEAM_MEMBERS);
  const [services, setServices] = useState<CatalogService[]>(DEFAULT_CATALOG_SERVICES);
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>([]);
  const [siteImages, setSiteImages] = useState<Record<string, string>>({});
  const [selectedSiteImageKey, setSelectedSiteImageKey] = useState(SITE_IMAGE_SLOTS[0].key);
  const [selectedSiteImageSource, setSelectedSiteImageSource] = useState(SITE_IMAGE_SLOTS[0].src);
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newTitleNp, setNewTitleNp] = useState('');
  const [newCaptionEn, setNewCaptionEn] = useState('');
  const [newCaptionNp, setNewCaptionNp] = useState('');
  const [newGalleryFile, setNewGalleryFile] = useState<File | null>(null);
  const [savedMechanicIds, setSavedMechanicIds] = useState<Set<string>>(() => new Set(TEAM_MEMBERS.map((item) => item.id)));
  const [savedServiceIds, setSavedServiceIds] = useState<Set<string>>(() => new Set(DEFAULT_CATALOG_SERVICES.map((item) => item.id)));
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [rowFeedback, setRowFeedback] = useState<Record<string, RowFeedback>>({});
  const mechanicFiles = useRef<Record<string, HTMLInputElement | null>>({});
  const serviceFiles = useRef<Record<string, HTMLInputElement | null>>({});
  const [newEnglish, setNewEnglish] = useState('');
  const [newNepali, setNewNepali] = useState('');
  const [newAction, setNewAction] = useState<'book' | 'call' | 'whatsapp' | 'none'>('book');
  const [newIcon, setNewIcon] = useState('');
  const [announcementCreateFeedback, setAnnouncementCreateFeedback] = useState<RowFeedback | null>(null);
  const isDark = theme === 'dark';
  const t = TRANSLATIONS[lang].admin;
  const panelClass = `rounded-xl border p-5 backdrop-blur-xl ${isDark ? 'border-white/10 bg-black/80 shadow-lg shadow-black/50' : 'border-black/10 bg-white/80 shadow-sm'}`;
  const pendingBookings = bookings.filter((booking) => booking.status === 'pending');
  const managedSiteImageSlots = new Map(SITE_IMAGE_SLOTS.map((slot) => [slot.key, slot]));
  services.forEach((service) => {
    const fallback = SITE_IMAGE_SLOTS.find((slot) => slot.key === service.id)?.src || '';
    managedSiteImageSlots.set(service.id, {
      key: service.id,
      label: `Service · ${service.nameEn || service.nameNp || service.id}`,
      src: siteImages[service.id] || service.photo || fallback
    });
  });
  mechanics.forEach((mechanic) => {
    const key = `team-${mechanic.id}`;
    const fallback = SITE_IMAGE_SLOTS.find((slot) => slot.key === key)?.src || '';
    managedSiteImageSlots.set(key, {
      key,
      label: `Mechanic · ${mechanic.name || mechanic.id}`,
      src: siteImages[key] || mechanic.photo || fallback
    });
  });
  const siteImageChoices = new Map<string, string>();
  managedSiteImageSlots.forEach((slot) => {
    const assignedSource = siteImages[slot.key] || slot.src;
    if (assignedSource) siteImageChoices.set(assignedSource, slot.label);
    if (slot.src) siteImageChoices.set(slot.src, slot.label);
  });
  galleryImages.forEach((image) => siteImageChoices.set(image.src, image.titleEn));

  useEffect(() => {
    // Keep search crawlers away from the standalone management screen.
    if (!standalone) return;
    const existing = document.head.querySelector('meta[name="robots"]');
    const meta = existing || document.createElement('meta');
    meta.setAttribute('name', 'robots');
    meta.setAttribute('content', 'noindex, nofollow, noarchive');
    if (!existing) document.head.appendChild(meta);
    return () => meta.remove();
  }, [standalone]);

  // Apply only collections present in the response so existing defaults survive partial payloads.
  const applyData = (data: any) => {
    if (data.queue) setQueue({ ...data.queue, isVisible: data.queue.isVisible !== false });
    if (Array.isArray(data.announcements)) setAnnouncements(data.announcements);
    if (Array.isArray(data.bookings)) setBookings(data.bookings);
    if (Array.isArray(data.reviews)) setReviews(data.reviews);
    if (Array.isArray(data.notifications)) setNotifications(data.notifications);
    if (data.hoursOverride) setHours({
      enabled: data.hoursOverride.enabled === true,
      isClosedToday: data.hoursOverride.isClosedToday === true,
      notice: data.hoursOverride.notice || '',
      startDate: data.hoursOverride.startDate || '',
      endDate: data.hoursOverride.endDate || '',
      openTime: data.hoursOverride.openTime || '06:00',
      closeTime: data.hoursOverride.closeTime || '20:00'
    });
    if (data.pricingOverrides) setPricing(data.pricingOverrides);
    if (Array.isArray(data.mechanics)) {
      setMechanics(data.mechanics);
      setSavedMechanicIds(new Set(data.mechanics.map((item: TeamMember) => item.id)));
    }
    if (Array.isArray(data.services)) {
      setServices(data.services);
      setSavedServiceIds(new Set(data.services.map((item: CatalogService) => item.id)));
    }
    if (Array.isArray(data.gallery?.images)) setGalleryImages(data.gallery.images);
    if (data.gallery?.siteImages && typeof data.gallery.siteImages === 'object') {
      setSiteImages(data.gallery.siteImages);
      const activeSlot = managedSiteImageSlots.get(selectedSiteImageKey);
      if (activeSlot) setSelectedSiteImageSource(data.gallery.siteImages[selectedSiteImageKey] || activeSlot.src);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetchWithTimeout('/api/admin/data', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Could not load dashboard data. Please sign in again.');
      applyData(await response.json());
      setSaveError('');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const handleMarkAllRead = async () => {
    const response = await fetchWithTimeout('/api/admin/notifications/read', {
      method: 'POST',
      credentials: 'same-origin'
    }).catch(() => null);

    if (response?.ok) {
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      setShowNotifDropdown(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    // Ignore a late response if the dashboard was closed before it arrived.
    let active = true;
    fetchWithTimeout('/api/admin/data', { credentials: 'same-origin' })
      .then(async (response) => {
        if (!active || !response.ok) return;
        setAuthenticated(true);
        applyData(await response.json());
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [isOpen]);

  // Use one save path so page-level success and error feedback stay consistent.
  const requestSave = async (endpoint: string, payload: unknown) => {
    setSaveError('');
    setSaved(false);
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Save failed. Please try again.');
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
      return data;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Save failed. Please try again.');
      return null;
    }
  };

  // Track row saves separately so one busy item doesn't disable an entire table.
  const requestItem = async (key: string, endpoint: string, method: 'POST' | 'PUT' | 'DELETE', payload?: unknown) => {
    setRowFeedback((current) => ({ ...current, [key]: { status: 'saving' } }));
    try {
      const response = await fetchWithTimeout(endpoint, {
        method,
        credentials: 'same-origin',
        ...(payload === undefined ? {} : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Save failed. Please try again.');
      setRowFeedback((current) => ({ ...current, [key]: { status: 'saved', message: 'Saved' } }));
      window.setTimeout(() => setRowFeedback((current) => current[key]?.status === 'saved' ? { ...current, [key]: undefined as any } : current), 3000);
      return data;
    } catch (error) {
      setRowFeedback((current) => ({ ...current, [key]: { status: 'error', message: error instanceof Error ? error.message : 'Save failed.' } }));
      return null;
    }
  };

  const handleLogout = async () => {
    await fetchWithTimeout('/api/admin/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
    await supabase.auth.signOut();
    setAuthenticated(false);
  };

  const saveQueue = async () => {
    const data = await requestSave('/api/admin/queue', queue);
    if (data?.queue) setQueue(data.queue);
  };

  const saveHours = () => requestSave('/api/admin/hours', hours);

  const saveAnnouncement = async (item: AnnouncementItem) => {
    const data = await requestItem(`announcement:${item.id}`, `/api/admin/announcements/${encodeURIComponent(item.id)}`, 'PUT', { announcement: item });
    if (data?.announcement) setAnnouncements((items) => items.map((current) => current.id === item.id ? data.announcement : current));
  };

  const createAnnouncement = async (item: AnnouncementItem) => {
    setAnnouncementCreateFeedback({ status: 'saving' });
    try {
      const response = await fetchWithTimeout('/api/admin/announcements', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement: item })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not add announcement.');
      setAnnouncements((items) => [data.announcement, ...items]);
      setAnnouncementCreateFeedback({ status: 'saved', message: 'Announcement added.' });
      window.setTimeout(() => setAnnouncementCreateFeedback((current) => current?.status === 'saved' ? null : current), 3000);
      return true;
    } catch (error) {
      setAnnouncementCreateFeedback({ status: 'error', message: error instanceof Error ? error.message : 'Could not add announcement.' });
      return false;
    }
  };

  const deleteAnnouncement = async (item: AnnouncementItem) => {
    if (!window.confirm(`Delete this announcement?\n\n${item.textEn || item.textNp}`)) return;
    const data = await requestItem(`announcement:${item.id}`, `/api/admin/announcements/${encodeURIComponent(item.id)}`, 'DELETE');
    if (data) setAnnouncements((items) => items.filter((current) => current.id !== item.id));
  };

  const moveAnnouncement = async (item: AnnouncementItem, direction: -1 | 1) => {
    const data = await requestItem(`announcement:${item.id}`, `/api/admin/announcements/${encodeURIComponent(item.id)}/move`, 'POST', { direction });
    if (data?.announcements) {
      const drafts = new Map(announcements.map((current) => [current.id, current]));
      setAnnouncements(data.announcements.map((saved: AnnouncementItem) => ({ ...saved, ...drafts.get(saved.id) })));
    }
  };

  const savePricingItem = async (id: string) => {
    const override = pricing[id] || {};
    const isNew = !pricing[id] || pricing[id].active === false;
    const data = await requestItem(`pricing:${id}`, isNew ? '/api/admin/pricing' : `/api/admin/pricing/${encodeURIComponent(id)}`, isNew ? 'POST' : 'PUT', isNew ? { id, override } : { override });
    if (data?.override) setPricing((items) => ({ ...items, [id]: data.override }));
  };

  const deletePricingItem = async (id: string, name: string) => {
    if (!window.confirm(`Remove “${name}” from the public packages?`)) return;
    const data = await requestItem(`pricing:${id}`, `/api/admin/pricing/${encodeURIComponent(id)}`, 'DELETE');
    if (data) setPricing((items) => ({ ...items, [id]: { ...items[id], active: false } }));
  };

  const restorePricingItem = async (id: string) => {
    const data = await requestItem(`pricing:${id}`, '/api/admin/pricing', 'POST', { id, override: {} });
    if (data?.override) setPricing((items) => ({ ...items, [id]: data.override }));
  };

  const saveMechanic = async (mechanic: TeamMember) => {
    const isNew = !savedMechanicIds.has(mechanic.id);
    const savedMechanic = normalizeMechanics([mechanic])[0];
    const data = await requestItem(`mechanic:${mechanic.id}`, isNew ? '/api/admin/mechanics' : `/api/admin/mechanics/${encodeURIComponent(mechanic.id)}`, isNew ? 'POST' : 'PUT', { mechanic: savedMechanic });
    if (data?.mechanic) {
      setMechanics((items) => items.map((item) => item.id === mechanic.id ? data.mechanic : item));
      setSavedMechanicIds((items) => new Set(items).add(mechanic.id));
    }
  };

  const deleteMechanic = async (mechanic: TeamMember) => {
    if (!window.confirm(`Delete mechanic “${mechanic.name || 'New mechanic'}”?`)) return;
    if (!savedMechanicIds.has(mechanic.id)) {
      setMechanics((items) => items.filter((item) => item.id !== mechanic.id));
      return;
    }
    const data = await requestItem(`mechanic:${mechanic.id}`, `/api/admin/mechanics/${encodeURIComponent(mechanic.id)}`, 'DELETE');
    if (data) {
      setMechanics((items) => items.filter((item) => item.id !== mechanic.id));
      setSavedMechanicIds((items) => { const next = new Set(items); next.delete(mechanic.id); return next; });
    }
  };

  const saveService = async (service: CatalogService) => {
    const isNew = !savedServiceIds.has(service.id);
    const data = await requestItem(`service:${service.id}`, isNew ? '/api/admin/services' : `/api/admin/services/${encodeURIComponent(service.id)}`, isNew ? 'POST' : 'PUT', { service });
    if (data?.service) {
      setServices((items) => items.map((item) => item.id === service.id ? data.service : item));
      setSavedServiceIds((items) => new Set(items).add(service.id));
    }
  };

  const deleteService = async (service: CatalogService) => {
    if (!window.confirm(`Delete service “${service.nameEn || service.nameNp || 'New service'}”?`)) return;
    if (!savedServiceIds.has(service.id)) {
      setServices((items) => items.filter((item) => item.id !== service.id));
      return;
    }
    const data = await requestItem(`service:${service.id}`, `/api/admin/services/${encodeURIComponent(service.id)}`, 'DELETE');
    if (data) {
      setServices((items) => items.filter((item) => item.id !== service.id));
      setSavedServiceIds((items) => { const next = new Set(items); next.delete(service.id); return next; });
    }
  };

  const uploadPhoto = async (kind: 'mechanics' | 'services', id: string, file?: File) => {
    if (!file) return;
    const key = `${kind}:${id}`;
    const isSaved = kind === 'mechanics' ? savedMechanicIds.has(id) : savedServiceIds.has(id);
    if (!isSaved) {
      setRowFeedback((current) => ({ ...current, [key]: { status: 'error', message: 'Save this new record before uploading its photo.' } }));
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setRowFeedback((current) => ({ ...current, [key]: { status: 'error', message: 'Choose a JPG, PNG, or WebP image.' } })); return;
    }
    if (file.size > 5 * 1024 * 1024) { setRowFeedback((current) => ({ ...current, [key]: { status: 'error', message: 'Image must be 5 MB or smaller.' } })); return; }
    setUploading((current) => ({ ...current, [key]: true }));
    try {
      const response = await fetchWithTimeout(`/api/admin/upload/${kind}/${encodeURIComponent(id)}`, {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': file.type }, body: file
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Image upload failed.');
      if (kind === 'mechanics') {
        setMechanics((items) => items.map((m) => m.id === id ? { ...m, photo: data.photo } : m));
      } else {
        setServices((items) => items.map((s) => s.id === id ? { ...s, photo: data.photo } : s));
      }
      setRowFeedback((current) => ({ ...current, [key]: { status: 'saved', message: 'Photo updated' } }));
    } catch (error) {
      setRowFeedback((current) => ({ ...current, [key]: { status: 'error', message: error instanceof Error ? error.message : 'Image upload failed.' } }));
    } finally { setUploading((current) => ({ ...current, [key]: false })); }
  };

  const newMechanic = (): TeamMember => ({ id: `mechanic-${Date.now()}`, name: '', role: '', roleNp: '', experienceYears: 0, specialty: '', specialtyEn: '', specialtyNp: '', certifiedIn: '', photo: '', isFounder: false });
  const newService = (): CatalogService => ({ id: `service-${Date.now()}`, nameEn: '', nameNp: '', category: 'Engine', descriptionEn: '', descriptionNp: '', price: '', photo: '', active: true });

  const updateBooking = async (booking: AdminBooking) => {
    const data = await requestItem(`booking:${booking.id}`, '/api/admin/bookings/status', 'POST', {
      bookingId: booking.id,
      status: booking.status === 'pending' ? 'new' : booking.status,
      adminNote: booking.adminNote || ''
    });
    if (data?.booking) setBookings((items) => items.map((item) => item.id === booking.id ? data.booking : item));
  };

  const handleMarkBookingReviewed = async (bookingId: string) => {
    const data = await requestItem(`booking:${bookingId}`, `/api/admin/bookings/${encodeURIComponent(bookingId)}/review`, 'POST');
    if (data?.bookings) setBookings(data.bookings);
  };

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewGalleryFile(event.target.files?.[0] || null);
  };

  const handleAddGalleryItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newGalleryFile) {
      setSaveError('Choose a gallery image first.');
      return;
    }

    setSaveError('');
    setSaved(false);
    try {
      const uploadResponse = await fetchWithTimeout('/api/admin/gallery/upload', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': newGalleryFile.type },
        body: newGalleryFile
      });
      const uploadData = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok) throw new Error(uploadData.error || 'Gallery image upload failed.');

      const response = await fetchWithTimeout('/api/admin/gallery', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          src: uploadData.src,
          titleEn: newTitleEn,
          titleNp: newTitleNp,
          captionEn: newCaptionEn,
          captionNp: newCaptionNp
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not save gallery item.');
      setGalleryImages(data.gallery.images);
      setNewTitleEn('');
      setNewTitleNp('');
      setNewCaptionEn('');
      setNewCaptionNp('');
      setNewGalleryFile(null);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save gallery item.');
    }
  };

  const handleDeleteGalleryItem = async (galleryId: string) => {
    const response = await fetchWithTimeout(`/api/admin/gallery/${encodeURIComponent(galleryId)}`, { method: 'DELETE', credentials: 'same-origin' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSaveError(data.error || 'Could not delete gallery item.');
      return;
    }
    setGalleryImages(data.gallery.images);
  };

  const saveSiteImageAssignment = async () => {
    const data = await requestItem(
      `site-image:${selectedSiteImageKey}`,
      '/api/admin/gallery/assignments',
      'PUT',
      { key: selectedSiteImageKey, src: selectedSiteImageSource }
    );
    if (data?.gallery?.siteImages) {
      setSiteImages(data.gallery.siteImages);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    }
  };

  const updateReview = async (reviewId: string, action: 'approve' | 'reject' | 'delete') => {
    if (action === 'delete') {
      const review = reviews.find((item) => item.id === reviewId);
      if (!window.confirm(`Permanently delete this review${review ? ` by ${review.author}` : ''}?`)) return;
    }
    const data = await requestItem(`review:${reviewId}`, '/api/admin/reviews/action', 'POST', { reviewId, action });
    if (data?.review) {
      if (action === 'delete') setReviews((items) => items.filter((item) => item.id !== reviewId));
      else setReviews((items) => items.map((item) => item.id === reviewId ? data.review : item));
    }
  };

  const addAnnouncement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const english = newEnglish.trim();
    const nepali = newNepali.trim();
    if (!english && !nepali) return;
    const item: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      textKey: 'custom',
      textEn: english || nepali,
      textNp: nepali || english,
      actionType: newAction,
      icon: newIcon || undefined,
      isActive: true
    };
    const created = await createAnnouncement(item);
    if (created) {
      setNewEnglish('');
      setNewNepali('');
      setNewIcon('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`admin-dashboard animate-view-fade ${standalone ? 'min-h-screen bg-[var(--bg-base)] px-3 py-5 text-[var(--text-base)] sm:px-6 sm:py-8' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4'}`} onClick={standalone ? undefined : onClose}>
      {standalone && <meta name="robots" content="noindex, nofollow, noarchive" />}
      <section onClick={(event) => event.stopPropagation()} className={`${standalone ? 'mx-auto min-h-[calc(100vh-2.5rem)] max-w-7xl' : 'max-h-[92vh] max-w-5xl'} flex w-full flex-col overflow-hidden border ${isDark ? 'border-white/10 bg-[var(--bg-surface)]' : 'border-black/10 bg-white'}`}>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-bold">{t.title}</h1>
            <p className="text-xs text-[var(--text-muted)]">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="rounded border border-[var(--border-mid)] px-3 py-2 text-xs font-semibold">View live site</a>
            {authenticated && <div className="relative">
              <button
                onClick={() => setShowNotifDropdown((visible) => !visible)}
                className="relative flex cursor-pointer items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 p-2.5 text-white shadow-md transition-all hover:border-accent"
                aria-label="Admin Notifications"
              >
                <Bell className="h-5 w-5 text-amber-400" />
                {unreadCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-extrabold text-white shadow-lg animate-pulse">{unreadCount}</span>}
              </button>
              {showNotifDropdown && <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-white/15 bg-[#131622] p-4 text-xs shadow-2xl">
                <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="font-bold uppercase tracking-wider text-white">Admin Activity Alerts</span>
                  {unreadCount > 0 && <button onClick={handleMarkAllRead} className="cursor-pointer text-[11px] text-accent-text hover:underline">Mark all as read</button>}
                </div>
                <div className="max-h-64 space-y-2.5 overflow-y-auto">
                  {notifications.length === 0 ? <p className="py-4 text-center text-neutral-400">No recent notifications.</p> : notifications.map((notification) => (
                    <div key={notification.id} className={`rounded-xl border p-3 transition-all ${!notification.read ? 'border-accent/40 bg-accent/10 text-white' : 'border-white/5 bg-black/30 text-neutral-400'}`}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-bold">{notification.title}</span>
                        <span className="font-mono text-[10px] opacity-70">{new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{notification.message}</p>
                    </div>
                  ))}
                </div>
              </div>}
            </div>}
            {authenticated && <button onClick={handleLogout} className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-2 text-xs font-bold text-white"><LogOut className="h-3.5 w-3.5" />Log out</button>}
            {!standalone && <button onClick={onClose} aria-label="Close dashboard" className="rounded border border-[var(--border-mid)] px-3 py-2 text-xs">Close</button>}
          </div>
        </header>

        {!authenticated ? (
          <AdminLoginModal theme={theme} title={t.loginTitle} passwordLabel={t.passwordPlaceholder} submitLabel={t.loginBtn} onAuthenticated={() => { setAuthenticated(true); void loadDashboard(); }} />
        ) : (
          <>
            <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)] px-3 py-2">
              {tabs.map((tab) => {
                const hasUnreadNotification = notifications.some((notification) => !notification.read && ((notification.category === 'booking' && tab === 'bookings') || (notification.category === 'service' && tab === 'services')));
                return <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold capitalize ${activeTab === tab ? 'border-[#ff3b19] text-accent-text' : 'border-transparent text-[var(--text-muted)]'}`}>
                  {tab}
                  {(hasUnreadNotification || (tab === 'bookings' && pendingBookings.length > 0)) && <span className="ml-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">New</span>}
                </button>;
              })}
              <button onClick={loadDashboard} disabled={loading} className="ml-auto whitespace-nowrap px-3 py-2 text-xs text-[var(--text-muted)]">{loading ? 'Loading…' : 'Refresh'}</button>
            </nav>
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {saved && <p role="status" className="flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500"><Check className="h-4 w-4" />Changes saved.</p>}
              {saveError && <p role="alert" className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{saveError}</p>}

              {activeTab === 'overview' && <>
                <div className="mb-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-text">Workshop control</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">Welcome back</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">A clear view of today’s operation and site controls.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <button onClick={() => setActiveTab('bookings')} className={`${panelClass} group flex min-h-52 flex-col items-start text-left transition-all hover:border-accent/40`}>
                    <CalendarDays aria-hidden="true" className="mb-2 h-5 w-5 text-accent-text" />
                    <span className="block text-base font-semibold text-[var(--text-base)]">Manage Bookings</span>
                    <span className="mt-1 block text-sm leading-relaxed text-[var(--text-muted)]">Review and manage customer service bookings, appointments, and upcoming workshop visits.</span>
                    <span className="mt-auto block pt-3 text-xs font-semibold text-accent-text">{bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}</span>
                  </button>
                  <button onClick={() => setActiveTab('analytics')} className={`${panelClass} group flex min-h-52 flex-col items-start text-left transition-all hover:border-accent/40`}>
                    <BarChart3 aria-hidden="true" className="mb-2 h-5 w-5 text-accent-text" />
                    <span className="block text-base font-semibold text-[var(--text-base)]">View Analytics</span>
                    <span className="mt-1 block text-sm leading-relaxed text-[var(--text-muted)]">Monitor bookings, customer feedback, service activity, and workshop performance.</span>
                    <span className="mt-auto block pt-3 text-xs font-semibold text-accent-text">Bookings and customer feedback</span>
                  </button>
                  <button onClick={() => setActiveTab('hours')} className={`${panelClass} group flex min-h-52 flex-col items-start text-left transition-all hover:border-accent/40`}>
                    <Settings2 aria-hidden="true" className="mb-2 h-5 w-5 text-accent-text" />
                    <span className="block text-base font-semibold text-[var(--text-base)]">Site Settings</span>
                    <span className="mt-1 block text-sm leading-relaxed text-[var(--text-muted)]">Manage workshop opening hours, public notices, service availability, and website settings.</span>
                    <span className="mt-auto block pt-3 text-xs font-semibold text-accent-text">Opening hours and site controls</span>
                  </button>
                </div>
              </>}

              {activeTab === 'analytics' && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <article className={panelClass}><p className="text-xs font-medium text-[var(--text-muted)]">Total bookings</p><p className="mt-3 text-3xl font-semibold">{bookings.length}</p></article>
                <article className={panelClass}><p className="text-xs font-medium text-[var(--text-muted)]">Customer reviews</p><p className="mt-3 text-3xl font-semibold">{reviews.length}</p></article>
                <article className={panelClass}><p className="text-xs font-medium text-[var(--text-muted)]">Pending bookings</p><p className="mt-3 text-3xl font-semibold">{bookings.filter((booking) => booking.status === 'pending' || booking.status === 'new').length}</p></article>
              </div>}

              {activeTab === 'queue' && <div className={`${panelClass} max-w-xl space-y-4`}>
                <h2 className="font-bold">Live queue</h2>
                <label className="block space-y-1 text-xs">Bikes ahead<input type="number" min="0" max="100" value={queue.bikesAhead} onChange={(event) => setQueue({ ...queue, bikesAhead: Number(event.target.value) })} className={inputClass} /></label>
                <label className="block space-y-1 text-xs">Estimated wait (minutes)<input type="number" min="0" max="1440" value={queue.estimatedWaitMinutes} onChange={(event) => setQueue({ ...queue, estimatedWaitMinutes: Number(event.target.value) })} className={inputClass} /></label>
                <label className="block space-y-1 text-xs">Public note<input maxLength={160} value={queue.customMessage} onChange={(event) => setQueue({ ...queue, customMessage: event.target.value })} className={inputClass} /></label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={queue.isVisible} onChange={(event) => setQueue({ ...queue, isVisible: event.target.checked })} />Show on public site</label>
                <button onClick={saveQueue} className="rounded bg-accent px-4 py-2 text-xs font-bold text-white">Save queue</button>
              </div>}

              {activeTab === 'announcements' && <div className="space-y-4">
                <form onSubmit={addAnnouncement} className={`${panelClass} grid gap-3 md:grid-cols-2`}>
                  <h2 className="font-bold md:col-span-2">Add announcement</h2>
                  <label className="space-y-1 text-xs">English message<input maxLength={240} value={newEnglish} onChange={(event) => setNewEnglish(event.target.value)} className={inputClass} /></label>
                  <label className="space-y-1 text-xs">Nepali message<input maxLength={240} value={newNepali} onChange={(event) => setNewNepali(event.target.value)} className={inputClass} /></label>
                  <label className="space-y-1 text-xs">Link action<select value={newAction} onChange={(event) => setNewAction(event.target.value as typeof newAction)} className={inputClass}><option value="none">None</option><option value="book">Booking</option><option value="call">Call</option><option value="whatsapp">WhatsApp</option></select></label>
                  <label className="space-y-1 text-xs">Optional icon<select value={newIcon} onChange={(event) => setNewIcon(event.target.value)} className={inputClass}><option value="">Default</option><option value="wrench">Service</option><option value="star">Rating</option><option value="sun">Greeting</option><option value="phone">Urgent</option><option value="sparkles">Promo</option></select></label>
                  <button type="submit" disabled={announcementCreateFeedback?.status === 'saving'} className="inline-flex items-center justify-center gap-2 rounded bg-accent px-4 py-2 text-xs font-bold text-white disabled:opacity-50 md:col-span-2">{announcementCreateFeedback?.status === 'saving' ? 'Adding…' : <><Plus className="h-4 w-4" />Add message</>}</button>
                  {announcementCreateFeedback && <p role={announcementCreateFeedback.status === 'error' ? 'alert' : 'status'} className={`text-xs md:col-span-2 ${announcementCreateFeedback.status === 'error' ? 'text-red-500' : announcementCreateFeedback.status === 'saved' ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>{announcementCreateFeedback.message || 'Adding…'}</p>}
                </form>
                {announcements.map((item, index) => {
                  const key = `announcement:${item.id}`;
                  const feedback = rowFeedback[key];
                  return <article key={item.id} className={`${panelClass} grid gap-3 md:grid-cols-[1fr_auto]`}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="space-y-1 text-xs">English<input maxLength={240} value={item.textEn || ''} onChange={(event) => setAnnouncements((items) => items.map((current) => current.id === item.id ? { ...current, textEn: event.target.value } : current))} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Nepali<input maxLength={240} value={item.textNp || ''} onChange={(event) => setAnnouncements((items) => items.map((current) => current.id === item.id ? { ...current, textNp: event.target.value } : current))} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Action<select value={item.actionType || 'none'} onChange={(event) => setAnnouncements((items) => items.map((current) => current.id === item.id ? { ...current, actionType: event.target.value as AnnouncementItem['actionType'] } : current))} className={inputClass}><option value="none">None</option><option value="book">Booking</option><option value="call">Call</option><option value="whatsapp">WhatsApp</option></select></label>
                    <label className="space-y-1 text-xs">Icon<select value={item.icon || ''} onChange={(event) => setAnnouncements((items) => items.map((current) => current.id === item.id ? { ...current, icon: event.target.value || undefined } : current))} className={inputClass}><option value="">Default</option><option value="wrench">Service</option><option value="star">Rating</option><option value="sun">Greeting</option><option value="phone">Urgent</option><option value="sparkles">Promo</option></select></label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-stretch">
                    <button disabled={feedback?.status === 'saving' || index === 0} onClick={() => void moveAnnouncement(item, -1)} className="rounded border border-[var(--border-mid)] p-2 disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                    <button disabled={feedback?.status === 'saving' || index === announcements.length - 1} onClick={() => void moveAnnouncement(item, 1)} className="rounded border border-[var(--border-mid)] p-2 disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                    <button disabled={feedback?.status === 'saving'} onClick={() => void saveAnnouncement(item)} className="rounded bg-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{feedback?.status === 'saving' ? 'Saving…' : 'Save'}</button>
                    <button onClick={() => setAnnouncements((items) => items.map((current) => current.id === item.id ? { ...current, isActive: !current.isActive } : current))} className="rounded border border-[var(--border-mid)] px-3 py-2 text-xs">{item.isActive ? 'Turn off' : 'Turn on'}</button>
                    <button disabled={feedback?.status === 'saving'} onClick={() => void deleteAnnouncement(item)} className="rounded border border-red-500/30 p-2 text-red-500 disabled:opacity-50" aria-label="Delete announcement"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {feedback && <p role={feedback.status === 'error' ? 'alert' : 'status'} className={`text-xs md:col-span-2 ${feedback.status === 'error' ? 'text-red-500' : feedback.status === 'saved' ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>{feedback.message || (feedback.status === 'saving' ? 'Saving…' : 'Saved')}</p>}
                </article>;
                })}
              </div>}

              {activeTab === 'pricing' && <div className="space-y-3">
                <h2 className="font-bold">Service packages</h2>
                {PRICING_TIERS.filter((tier) => pricing[tier.id]?.active !== false).map((tier) => {
                  const value = pricing[tier.id] || {};
                  const key = `pricing:${tier.id}`;
                  const feedback = rowFeedback[key];
                  return <article key={tier.id} className={`${panelClass} grid gap-3 md:grid-cols-2`}>
                    <h3 className="font-semibold md:col-span-2">{tier.name}</h3>
                    <label className="space-y-1 text-xs">Price (NPR)<input type="number" min="0" max="1000000" value={value.priceNPR ?? tier.priceNPR} onChange={(event) => setPricing({ ...pricing, [tier.id]: { ...value, priceNPR: Number(event.target.value) } })} className={inputClass} /></label>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={value.popular ?? tier.popular ?? false} onChange={(event) => setPricing({ ...pricing, [tier.id]: { ...value, popular: event.target.checked } })} />Most popular</label>
                    <label className="space-y-1 text-xs">Name (EN)<input maxLength={160} value={value.nameEn || ''} onChange={(event) => setPricing({ ...pricing, [tier.id]: { ...value, nameEn: event.target.value } })} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Name (नेपाली)<input maxLength={160} value={value.nameNp || ''} onChange={(event) => setPricing({ ...pricing, [tier.id]: { ...value, nameNp: event.target.value } })} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Description (EN)<input maxLength={160} value={value.descriptionEn || ''} onChange={(event) => setPricing({ ...pricing, [tier.id]: { ...value, descriptionEn: event.target.value } })} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Description (नेपाली)<input maxLength={160} value={value.descriptionNp || ''} onChange={(event) => setPricing({ ...pricing, [tier.id]: { ...value, descriptionNp: event.target.value } })} className={inputClass} /></label>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <button disabled={feedback?.status === 'saving'} onClick={() => void savePricingItem(tier.id)} className="rounded bg-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{feedback?.status === 'saving' ? 'Saving…' : 'Save package'}</button>
                      <button disabled={feedback?.status === 'saving'} onClick={() => void deletePricingItem(tier.id, tier.name)} className="rounded border border-red-500/30 px-3 py-2 text-xs text-red-500 disabled:opacity-50">Delete package</button>
                      {feedback && <span role={feedback.status === 'error' ? 'alert' : 'status'} className={`text-xs ${feedback.status === 'error' ? 'text-red-500' : feedback.status === 'saved' ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>{feedback.message || (feedback.status === 'saving' ? 'Saving…' : 'Saved')}</span>}
                    </div>
                  </article>;
                })}
                {PRICING_TIERS.filter((tier) => pricing[tier.id]?.active === false).length > 0 && <section className={`${panelClass} space-y-2`}>
                  <h3 className="text-sm font-semibold">Removed packages</h3>
                  {PRICING_TIERS.filter((tier) => pricing[tier.id]?.active === false).map((tier) => {
                    const feedback = rowFeedback[`pricing:${tier.id}`];
                    return <div key={tier.id} className="flex flex-wrap items-center justify-between gap-3 text-sm"><span>{tier.name}</span><button disabled={feedback?.status === 'saving'} onClick={() => void restorePricingItem(tier.id)} className="rounded border border-[var(--border-mid)] px-3 py-1.5 text-xs disabled:opacity-50">{feedback?.status === 'saving' ? 'Restoring…' : 'Restore'}</button>{feedback && <span role={feedback.status === 'error' ? 'alert' : 'status'} className={`text-xs ${feedback.status === 'error' ? 'text-red-500' : feedback.status === 'saved' ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>{feedback.message || (feedback.status === 'saving' ? 'Restoring…' : 'Restored')}</span>}</div>;
                  })}
                </section>}
              </div>}

              {activeTab === 'mechanics' && <div className="space-y-4">
                <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">Meet the Certified Mechanics</h2><p className="text-xs text-[var(--text-muted)]">Profiles appear on the public site.</p></div><button onClick={() => setMechanics([...mechanics, newMechanic()])} className="inline-flex items-center gap-1 rounded bg-accent px-3 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" />Add mechanic</button></div>
                {mechanics.map((m) => {
                  const key = `mechanic:${m.id}`;
                  const feedback = rowFeedback[key];
                  const isSaved = savedMechanicIds.has(m.id);
                  return <article key={m.id} className={`${panelClass} grid gap-3 md:grid-cols-[160px_1fr]`}>
                  <div className="space-y-2"><div className="flex h-32 items-center justify-center overflow-hidden rounded border border-[var(--border-mid)] bg-[var(--bg-surface-2)]">{m.photo ? <img src={m.photo} alt={`${m.name || 'Mechanic'} current photo`} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/icon.svg'; event.currentTarget.className = 'h-10 w-10 object-contain opacity-60'; }} /> : <Wrench className="h-8 w-8 text-[var(--text-muted)]" />}</div><input ref={(el) => { mechanicFiles.current[m.id] = el; }} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { void uploadPhoto('mechanics', m.id, event.target.files?.[0]); event.currentTarget.value = ''; }} /><button onClick={() => mechanicFiles.current[m.id]?.click()} disabled={!isSaved || uploading[key]} className="w-full rounded border border-[var(--border-mid)] px-3 py-2 text-xs font-semibold disabled:opacity-60">{uploading[key] ? 'Uploading…' : isSaved ? 'Change photo' : 'Save before photo upload'}</button>{!isSaved && <span className="block text-[11px] text-[var(--text-muted)]">Save this new mechanic before uploading a photo.</span>}</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-xs">Name<input value={m.name} onChange={(e) => setMechanics(mechanics.map((x) => x.id === m.id ? { ...x, name: e.target.value } : x))} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Role (EN)<input value={m.role} onChange={(e) => setMechanics(mechanics.map((x) => x.id === m.id ? { ...x, role: e.target.value } : x))} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Role (नेपाली)<input value={m.roleNp || ''} onChange={(e) => setMechanics(mechanics.map((x) => x.id === m.id ? { ...x, roleNp: e.target.value } : x))} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Years of experience<input type="number" min="0" max="80" value={m.experienceYears} onChange={(e) => setMechanics(mechanics.map((x) => x.id === m.id ? { ...x, experienceYears: Number(e.target.value) } : x))} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Specialty / quote (EN)<textarea value={m.specialtyEn || m.specialty} onChange={(e) => setMechanics(mechanics.map((x) => x.id === m.id ? { ...x, specialtyEn: e.target.value, specialty: e.target.value } : x))} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Specialty / quote (नेपाली)<textarea value={m.specialtyNp || ''} onChange={(e) => setMechanics(mechanics.map((x) => x.id === m.id ? { ...x, specialtyNp: e.target.value } : x))} className={inputClass} /></label>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={Boolean(m.isFounder)} onChange={(e) => setMechanics(mechanics.map((x) => x.id === m.id ? { ...x, isFounder: e.target.checked } : x))} />Featured / owner card</label>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <button disabled={feedback?.status === 'saving'} onClick={() => void saveMechanic(m)} className="rounded bg-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{feedback?.status === 'saving' ? 'Saving…' : 'Save mechanic'}</button>
                      <button disabled={feedback?.status === 'saving'} onClick={() => void deleteMechanic(m)} className="rounded border border-red-500/30 px-3 py-2 text-xs text-red-500 disabled:opacity-50">Delete mechanic</button>
                      {feedback && <span role={feedback.status === 'error' ? 'alert' : 'status'} className={`text-xs ${feedback.status === 'error' ? 'text-red-500' : feedback.status === 'saved' ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>{feedback.message || (feedback.status === 'saving' ? 'Saving…' : 'Saved')}</span>}
                    </div>
                  </div>
                </article>;
                })}
              </div>}

              {activeTab === 'services' && <div className="space-y-4">
                <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">Service catalog</h2><p className="text-xs text-[var(--text-muted)]">The three curated service packages remain in Pricing.</p></div><button onClick={() => setServices([...services, newService()])} className="inline-flex items-center gap-1 rounded bg-accent px-3 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" />Add service</button></div>
                {services.map((s) => {
                  const key = `service:${s.id}`;
                  const feedback = rowFeedback[key];
                  const isSaved = savedServiceIds.has(s.id);
                  return <article key={s.id} className={`${panelClass} grid gap-3 md:grid-cols-[160px_1fr]`}>
                  <div className="space-y-2"><div className="flex h-32 items-center justify-center overflow-hidden rounded border border-[var(--border-mid)] bg-[var(--bg-surface-2)]">{s.photo ? <img src={s.photo} alt={`${s.nameEn || 'Service'} current photo`} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/icon.svg'; event.currentTarget.className = 'h-10 w-10 object-contain opacity-60'; }} /> : <Wrench className="h-8 w-8 text-[var(--text-muted)]" />}</div><input ref={(el) => { serviceFiles.current[s.id] = el; }} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { void uploadPhoto('services', s.id, event.target.files?.[0]); event.currentTarget.value = ''; }} /><button onClick={() => serviceFiles.current[s.id]?.click()} disabled={!isSaved || uploading[key]} className="w-full rounded border border-[var(--border-mid)] px-3 py-2 text-xs font-semibold disabled:opacity-60">{uploading[key] ? 'Uploading…' : isSaved ? 'Change photo' : 'Save before photo upload'}</button>{!isSaved && <span className="block text-[11px] text-[var(--text-muted)]">Save this new service before uploading a photo.</span>}</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-xs">Name (EN)<input value={s.nameEn} onChange={(e) => setServices(services.map((x) => x.id === s.id ? { ...x, nameEn: e.target.value } : x))} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Name (नेपाली)<input value={s.nameNp} onChange={(e) => setServices(services.map((x) => x.id === s.id ? { ...x, nameNp: e.target.value } : x))} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Category<input value={s.category} onChange={(e) => setServices(services.map((x) => x.id === s.id ? { ...x, category: e.target.value } : x))} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Price (NPR or range)<input value={s.price} onChange={(e) => setServices(services.map((x) => x.id === s.id ? { ...x, price: e.target.value } : x))} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Description (EN)<textarea value={s.descriptionEn} onChange={(e) => setServices(services.map((x) => x.id === s.id ? { ...x, descriptionEn: e.target.value } : x))} className={inputClass} /></label>
                    <label className="space-y-1 text-xs">Description (नेपाली)<textarea value={s.descriptionNp} onChange={(e) => setServices(services.map((x) => x.id === s.id ? { ...x, descriptionNp: e.target.value } : x))} className={inputClass} /></label>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={s.active} onChange={(e) => setServices(services.map((x) => x.id === s.id ? { ...x, active: e.target.checked } : x))} />Active on public site</label>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <button disabled={feedback?.status === 'saving'} onClick={() => void saveService(s)} className="rounded bg-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{feedback?.status === 'saving' ? 'Saving…' : 'Save service'}</button>
                      <button disabled={feedback?.status === 'saving'} onClick={() => void deleteService(s)} className="rounded border border-red-500/30 px-3 py-2 text-xs text-red-500 disabled:opacity-50">Delete service</button>
                      {feedback && <span role={feedback.status === 'error' ? 'alert' : 'status'} className={`text-xs ${feedback.status === 'error' ? 'text-red-500' : feedback.status === 'saved' ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>{feedback.message || (feedback.status === 'saving' ? 'Saving…' : 'Saved')}</span>}
                    </div>
                  </div>
                </article>;
                })}
              </div>}

              {activeTab === 'hours' && <div className={`${panelClass} max-w-xl space-y-4`}>
                <h2 className="font-bold">Opening-hours exception</h2>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={hours.enabled} onChange={(event) => setHours({ ...hours, enabled: event.target.checked })} />Enable override for selected dates</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs">Start date<input type="date" value={hours.startDate} onChange={(event) => setHours({ ...hours, startDate: event.target.value })} className={inputClass} /></label>
                  <label className="space-y-1 text-xs">End date<input type="date" value={hours.endDate} onChange={(event) => setHours({ ...hours, endDate: event.target.value })} className={inputClass} /></label>
                  <label className="space-y-1 text-xs">Opening time<input type="time" value={hours.openTime} onChange={(event) => setHours({ ...hours, openTime: event.target.value })} className={inputClass} /></label>
                  <label className="space-y-1 text-xs">Closing time<input type="time" value={hours.closeTime} onChange={(event) => setHours({ ...hours, closeTime: event.target.value })} className={inputClass} /></label>
                </div>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={hours.isClosedToday} onChange={(event) => setHours({ ...hours, isClosedToday: event.target.checked })} />Closed for this date range</label>
                <label className="block space-y-1 text-xs">Reason / public notice<input maxLength={180} value={hours.notice} onChange={(event) => setHours({ ...hours, notice: event.target.value })} className={inputClass} /></label>
                <button onClick={saveHours} className="rounded bg-accent px-4 py-2 text-xs font-bold text-white">Save hours</button>
              </div>}

              {activeTab === 'gallery' && <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-extrabold">Manage Workshop Gallery</h2>
                  <span className="text-xs text-[var(--text-muted)] font-mono">Synced with Public Gallery</span>
                </div>
                <section className={`${panelClass} space-y-3`}>
                  <div>
                    <h3 className="text-sm font-bold text-accent-text">Manage Images Used Across the Site</h3>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Choose a site image slot and assign a built-in or uploaded gallery photo.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-xs font-semibold">
                      <span>Site image</span>
                      <select
                        value={selectedSiteImageKey}
                        onChange={(event) => {
                          const nextKey = event.target.value;
                          const slot = managedSiteImageSlots.get(nextKey);
                          setSelectedSiteImageKey(nextKey);
                          setSelectedSiteImageSource(siteImages[nextKey] || slot?.src || '');
                        }}
                        className={inputClass}
                      >
                        {[...managedSiteImageSlots.values()].map((slot) => <option key={slot.key} value={slot.key}>{slot.label}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold">
                      <span>Use gallery photo</span>
                      <select value={selectedSiteImageSource} onChange={(event) => setSelectedSiteImageSource(event.target.value)} className={inputClass}>
                        {[...siteImageChoices].map(([src, label]) => <option key={src} value={src}>{label}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <img src={selectedSiteImageSource} alt="Selected site image preview" className="h-20 w-32 rounded-lg bg-black object-cover" />
                    <button type="button" onClick={() => void saveSiteImageAssignment()} className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-accent-hover">Save Site Image</button>
                  </div>
                </section>
                <form onSubmit={handleAddGalleryItem} className={`${panelClass} space-y-3`}>
                  <h3 className="text-sm font-bold text-accent-text">Add New Photo to Site Gallery</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input type="text" placeholder="Title (English)" value={newTitleEn} onChange={(event) => setNewTitleEn(event.target.value)} required className={inputClass} />
                    <input type="text" placeholder="शीर्षक (Nepali)" value={newTitleNp} onChange={(event) => setNewTitleNp(event.target.value)} className={inputClass} />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input type="text" placeholder="Caption (English)" value={newCaptionEn} onChange={(event) => setNewCaptionEn(event.target.value)} required className={inputClass} />
                    <input type="text" placeholder="विवरण (Nepali)" value={newCaptionNp} onChange={(event) => setNewCaptionNp(event.target.value)} className={inputClass} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFileSelect} className="text-xs text-[var(--text-muted)] file:mr-4 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-accent-hover cursor-pointer" />
                    <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-500 cursor-pointer">Save to Database</button>
                  </div>
                </form>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {galleryImages.map((image) => <div key={image.id} className={`${panelClass} flex flex-col justify-between`}>
                    <div>
                      <img src={image.src} alt={image.titleEn} className="mb-2 h-36 w-full rounded-xl bg-black object-cover" />
                      <h4 className="text-xs font-bold">{image.titleEn}</h4>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">{image.captionEn}</p>
                    </div>
                    <button onClick={() => void handleDeleteGalleryItem(image.id)} className="mt-3 w-full rounded-lg border border-red-600/40 bg-red-600/20 py-1.5 text-xs font-bold text-red-500 transition-all hover:bg-red-600 hover:text-white cursor-pointer">Delete from Database</button>
                  </div>)}
                </div>
                {galleryImages.length === 0 && <p className="text-sm text-[var(--text-muted)]">No gallery images yet.</p>}
              </div>}

              {activeTab === 'bookings' && <div className="space-y-3">
                <h2 className="font-bold">Bookings ({bookings.length})</h2>
                {bookings.map((booking) => {
                  const feedback = rowFeedback[`booking:${booking.id}`];
                  return <article key={booking.id} className={`${panelClass} space-y-3`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <strong>{booking.customerName || booking.name}</strong>
                      <span className="rounded border border-white/10 bg-neutral-800 px-2 py-0.5 font-mono text-[10px] text-accent-text">{booking.referenceId || 'BK-LEGACY'}</span>
                      {booking.status === 'pending' && <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">New</span>}
                    </div>
                    <span className="text-xs uppercase text-accent-text">{booking.status === 'pending' ? 'new' : booking.status}</span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">Service: {booking.serviceType}</p>
                  <p className="font-mono text-xs text-[var(--text-muted)]">Phone: {booking.phone} | <strong className="font-bold uppercase text-emerald-400">Bike No: {booking.bikeNumber || booking.bikeNo || 'N/A'}</strong></p>
                  <p className="font-mono text-xs text-[var(--text-muted)]">Slot: {booking.date} @ {booking.timeSlot}</p>
                  <span className="mt-1 block font-mono text-[10px] text-[var(--text-muted)]">Received: {new Date(booking.createdAt || Date.now()).toLocaleString()}</span>
                  <p className="text-xs text-[var(--text-muted)]">Bike: {booking.bikeModel}</p>
                  {booking.notes && <p className="text-xs">Customer note: {booking.notes}</p>}
                  {booking.status === 'pending' && <span className="inline-flex w-fit rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">New</span>}
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input maxLength={240} placeholder="Owner note" value={booking.adminNote || ''} onChange={(event) => setBookings((items) => items.map((item) => item.id === booking.id ? { ...item, adminNote: event.target.value } : item))} className={inputClass} />
                    <select value={booking.status === 'pending' ? 'new' : booking.status} onChange={(event) => setBookings((items) => items.map((item) => item.id === booking.id ? { ...item, status: event.target.value } : item))} className={inputClass}><option value="new">New</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
                  </div>
                  {booking.status === 'pending' && <button disabled={feedback?.status === 'saving'} onClick={() => void handleMarkBookingReviewed(booking.id)} className="rounded bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50">{feedback?.status === 'saving' ? 'Saving…' : 'Mark Reviewed & Clear'}</button>}
                  <button disabled={feedback?.status === 'saving'} onClick={() => void updateBooking(booking)} className="rounded bg-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{feedback?.status === 'saving' ? 'Saving…' : 'Save booking'}</button>
                  {feedback && <p role={feedback.status === 'error' ? 'alert' : 'status'} className={`text-xs ${feedback.status === 'error' ? 'text-red-500' : feedback.status === 'saved' ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>{feedback.message || (feedback.status === 'saving' ? 'Saving…' : 'Saved')}</p>}
                </article>;
                })}
                {bookings.length === 0 && <p className="text-sm text-[var(--text-muted)]">No bookings yet.</p>}
              </div>}

              {activeTab === 'reviews' && <div className="space-y-3">
                <h2 className="font-bold">Awaiting moderation</h2>
                {reviews.filter((review) => review.status === 'pending').map((review) => {
                  const feedback = rowFeedback[`review:${review.id}`];
                  return <article key={review.id} className={`${panelClass} flex flex-wrap items-center justify-between gap-3`}>
                  <div><strong>{review.author} · {review.rating}/5</strong><p className="mt-1 text-sm">{review.comment}</p><p className="text-xs text-[var(--text-muted)]">{review.location} · {review.bikeModel}</p></div>
                  <div className="flex gap-2"><button disabled={feedback?.status === 'saving'} onClick={() => void updateReview(review.id, 'approve')} className="rounded bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Approve</button><button disabled={feedback?.status === 'saving'} onClick={() => void updateReview(review.id, 'reject')} className="rounded border border-red-500/30 px-3 py-2 text-xs text-red-500 disabled:opacity-50">Reject</button><button disabled={feedback?.status === 'saving'} onClick={() => void updateReview(review.id, 'delete')} className="rounded border border-red-500/30 px-3 py-2 text-xs text-red-500 disabled:opacity-50">Delete</button></div>
                  {feedback && <p role={feedback.status === 'error' ? 'alert' : 'status'} className={`w-full text-xs ${feedback.status === 'error' ? 'text-red-500' : feedback.status === 'saved' ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>{feedback.message || (feedback.status === 'saving' ? 'Saving…' : 'Saved')}</p>}
                </article>;
                })}
                {!reviews.some((review) => review.status === 'pending') && <p className="text-sm text-[var(--text-muted)]">No reviews awaiting moderation.</p>}
              </div>}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
