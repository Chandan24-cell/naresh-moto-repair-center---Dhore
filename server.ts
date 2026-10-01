import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import sharp from 'sharp';
import { TEAM_MEMBERS, DEFAULT_CATALOG_SERVICES, PRICING_TIERS } from './src/data/siteData.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';
const serverOnly = process.argv.includes('--server-only');
const SHOP_EMAIL = 'chandan241470@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SESSION_COOKIE = 'naresh_admin_session';
const ADMIN_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const supabaseClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;


// Persistent storage path
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const LOGS_FILE = path.join(DATA_DIR, 'email-logs.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory + persisted data structures
interface BookingRecord {
  id: string;
  referenceId?: string;
  name: string;
  customerName?: string;
  phone: string;
  bikeNumber?: string;
  email?: string;
  bikeModel: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  notes?: string;
  paymentType: 'pay_at_shop' | 'online_deposit';
  depositAmountNPR?: number;
  depositTxnId?: string;
  status: 'pending' | 'new' | 'confirmed' | 'completed' | 'cancelled' | 'reviewed';
  adminNote?: string;
  createdAt: string;
}

interface ReviewRecord {
  id: string;
  author: string;
  location: string;
  bikeModel: string;
  rating: number;
  date: string;
  comment: string;
  serviceType: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
}

interface AnnouncementRecord {
  id: string;
  textEn: string;
  textNp: string;
  textKey?: 'morning' | 'afternoon' | 'evening' | 'promo' | 'liveQueue' | 'emergency' | 'custom';
  actionType?: 'book' | 'call' | 'whatsapp' | 'none';
  icon?: string;
  isActive: boolean;
}

interface AppStore {
  queue: {
    bikesAhead: number;
    estimatedWaitMinutes: number;
    statusLevel: 'low' | 'moderate' | 'busy';
    customMessage: string;
    isVisible: boolean;
    updatedAt: string;
  };
  announcements: AnnouncementRecord[];
  hoursOverride: {
    enabled: boolean;
    isClosedToday: boolean;
    notice: string;
    specialHoursText: string;
    startDate: string;
    endDate: string;
    openTime: string;
    closeTime: string;
  };
  pricingOverrides: Record<string, {
    priceNPR?: number;
    nameEn?: string;
    nameNp?: string;
    descriptionEn?: string;
    descriptionNp?: string;
    popular?: boolean;
    active?: boolean;
  }>;
  mechanics: typeof TEAM_MEMBERS;
  services: typeof DEFAULT_CATALOG_SERVICES;
  gallery: {
    splitBefore: string;
    splitAfter: string;
    siteImages: Record<string, string>;
    images: Array<{
      id: string;
      category: string;
      src: string;
      titleEn: string;
      titleNp: string;
      captionEn: string;
      captionNp: string;
    }>;
  };
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    category: 'booking' | 'gallery' | 'service' | 'settings';
    timestamp: string;
    read: boolean;
  }>;
  bookings: BookingRecord[];
  reviews: ReviewRecord[];
  referrals: Array<{ id: string; code: string; visitorPhone?: string; claimedAt: string }>;
  reminders: Array<{ id: string; name: string; contact: string; interval: string; targetDate: string; createdAt: string }>;
}

const defaultStore: AppStore = {
  queue: {
    bikesAhead: 2,
    estimatedWaitMinutes: 40,
    statusLevel: 'low',
    customMessage: 'Bays active · Fast turnaround today',
    isVisible: true,
    updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  },
  announcements: [
    {
      id: 'ann-1',
      textKey: 'promo',
      textEn: '🛠️ Free brake inspection with every General Periodic Service this week!',
      textNp: '🛠️ यस हप्ता नियमित सर्भिसिङ गराउँदा निःशुल्क ब्रेक चेकजाँच!',
      actionType: 'book',
      isActive: true
    },
    {
      id: 'ann-2',
      textKey: 'liveQueue',
      textEn: '⭐ Rated 4.5/5 by 500+ riders across Dhore & Pakahamainpur',
      textNp: '⭐ वीरगन्ज र पकहामैनपुरका ५००+ राइडरहरूद्वारा ४.५/५ रेटिङ प्राप्त',
      actionType: 'book',
      isActive: true
    },
    {
      id: 'ann-3',
      textKey: 'morning',
      textEn: '🌅 Good Morning! Early drop-offs open from 6:00 AM · Beat the workday rush',
      textNp: '🌅 शुभ प्रभात! बिहान ६:०० बजेदेखि नै वर्कशप खुला छ · समयमै बाइक सर्भिसिङ गराउनुहोस्',
      actionType: 'call',
      isActive: true
    },
    {
      id: 'ann-4',
      textKey: 'afternoon',
      textEn: '💬 Message us on WhatsApp for instant mechanical advice & spare parts check',
      textNp: '💬 तत्काल मेकानिकल सल्लाह र पार्ट्स सोधपुछको लागि ह्वाट्सएपमा म्यासेज गर्नुहोस्',
      actionType: 'whatsapp',
      isActive: true
    },
    {
      id: 'ann-5',
      textKey: 'emergency',
      textEn: '📞 Roadside Breakdown or flat tyre near Dhore? Call +977 982-9455583 immediately',
      textNp: '📞 बाटोमा बाइक बिग्रियो वा पन्चर भयो? तुरुन्त फोन गर्नुहोस्: +977 982-9455583',
      actionType: 'call',
      isActive: true
    }
  ],
  hoursOverride: {
    enabled: false,
    isClosedToday: false,
    notice: '',
    specialHoursText: '6:00 AM – 8:00 PM Every Day',
    startDate: '',
    endDate: '',
    openTime: '06:00',
    closeTime: '20:00'
  },
  pricingOverrides: {},
  mechanics: TEAM_MEMBERS,
  services: DEFAULT_CATALOG_SERVICES,
  gallery: {
    splitBefore: '/images/before-after/before.png',
    splitAfter: '/images/before-after/after.png',
    siteImages: {},
    images: [
      {
        id: 'gal-1',
        category: 'workshop',
        src: '/src/assets/images/hero_naresh_moto_1790466687055.jpg',
        titleEn: 'Active Workshop Bays',
        titleNp: 'सक्रिय वर्कशप बेहरू',
        captionEn: 'Main service area with hydraulic bike lifts and dedicated tool benches at Dhore pakahamainpur - 1, Dhore.',
        captionNp: 'हाइड्रोलिक बाइक लिफ्ट र आधुनिक औजारसहितको मुख्य मर्मत क्षेत्र (धोरे पकहामैनपुर–१, वीरगन्ज)।'
      }
    ]
  },
  notifications: [
    {
      id: 'notif-1',
      title: 'New Bay Booking',
      message: 'Ramesh Patel booked an Express Bay deposit for tomorrow.',
      category: 'booking',
      timestamp: new Date().toISOString(),
      read: false
    }
  ],
  bookings: [
    {
      id: 'BK-1001',
      name: 'Rohan Shrestha',
      phone: '+977 981-8234567',
      email: 'rohan.shrestha@example.com',
      bikeModel: 'Hero Splendor Plus BS6',
      serviceType: 'General Servicing',
      date: new Date().toISOString().split('T')[0],
      timeSlot: '08:00 AM',
      notes: 'Chain noise and oil change needed before highway trip.',
      paymentType: 'pay_at_shop',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    }
  ],
  reviews: [
    {
      id: 'rev-pending-1',
      author: 'Deepak Sah',
      location: 'Dhore Pakahamainpur',
      bikeModel: 'Bajaj Pulsar 150',
      rating: 5,
      date: 'Today',
      comment: 'Naresh Dai inspected carburetor and tuned idle smoothly. Honest pricing as always.',
      serviceType: 'Engine & Starting',
      status: 'approved',
      createdAt: new Date().toISOString()
    }
  ],
  referrals: [],
  reminders: []
};

function loadStore(): AppStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      return readStoreFile();
    }
  } catch (err) {
    console.error('Error loading store, using defaults:', err);
  }
  return defaultStore;
}

function readStoreFile(): AppStore {
  const content = fs.readFileSync(STORE_FILE, 'utf-8');
  const saved = JSON.parse(content);
  const oldPricing = saved.pricingOverrides || {};
  const pricingOverrides = Object.fromEntries(Object.entries(oldPricing).map(([id, value]) => [
    id,
    typeof value === 'number' ? { priceNPR: value } : value
  ]));
  return {
    ...defaultStore,
    ...saved,
    queue: { ...defaultStore.queue, ...saved.queue },
    hoursOverride: { ...defaultStore.hoursOverride, ...saved.hoursOverride },
      gallery: {
        ...defaultStore.gallery,
        ...(saved.gallery || {}),
        siteImages: { ...defaultStore.gallery.siteImages, ...(saved.gallery?.siteImages || {}) },
        images: Array.isArray(saved.gallery?.images) ? saved.gallery.images : defaultStore.gallery.images || []
      },
    pricingOverrides,
    mechanics: Array.isArray(saved.mechanics) ? saved.mechanics : defaultStore.mechanics,
    services: Array.isArray(saved.services) ? saved.services : defaultStore.services
  };
}

function mergeStoreData(saved: Partial<AppStore> | null | undefined): AppStore {
  if (!saved || typeof saved !== 'object') return defaultStore;
  const oldPricing = saved.pricingOverrides || {};
  const pricingOverrides = Object.fromEntries(Object.entries(oldPricing).map(([id, value]) => [
    id,
    typeof value === 'number' ? { priceNPR: value } : value
  ]));

  return {
    ...defaultStore,
    ...saved,
    queue: { ...defaultStore.queue, ...(saved.queue || {}) },
    hoursOverride: { ...defaultStore.hoursOverride, ...(saved.hoursOverride || {}) },
      gallery: {
        ...defaultStore.gallery,
        ...(saved.gallery || {}),
        siteImages: { ...defaultStore.gallery.siteImages, ...(saved.gallery?.siteImages || {}) },
        images: Array.isArray(saved.gallery?.images) ? saved.gallery.images : defaultStore.gallery.images || []
      },
    pricingOverrides,
    mechanics: Array.isArray(saved.mechanics) ? saved.mechanics : defaultStore.mechanics,
    services: Array.isArray(saved.services) ? saved.services : defaultStore.services
  };
}

async function hydrateStoreFromSupabase() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient
      .from('site_settings')
      .select('key, value')
      .eq('key', 'dashboard_store')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data?.value && typeof data.value === 'object') {
      store = mergeStoreData(data.value as Partial<AppStore>);
      if (cleanOldBookings()) saveStore(store);
      return;
    }

    const fallbackStore = readStoreFile();
    const { error: upsertError } = await supabaseClient
      .from('site_settings')
      .upsert({ key: 'dashboard_store', value: fallbackStore, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (upsertError) throw upsertError;

    store = fallbackStore;
    if (cleanOldBookings()) saveStore(store);
  } catch (error) {
    console.warn('Supabase store hydration skipped, falling back to local JSON store.', error);
  }
}

function saveStore(data: AppStore) {
  try {
    const temporaryFile = `${STORE_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(temporaryFile, STORE_FILE);
  } catch (err) {
    console.error('Error saving store:', err);
    return false;
  }

  if (supabaseClient) {
    void (async () => {
      try {
        const { error } = await supabaseClient
          .from('site_settings')
          .upsert({ key: 'dashboard_store', value: data, updated_at: new Date().toISOString() }, { onConflict: 'key' });

        if (error) {
          console.warn('Supabase store sync failed.', error);
        }
      } catch (error) {
        console.warn('Supabase store sync failed.', error);
      }
    })();
  }

  return true;
}

let store: AppStore = loadStore();

function cleanOldBookings() {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const beforeCount = store.bookings.length;
  store.bookings = store.bookings.filter((booking) => {
    const bookingTime = new Date(booking.createdAt || Date.now()).getTime();
    return bookingTime >= thirtyDaysAgo;
  });
  return store.bookings.length !== beforeCount;
}

if (cleanOldBookings()) saveStore(store);
void hydrateStoreFromSupabase();

// Email Logger / Dispatcher Simulation
function logEmailNotification(type: string, subject: string, to: string, payload: any) {
  const logEntry = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    to,
    subject,
    payload
  };

  try {
    let logs: any[] = [];
    if (fs.existsSync(LOGS_FILE)) {
      logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
    }
    logs.unshift(logEntry);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs.slice(0, 100), null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to log email:', err);
  }

  console.log(`[EMAIL DISPATCH] To: ${to} | Subject: "${subject}"`);
  console.log(`[EMAIL BODY]`, JSON.stringify(payload, null, 2));

  // NOTE: For live email sending in production, attach a transactional provider:
  // e.g. Resend, SendGrid, Mailgun, or AWS SES:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ from: 'Naresh Moto <booking@nareshmoto.np>', to, subject, html: ... });
}

// Basic security middleware
if (!isProd) {
  const developmentOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:4173',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:5173'
  ]);
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && developmentOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.vary('Origin');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
}
app.use(express.json({ limit: '1mb' }));

// HTTPS Enforcement & Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.replace(/\/+$/, '') === '/admin') {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  // Enforce HTTPS redirect in production environments
  if (isProd && req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://api.qrserver.com https://maps.google.com https://*.googleapis.com https://*.gstatic.com",
    "frame-src 'self' https://maps.google.com https://www.google.com",
    `connect-src 'self' https://api.qrserver.com https://generativelanguage.googleapis.com${!isProd ? ' ws://localhost:* ws://0.0.0.0:*' : ''}`
  ];

  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  next();
});

// Uploaded owner-managed images live outside the Vite build output, so expose
// this dedicated directory in both development and production.
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads'), { maxAge: '1d' }));

// Simple In-Memory Rate Limiting
// Bucket key = route + IP so endpoints never share a quota (e.g. chat traffic
// can no longer eat the booking quota for the same visitor).
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
let rateLimitSweepCounter = 0;
function rateLimiter(maxRequests = 15, windowSeconds = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const routeKey = `${req.baseUrl || ''}${req.route?.path || req.path}`;
    const key = `${routeKey}|${ip}`;
    const now = Date.now();

    // Periodically sweep expired entries so the map can't grow unbounded
    if (++rateLimitSweepCounter % 500 === 0) {
      for (const [k, v] of rateLimitMap) {
        if (now > v.resetTime) rateLimitMap.delete(k);
      }
    }

    const clientData = rateLimitMap.get(key);

    if (!clientData || now > clientData.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowSeconds * 1000 });
      return next();
    }

    if (clientData.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    }

    clientData.count++;
    next();
  };
}

// -------------------------------------------------------------
// PUBLIC API ROUTES
// -------------------------------------------------------------

function getNepalDate() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isHoursOverrideActive() {
  const override = store.hoursOverride;
  const today = getNepalDate();
  return override.enabled && Boolean(override.startDate && override.endDate) && override.startDate <= today && override.endDate >= today;
}

// GET Live Queue, Announcements & Hours Status
app.get('/api/queue', (req: Request, res: Response) => {
  res.json({
    queue: store.queue,
    announcements: store.announcements || defaultStore.announcements,
    hoursOverride: { ...store.hoursOverride, active: isHoursOverrideActive() }
  });
});

app.get('/api/pricing', (_req: Request, res: Response) => {
  const pricingOverrides = Object.fromEntries(Object.entries(store.pricingOverrides).filter(([, override]) => override.active !== false));
  res.json({ pricingOverrides });
});

app.get('/api/catalog', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ mechanics: store.mechanics, services: store.services.filter((service) => service.active) });
});

app.get('/api/reviews', (_req: Request, res: Response) => {
  res.json({ reviews: store.reviews.filter((review) => review.status === 'approved') });
});

app.get('/api/announcements', (req: Request, res: Response) => {
  res.json({
    announcements: store.announcements || defaultStore.announcements
  });
});

// Aggregate public data endpoint used by the site sections that reflect admin edits.
app.get('/api/public/data', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    queue: store.queue,
    announcements: store.announcements || defaultStore.announcements,
    hoursOverride: { ...store.hoursOverride, active: isHoursOverrideActive() },
    pricingOverrides: Object.fromEntries(Object.entries(store.pricingOverrides).filter(([, override]) => override.active !== false)),
    mechanics: store.mechanics,
    services: store.services.filter((service) => service.active),
    gallery: store.gallery,
    reviews: store.reviews.filter((review) => review.status === 'approved')
  });
});

// POST Create Booking
app.post('/api/public/bookings', (req: Request, res: Response, next: NextFunction) => {
  const { customerName, phone, bikeNumber, serviceType, date, timeSlot } = req.body;
  if (!customerName) return next();
  if (!customerName || !phone || !serviceType) {
    return res.status(400).json({ error: 'Missing required booking fields.' });
  }

  cleanOldBookings();

  const createdAt = new Date().toISOString();
  const newBooking: BookingRecord = {
    id: `bk-${Date.now()}`,
    referenceId: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
    name: String(customerName).trim(),
    customerName: String(customerName).trim(),
    phone: String(phone).trim(),
    bikeNumber: String(bikeNumber || 'N/A').trim(),
    bikeModel: 'Motorcycle / Scooter',
    serviceType: String(serviceType).trim(),
    date: date || new Date().toISOString().split('T')[0],
    timeSlot: timeSlot || '09:00 AM',
    paymentType: 'pay_at_shop',
    status: 'pending',
    createdAt
  };

  store.bookings.unshift(newBooking);
  store.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'New Service Booking!',
    message: `${newBooking.customerName} booked ${newBooking.serviceType} for ${newBooking.date} (${newBooking.timeSlot}).`,
    category: 'booking',
    timestamp: createdAt,
    read: false
  });

  if (saveStore(store)) {
    return res.json({ success: true, booking: newBooking });
  }
  return res.status(500).json({ error: 'Failed to save booking.' });
});

app.post(['/api/bookings', '/api/public/bookings'], rateLimiter(10, 60), (req: Request, res: Response) => {
  const {
    name,
    phone,
    bikeNumber,
    email,
    bikeModel,
    serviceType,
    date,
    timeSlot,
    notes,
    paymentType,
    depositAmountNPR,
    depositTxnId,
    honeypot
  } = req.body;

  // Honeypot check
  if (honeypot && String(honeypot).trim().length > 0) {
    console.warn('[SECURITY] Bot submission rejected via honeypot.');
    return res.status(400).json({ error: 'Submission rejected.' });
  }

  // Server-side validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Valid customer name is required (min 2 characters).' });
  }
  if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
    return res.status(400).json({ error: 'Valid contact phone number is required.' });
  }
  if (!date || !timeSlot) {
    return res.status(400).json({ error: 'Booking appointment date and time slot are required.' });
  }

  cleanOldBookings();

  const newBooking: BookingRecord = {
    id: `BK-${Date.now().toString().slice(-5)}`,
    referenceId: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
    name: name.trim().slice(0, 60),
    phone: phone.trim().slice(0, 20),
    bikeNumber: String(bikeNumber || 'N/A').trim().slice(0, 32),
    email: email ? String(email).trim().slice(0, 80) : undefined,
    bikeModel: (bikeModel || 'Motorcycle / Scooter').trim().slice(0, 50),
    serviceType: (serviceType || 'General Servicing').trim().slice(0, 50),
    date: String(date).slice(0, 10),
    timeSlot: String(timeSlot).slice(0, 10),
    notes: notes ? String(notes).trim().slice(0, 300) : '',
    paymentType: paymentType === 'online_deposit' ? 'online_deposit' : 'pay_at_shop',
    depositAmountNPR: depositAmountNPR ? Number(depositAmountNPR) : 0,
    depositTxnId: depositTxnId ? String(depositTxnId).slice(0, 40) : undefined,
    status: 'new',
    createdAt: new Date().toISOString()
  };

  store.bookings.unshift(newBooking);
  store.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'New Service Booking!',
    message: `${newBooking.name} booked ${newBooking.serviceType} for ${newBooking.date} (${newBooking.timeSlot}).`,
    category: 'booking',
    timestamp: newBooking.createdAt,
    read: false
  });
  saveStore(store);

  // 1. Dispatch notification to Shop Owner
  logEmailNotification(
    'NEW_BOOKING_ALERT',
    `[Naresh Moto Booking] New Slot Request from ${newBooking.name} (${newBooking.date} @ ${newBooking.timeSlot})`,
    SHOP_EMAIL,
    {
      bookingId: newBooking.id,
      customerName: newBooking.name,
      customerPhone: newBooking.phone,
      customerEmail: newBooking.email || 'None provided',
      bikeModel: newBooking.bikeModel,
      serviceRequested: newBooking.serviceType,
      appointmentDate: newBooking.date,
      appointmentSlot: newBooking.timeSlot,
      paymentMethod: newBooking.paymentType === 'online_deposit' ? `NPR ${newBooking.depositAmountNPR} Deposit Paid (${newBooking.depositTxnId})` : 'Pay at Workshop (NPR 0 Upfront)',
      notes: newBooking.notes,
      manageUrl: `${req.protocol}://${req.get('host')}/admin`
    }
  );

  // 2. Dispatch Auto-Reply to Customer if email was given
  if (newBooking.email) {
    logEmailNotification(
      'CUSTOMER_BOOKING_CONFIRMATION',
      `Booking Confirmed – Naresh Moto Repair Center [${newBooking.id}]`,
      newBooking.email,
      {
        message: `Namaste ${newBooking.name}, your service slot at Naresh Moto Repair Center in Dhore has been received!`,
        bookingId: newBooking.id,
        appointmentDate: newBooking.date,
        appointmentTime: newBooking.timeSlot,
        service: newBooking.serviceType,
        workshopAddress: 'Dhore pakahamainpur - 1, Dhore, Nepal (Plus Code: 2QC3+W5)',
        shopPhone: '+977 982-9455583',
        directionsUrl: 'https://www.google.com/maps/search/?api=1&query=2QC3%2BW5+Dhore+Madhesh+Province+Nepal',
        note: 'Need to change time or cancel? Simply call or WhatsApp Naresh Dai at +977 982-9455583.'
      }
    );
  }

  res.status(201).json({
    success: true,
    booking: newBooking,
    ownerNotified: SHOP_EMAIL,
    customerNotified: !!newBooking.email
  });
});

// POST Submit Review (Sent for moderation)
app.post(['/api/reviews', '/api/public/reviews'], rateLimiter(6, 60), (req: Request, res: Response) => {
  const { author, location, bikeModel, rating, comment, serviceType, honeypot } = req.body;

  if (honeypot && String(honeypot).trim().length > 0) {
    return res.status(400).json({ error: 'Rejected.' });
  }

  if (!author || typeof author !== 'string' || author.trim().length < 2) {
    return res.status(400).json({ error: 'Author name is required.' });
  }
  if (!comment || typeof comment !== 'string' || comment.trim().length < 6) {
    return res.status(400).json({ error: 'Review text must be at least 6 characters.' });
  }

  const newReview: ReviewRecord = {
    id: `rev-${Date.now()}`,
    author: author.trim().slice(0, 40),
    location: (location || 'Dhore, Nepal').trim().slice(0, 40),
    bikeModel: (bikeModel || 'Motorcycle').trim().slice(0, 40),
    rating: Math.max(1, Math.min(5, parseInt(rating, 10) || 5)),
    date: 'Today',
    comment: comment.trim().slice(0, 500),
    serviceType: (serviceType || 'General Servicing').trim().slice(0, 40),
    status: 'pending', // Requires admin moderation
    createdAt: new Date().toISOString()
  };

  store.reviews.unshift(newReview);
  saveStore(store);

  // Notify owner for moderation
  logEmailNotification(
    'NEW_REVIEW_MODERATION',
    `[Naresh Moto Review] New ${newReview.rating}-Star Feedback from ${newReview.author}`,
    SHOP_EMAIL,
    {
      reviewId: newReview.id,
      author: newReview.author,
      rating: newReview.rating,
      bikeModel: newReview.bikeModel,
      comment: newReview.comment,
      status: 'pending_moderation',
      approveUrl: `${req.protocol}://${req.get('host')}/admin`
    }
  );

  res.status(201).json({
    success: true,
    review: newReview,
    moderationNote: 'Thank you! Your review has been submitted for verification.'
  });
});

// POST Service Reminder Sign-Up
app.post('/api/reminders', rateLimiter(10, 60), (req: Request, res: Response) => {
  const { name, contact, interval, targetDate, bikeModel } = req.body;

  if (!contact || typeof contact !== 'string' || contact.trim().length < 6) {
    return res.status(400).json({ error: 'Phone or email is required for reminders.' });
  }

  const reminder = {
    id: `REM-${Date.now()}`,
    name: (name || 'Customer').trim().slice(0, 50),
    contact: contact.trim().slice(0, 60),
    interval: String(interval || '3 months'),
    targetDate: String(targetDate || ''),
    createdAt: new Date().toISOString()
  };

  store.reminders.unshift(reminder);
  saveStore(store);

  logEmailNotification(
    'SERVICE_REMINDER_LOGGED',
    `[Naresh Moto Reminder] New Scheduled Service Reminder for ${reminder.name} (${reminder.interval})`,
    SHOP_EMAIL,
    {
      customerName: reminder.name,
      contact: reminder.contact,
      interval: reminder.interval,
      targetScheduledDate: reminder.targetDate,
      note: 'Scheduled for future cron / SMS dispatch'
    }
  );

  res.json({ success: true, reminder });
});

// POST Referral Claimed
app.post('/api/referrals', rateLimiter(10, 60), (req: Request, res: Response) => {
  const { code, visitorPhone } = req.body;

  const referral = {
    id: `REF-CLAIM-${Date.now()}`,
    code: String(code || '').trim(),
    visitorPhone: visitorPhone ? String(visitorPhone).trim() : undefined,
    claimedAt: new Date().toISOString()
  };

  store.referrals.unshift(referral);
  saveStore(store);

  logEmailNotification(
    'REFERRAL_CLAIM_ALERT',
    `[Naresh Moto Referral] Customer Claimed Referral Code: ${referral.code}`,
    SHOP_EMAIL,
    referral
  );

  res.json({ success: true, discountPercent: 10 });
});

// -------------------------------------------------------------
// NARESH AI ASSISTANT (GEMINI + LIVE WORKSHOP DATA)
// -------------------------------------------------------------
function buildNareshAiContext() {
  const activePricing = Object.entries(store.pricingOverrides || {})
    .map(([id, override]) => ({ id, ...override }))
    .filter((item: any) => item.active !== false);

  return {
    business: {
      name: 'Naresh Moto Repair Center',
      masterMechanic: 'Naresh Chauhan',
      experience: '14+ years',
      phone: '+977 982-9455583',
      email: SHOP_EMAIL,
      location: 'Dhore pakahamainpur - 1, Dhore, Madhesh Province, Nepal',
      plusCode: '2QC3+W5',
      defaultHours: store.hoursOverride?.enabled
        ? store.hoursOverride.specialHoursText
        : '6:00 AM – 8:00 PM, every day',
      payments: ['Cash', 'Fonepay QR', 'eSewa', 'Khalti'],
      walkIns: true,
    },
    currentHoursOverride: store.hoursOverride,
    queue: store.queue,
    services: store.services,
    pricingOverrides: activePricing,
    mechanics: store.mechanics,
    announcements: store.announcements.filter((item) => item.isActive),
  };
}

function buildNareshAiSystemInstruction(lang: string = 'en') {
  const context = buildNareshAiContext();
  return `
You are Naresh AI, the official virtual bike assistant for Naresh Moto Repair Center in Dhore, Nepal.

Your job is to help riders with:
- motorcycle troubleshooting and safe basic checks
- service recommendations
- Naresh Moto services, prices, repair-time estimates, opening hours, contact and location
- spare-part and bike-model questions when the provided workshop data contains the answer
- booking and urgent workshop contact guidance

Important identity/style:
- Identify yourself naturally as Naresh AI when relevant.
- Be warm, practical, concise and respectful. A natural "Namaste" is welcome.
- Match the user's language where practical (English or Nepali).
- Do not pretend to be a human mechanic.

NARESH AI IDENTITY AND WEBSITE DEVELOPER:

You are Naresh AI, the personal AI shop assistant for Naresh Moto Repair Center.

You work with Naresh Moto Repair Center to help customers with:
- Motorcycle and scooter questions
- Troubleshooting and basic roadside assistance
- Services and maintenance
- Service pricing
- Spare parts and bike-related information
- Workshop timings
- Location and contact information
- Booking and general customer support

You should speak naturally as part of Naresh Moto Repair Center.
Do not present yourself as a separate unrelated AI company.

ABOUT THE WEBSITE DEVELOPER:

The Naresh Moto Repair Center website and its AI assistant were developed and managed by Chandan Kumar Sah, who is a friend of Naresh.

Developer:
Name: Chandan Kumar Sah
Department: Department of Artificial Intelligence and Machine Learning
Student: B.E. Artificial Intelligence and Machine Learning Student
College: KPR Institute of Engineering and Technology

GitHub:
https://github.com/Chandan24-cell

Portfolio:
https://chandan24-cell.github.io/My-Portfolio/

LinkedIn:
https://www.linkedin.com/in/chandan-kumar-sah-40156a360

When a customer asks:
- Who developed this website?
- Who created this website?
- Who built this website?
- Who made this website?
- Who is the developer?
- Who developed Naresh Moto website?
- Who made Naresh AI?
- Who created this AI assistant?
- Tell me about the developer
- Who is Chandan?
- What is Chandan's role?

Answer naturally and directly.

Example:

"Naresh Moto's website and AI assistant were developed by Chandan Kumar Sah, a friend of Naresh. He is a B.E. Artificial Intelligence and Machine Learning student at KPR Institute of Engineering and Technology. He built and manages the website and AI assistant to help Naresh with customer support and digital operations."

When appropriate, you may provide Chandan's GitHub, portfolio, or LinkedIn links.

Do not claim that Chandan owns Naresh Moto Repair Center.
Do not claim that Chandan is a mechanic or workshop employee unless that information is explicitly provided.
Describe him as Naresh's friend and the developer/technical person behind the website and AI assistant.

Grounding rules:
- The WORKSHOP DATA below is the source of truth for Naresh-specific business information.
- Never invent a Naresh price, spare-part stock status, phone number, opening hour, location, mechanic, service time, or policy.
- For information that is not in the workshop data, say that Naresh AI does not currently have that specific Naresh detail.
- You may use general motorcycle knowledge for troubleshooting, but clearly distinguish general guidance from Naresh-specific pricing/availability.
- Never claim a definite mechanical diagnosis from a short chat.
- For unsafe, advanced, or uncertain repairs, advise the rider to stop in a safe place and contact Naresh Moto or a qualified mechanic rather than attempting risky roadside work.
- For an urgent breakdown, provide the Naresh phone number.
- Keep answers easy to scan. Use short numbered steps when explaining troubleshooting.

User interface language preference: ${lang}.

CURRENT WORKSHOP DATA:
${JSON.stringify(context, null, 2)}
`;
}

function makeNareshFallback(message: string) {
  return {
    reply: `Namaste! This is Naresh AI from Naresh Moto Repair Center. I couldn't reach the AI service just now. For immediate assistance, call +977 982-9455583 or visit Dhore pakahamainpur - 1, Dhore.`,
    quickActions: [
      { label: 'Call +977 982-9455583', href: 'tel:+9779829455583' },
      { label: 'WhatsApp Naresh Dai', href: 'https://wa.me/9779829455583' },
      { label: `Email ${SHOP_EMAIL}`, href: `mailto:${SHOP_EMAIL}` }
    ]
  };
}

async function generateNareshAiReply(
  message: string,
  conversationHistory: any[] = [],
  lang: string = 'en'
) {
  const developerQuestion =
    /\b(who (developed|created|built|made)|who is the developer|who made naresh ai|who created this ai|tell me about the developer|who is chandan|what is chandan's role)\b/i.test(message);

  if (developerQuestion) {
    return {
      reply:
        "Naresh Moto's website and AI assistant were developed and are technically managed by Chandan Kumar Sah, a friend of Naresh. He is a B.E. Artificial Intelligence and Machine Learning student at KPR Institute of Engineering and Technology.\n\nGitHub: https://github.com/Chandan24-cell\nPortfolio: https://chandan24-cell.github.io/My-Portfolio/\nLinkedIn: https://www.linkedin.com/in/chandan-kumar-sah-40156a360",
      quickActions: [
        {
          label: 'GitHub',
          href: 'https://github.com/Chandan24-cell'
        },
        {
          label: 'Portfolio',
          href: 'https://chandan24-cell.github.io/My-Portfolio/'
        },
        {
          label: 'LinkedIn',
          href: 'https://www.linkedin.com/in/chandan-kumar-sah-40156a360'
        }
      ]
    };
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const history = Array.isArray(conversationHistory)
    ? conversationHistory
        .filter(
          (item) =>
            item &&
            (item.role === 'user' || item.role === 'model') &&
            typeof item.text === 'string'
        )
        .slice(-10)
    : [];

  const messages = [
    {
      role: 'system',
      content: buildNareshAiSystemInstruction(lang)
    },
    ...history.map((item) => ({
      role: item.role === 'model' ? 'assistant' : 'user',
      content: item.text
    })),
    {
      role: 'user',
      content: message
    }
  ];

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages,
        temperature: 0.3,
        max_completion_tokens: 700
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API ${response.status}: ${errorText}`);
  }

  const data = await response.json() as any;

  const reply = data?.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error('Groq returned an empty response');
  }

  return {
    reply,
    quickActions: [
      { label: 'Call +977 982-9455583', href: 'tel:+9779829455583' },
      { label: 'WhatsApp Naresh Dai', href: 'https://wa.me/9779829455583' },
      { label: 'View Services', href: '#pricing' }
    ]
  };
}

app.post('/api/chat', rateLimiter(20, 60), async (req: Request, res: Response) => {
  const { message, conversationHistory, lang = 'en' } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  try {
    res.json(await generateNareshAiReply(message, conversationHistory, String(lang)));
  } catch (err: any) {
    console.error('Naresh AI chat error:', err?.message || err);
    res.json(makeNareshFallback(message));
  }
});

app.post('/api/public/ai-chat', rateLimiter(20, 60), async (req: Request, res: Response) => {
  const { message, conversationHistory, lang = 'en' } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    res.json(await generateNareshAiReply(message, conversationHistory, String(lang)));
  } catch (err: any) {
    console.error('Naresh AI public chat error:', err?.message || err);
    res.json(makeNareshFallback(message));
  }
});

// -------------------------------------------------------------
// ADMIN DASHBOARD ROUTES (PASSWORD PROTECTED)
// -------------------------------------------------------------

function safeStringEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS;
  const payload = `${expiresAt}.${randomBytes(16).toString('hex')}`;
  const signature = createHmac('sha256', ADMIN_PASSWORD!).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function isValidAdminSession(token: string | undefined) {
  if (!ADMIN_PASSWORD || !token) return false;
  const [expiresAtText, nonce, signature, extra] = token.split('.');
  if (!expiresAtText || !nonce || !signature || extra) return false;
  const expiresAt = Number(expiresAtText);
  if (!Number.isInteger(expiresAt) || expiresAt <= Date.now() / 1000) return false;
  const payload = `${expiresAtText}.${nonce}`;
  const expected = createHmac('sha256', ADMIN_PASSWORD).update(payload).digest('hex');
  return safeStringEqual(signature, expected);
}

function getAdminCookie(req: Request) {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  return cookie?.slice(ADMIN_SESSION_COOKIE.length + 1);
}

function setAdminCookie(res: Response, token: string, rememberMe = false) {
  const maxAge = rememberMe ? ADMIN_SESSION_TTL_SECONDS : 60 * 60 * 8;
  res.setHeader('Set-Cookie', `${ADMIN_SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${isProd ? '; Secure' : ''}`);
}

const authCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header.' });
    }

    const token = authHeader.split(' ')[1];
    if (!supabaseClient) {
      return res.status(500).json({ error: 'Database client not configured.' });
    }

    // 1. Verify the JWT token is valid
    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
    }

    // 2. Verify the user actually has admin privileges in our table
    const { data: adminUser, error: adminError } = await supabaseClient
      .from('admin_users')
      .select('role, is_active')
      .eq('email', authData.user.email)
      .single();

    if (adminError || !adminUser || !adminUser.is_active || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden. Account does not have active admin privileges.' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

// Admin login verification (rate limited: 5 attempts / 5 min to stop brute force)
app.post('/api/admin/login', rateLimiter(5, 300), (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'Admin login is not configured. Set ADMIN_PASSWORD on the server.' });
  }

  const emailIsValid = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  if (!emailIsValid) {
    return res.status(400).json({ error: 'A valid admin email is required.' });
  }

  if (typeof password === 'string' && safeStringEqual(password, ADMIN_PASSWORD)) {
    setAdminCookie(res, createAdminSession(), Boolean(rememberMe));
    return res.json({ success: true, message: 'Admin access granted.', user: { email: email.trim(), role: 'admin', rememberMe: Boolean(rememberMe) } });
  }
  return res.status(401).json({ error: 'Incorrect admin password.' });
});

app.post('/api/admin/forgot-password', rateLimiter(3, 300), (req: Request, res: Response) => {
  const { email } = req.body;
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Enter a valid admin email address.' });
  }

  console.info(`[admin] password reset requested for ${email.trim()}`);
  res.json({ success: true, message: 'Password reset was requested. Use your configured email provider in production to send the reset link.' });
});

app.post('/api/admin/logout', (_req: Request, res: Response) => {
  // Supabase auth handles session destruction on the client side.
  res.json({ success: true });
});

// Admin get all data
app.get('/api/admin/data', authCheck, (req: Request, res: Response) => {
  res.json({
    queue: store.queue,
    announcements: store.announcements || defaultStore.announcements,
    hoursOverride: store.hoursOverride,
    pricingOverrides: store.pricingOverrides,
    mechanics: store.mechanics,
    services: store.services,
    gallery: store.gallery,
    notifications: store.notifications,
    bookings: store.bookings,
    reviews: store.reviews,
    referrals: store.referrals,
    reminders: store.reminders,
    emailNotificationTarget: SHOP_EMAIL
  });
});

app.post('/api/admin/notifications/read', authCheck, (_req: Request, res: Response) => {
  store.notifications.forEach((notification) => { notification.read = true; });
  if (saveStore(store)) {
    res.json({ success: true, notifications: store.notifications });
  } else {
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

app.post('/api/admin/bookings/:id/review', authCheck, (req: Request, res: Response) => {
  const booking = store.bookings.find((item) => item.id === req.params.id);
  if (booking) {
    booking.status = 'reviewed';
    saveStore(store);
  }
  res.json({ success: true, bookings: store.bookings });
});

function isValidRecordId(id: string) {
  return /^[a-z0-9_-]{1,64}$/i.test(id);
}

function validateMechanic(mechanic: any, expectedId?: string) {
  if (!mechanic || typeof mechanic !== 'object' || Array.isArray(mechanic)) return 'Mechanic record is required.';
  if (typeof mechanic.id !== 'string' || !isValidRecordId(mechanic.id) || (expectedId && mechanic.id !== expectedId)) return 'Mechanic ID is invalid.';
  for (const key of ['name', 'role', 'roleNp', 'specialty', 'specialtyEn', 'specialtyNp', 'certifiedIn', 'photo']) {
    if (typeof mechanic[key] !== 'string' || mechanic[key].length > 1200) return `${key} must be text of at most 1200 characters.`;
  }
  if (!mechanic.name.trim() || !mechanic.role.trim()) return 'Mechanic name and English role are required.';
  if (!Number.isInteger(mechanic.experienceYears) || mechanic.experienceYears < 0 || mechanic.experienceYears > 80) return 'Experience must be a whole number from 0 to 80.';
  if (typeof mechanic.isFounder !== 'boolean') return 'Featured status must be true or false.';
  return null;
}

function validateService(service: any, expectedId?: string) {
  if (!service || typeof service !== 'object' || Array.isArray(service)) return 'Service record is required.';
  if (typeof service.id !== 'string' || !isValidRecordId(service.id) || (expectedId && service.id !== expectedId)) return 'Service ID is invalid.';
  for (const key of ['nameEn', 'nameNp', 'category', 'descriptionEn', 'descriptionNp', 'price']) {
    if (typeof service[key] !== 'string' || service[key].length > 240) return `${key} must be text of at most 240 characters.`;
  }
  if (!service.nameEn.trim() && !service.nameNp.trim()) return 'An English or Nepali service name is required.';
  if (service.photo !== undefined && (typeof service.photo !== 'string' || service.photo.length > 500)) return 'Photo path is invalid.';
  if (typeof service.active !== 'boolean') return 'Active status must be true or false.';
  return null;
}

function removeUploadedPhoto(kind: 'mechanics' | 'services', photo: unknown) {
  if (typeof photo !== 'string' || !photo.startsWith(`/uploads/${kind}/`)) return;
  const directory = path.resolve(process.cwd(), 'public/uploads', kind);
  const file = path.resolve(process.cwd(), 'public', photo.slice(1));
  if (file.startsWith(`${directory}${path.sep}`) && fs.existsSync(file)) fs.unlinkSync(file);
}

app.post('/api/admin/mechanics', authCheck, (req: Request, res: Response) => {
  const mechanic = req.body?.mechanic;
  console.info('[admin] mechanic create request', mechanic);
  const validationError = validateMechanic(mechanic);
  if (validationError) return res.status(400).json({ error: validationError });
  if (store.mechanics.some((item) => item.id === mechanic.id)) return res.status(409).json({ error: 'A mechanic with this ID already exists.' });
  const previous = store.mechanics;
  store.mechanics = [...previous, mechanic];
  if (!saveStore(store)) { store.mechanics = previous; return res.status(500).json({ error: 'Could not save mechanic.' }); }
  res.status(201).json({ mechanic });
});

app.put('/api/admin/mechanics/:id', authCheck, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = store.mechanics.findIndex((item) => item.id === id);
  const mechanic = req.body?.mechanic;
  console.info('[admin] mechanic save request', { id, mechanic });
  const validationError = validateMechanic(mechanic, id);
  if (validationError) return res.status(400).json({ error: validationError });
  const previous = store.mechanics;
  const next = [...previous];
  if (index < 0) next.push(mechanic);
  else next[index] = mechanic;
  store.mechanics = next;
  if (!saveStore(store)) { store.mechanics = previous; return res.status(500).json({ error: 'Could not save mechanic.' }); }
  res.status(index < 0 ? 201 : 200).json({ mechanic });
});

app.delete('/api/admin/mechanics/:id', authCheck, (req: Request, res: Response) => {
  const index = store.mechanics.findIndex((item) => item.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: 'Mechanic not found.' });
  const previous = store.mechanics;
  const [deleted] = previous.slice(index, index + 1);
  store.mechanics = previous.filter((item) => item.id !== req.params.id);
  if (!saveStore(store)) { store.mechanics = previous; return res.status(500).json({ error: 'Could not delete mechanic.' }); }
  removeUploadedPhoto('mechanics', deleted.photo);
  res.json({ id: req.params.id });
});

app.post('/api/admin/services', authCheck, (req: Request, res: Response) => {
  const service = req.body?.service;
  const validationError = validateService(service);
  if (validationError) return res.status(400).json({ error: validationError });
  if (store.services.some((item) => item.id === service.id)) return res.status(409).json({ error: 'A service with this ID already exists.' });
  const previous = store.services;
  store.services = [...previous, service];
  if (!saveStore(store)) { store.services = previous; return res.status(500).json({ error: 'Could not save service.' }); }
  res.status(201).json({ service });
});

app.put('/api/admin/services/:id', authCheck, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = store.services.findIndex((item) => item.id === id);
  if (index < 0) return res.status(404).json({ error: 'Service not found. Save it as a new record first.' });
  const service = req.body?.service;
  const validationError = validateService(service, id);
  if (validationError) return res.status(400).json({ error: validationError });
  const previous = store.services;
  const next = [...previous];
  next[index] = service;
  store.services = next;
  if (!saveStore(store)) { store.services = previous; return res.status(500).json({ error: 'Could not save service.' }); }
  res.json({ service });
});

app.delete('/api/admin/services/:id', authCheck, (req: Request, res: Response) => {
  const index = store.services.findIndex((item) => item.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: 'Service not found.' });
  const previous = store.services;
  const [deleted] = previous.slice(index, index + 1);
  store.services = previous.filter((item) => item.id !== req.params.id);
  if (!saveStore(store)) { store.services = previous; return res.status(500).json({ error: 'Could not delete service.' }); }
  removeUploadedPhoto('services', deleted.photo);
  res.json({ id: req.params.id });
});

app.post('/api/admin/upload/:kind/:id', authCheck, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }), async (req: Request, res: Response) => {
  const { kind, id } = req.params;
  if (!['mechanics', 'services'].includes(kind) || !/^[a-z0-9_-]{1,64}$/i.test(id)) return res.status(400).json({ error: 'Invalid upload target.' });
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ error: 'Choose a JPG, PNG, or WebP image under 5 MB.' });
  
  const list: any[] = kind === 'mechanics' ? store.mechanics : store.services;
  const record = list.find((entry) => entry.id === id);
  if (!record) return res.status(404).json({ error: 'Record not found.' });

  if (!supabaseClient) {
    return res.status(500).json({ error: 'Supabase client not configured.' });
  }

  try {
    const image = sharp(req.body, { limitInputPixels: 40000000 });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format || '')) return res.status(400).json({ error: 'The selected file is not a supported JPG, PNG, or WebP image.' });

    // Create a unique filename inside a folder (e.g., mechanics/id-1234.webp)
    const filename = `${kind}/${id}-${Date.now()}-${randomBytes(4).toString('hex')}.webp`;

    // Compress and convert to WebP in memory
    const processedBuffer = await sharp(req.body, { limitInputPixels: 40000000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    // Upload directly to Supabase 'media' bucket
    const { error: uploadError } = await supabaseClient
      .storage
      .from('media')
      .upload(filename, processedBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Retrieve the public URL for the newly uploaded image
    const { data: { publicUrl } } = supabaseClient.storage.from('media').getPublicUrl(filename);

    const previous = record.photo;
    record.photo = publicUrl;

    if (!saveStore(store)) {
      record.photo = previous;
      // Cleanup if database save fails
      await supabaseClient.storage.from('media').remove([filename]);
      return res.status(500).json({ error: 'Image was processed but its record could not be saved.' });
    }

    // Optional: Clean up old image if it was hosted on Supabase
    if (typeof previous === 'string' && previous.includes('/storage/v1/object/public/media/')) {
      const oldPath = previous.split('/storage/v1/object/public/media/')[1];
      if (oldPath) await supabaseClient.storage.from('media').remove([oldPath]);
    }

    res.json({ photo: record.photo, record });
  } catch (error) {
    console.error('Image upload failed:', error);
    res.status(400).json({ error: 'Could not process this image. Choose a valid JPG, PNG, or WebP under 20 MB.' });
  }
});

app.post('/api/admin/gallery/upload', authCheck, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }), async (req: Request, res: Response) => {
  if (!supabaseClient) return res.status(500).json({ error: 'Supabase client not configured.' });
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ error: 'Choose a JPG, PNG, or WebP image under 5 MB.' });

  try {
    const metadata = await sharp(req.body, { limitInputPixels: 40000000 }).metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format || '')) return res.status(400).json({ error: 'The selected file is not a supported image.' });

    const filename = `gallery/${Date.now()}-${randomBytes(4).toString('hex')}.webp`;
    const processedBuffer = await sharp(req.body, { limitInputPixels: 40000000 })
      .rotate()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();
    const { error: uploadError } = await supabaseClient.storage.from('media').upload(filename, processedBuffer, { contentType: 'image/webp', upsert: true });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseClient.storage.from('media').getPublicUrl(filename);
    res.json({ src: publicUrl });
  } catch (error) {
    console.error('Gallery image upload failed:', error);
    res.status(400).json({ error: 'Could not process this gallery image.' });
  }
});

app.post('/api/admin/gallery', authCheck, (req: Request, res: Response) => {
  const { titleEn, titleNp, captionEn, captionNp, category, src } = req.body;
  if (!src) return res.status(400).json({ error: 'Image source is required.' });

  const newItem = {
    id: `gal-${Date.now()}`,
    category: category || 'workshop',
    src,
    titleEn: titleEn || 'Workshop Repair',
    titleNp: titleNp || 'वर्कशप मर्मत',
    captionEn: captionEn || 'Professional motorcycle servicing.',
    captionNp: captionNp || 'व्यावसायिक मोटरसाइकल सर्भिसिङ.'
  };

  store.gallery.images.unshift(newItem);
  if (saveStore(store)) {
    res.json({ success: true, item: newItem, gallery: store.gallery });
  } else {
    res.status(500).json({ error: 'Failed to save gallery item.' });
  }
});

app.delete('/api/admin/gallery/:id', authCheck, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = store.gallery.images.findIndex((item) => item.id === id);
  if (index !== -1) {
    store.gallery.images.splice(index, 1);
    saveStore(store);
  }
  res.json({ success: true, gallery: store.gallery });
});

app.put('/api/admin/gallery/assignments', authCheck, (req: Request, res: Response) => {
  const { key, src } = req.body || {};
  const validKey = typeof key === 'string' && /^(before-after-(before|after)|about-workshop|payment-qr|feed-post[1-4]|team-[a-z0-9-]+|service-[a-z0-9-]+|0[1-8]-[a-z0-9-]+|gallery-\d{2})$/.test(key);
  const isLocalImage = typeof src === 'string' && /^\/(images|uploads)\//.test(src);
  const isManagedImage = typeof src === 'string' && [
    ...store.gallery.images.map((image) => image.src),
    ...store.mechanics.map((mechanic) => mechanic.photo),
    ...store.services.map((service) => service.photo)
  ].includes(src);
  if (!validKey || (!isLocalImage && !isManagedImage)) {
    return res.status(400).json({ error: 'Choose a valid site image slot and gallery image.' });
  }

  const previous = store.gallery.siteImages[key];
  store.gallery.siteImages[key] = src;
  if (!saveStore(store)) {
    if (previous === undefined) delete store.gallery.siteImages[key];
    else store.gallery.siteImages[key] = previous;
    return res.status(500).json({ error: 'Could not save the site image assignment.' });
  }
  res.json({ success: true, gallery: store.gallery });
});

function validateAnnouncement(item: any, expectedId?: string) {
  const allowedActions = new Set(['book', 'call', 'whatsapp', 'none']);
  if (!item || typeof item !== 'object' || Array.isArray(item)) return 'Announcement record is required.';
  if (typeof item.id !== 'string' || !/^[a-z0-9_-]{1,80}$/i.test(item.id) || (expectedId && item.id !== expectedId)) return 'Announcement ID is invalid.';
  if (typeof item.textEn !== 'string' || item.textEn.length > 240 || typeof item.textNp !== 'string' || item.textNp.length > 240 || !(item.textEn.trim() || item.textNp.trim())) return 'Enter English or Nepali announcement text (up to 240 characters).';
  if (typeof item.isActive !== 'boolean') return 'Announcement status must be true or false.';
  if (item.actionType !== undefined && !allowedActions.has(item.actionType)) return 'Announcement action is invalid.';
  if (item.icon !== undefined && item.icon !== '' && (typeof item.icon !== 'string' || item.icon.length > 24)) return 'Announcement icon is invalid.';
  return null;
}

app.post('/api/admin/announcements', authCheck, (req: Request, res: Response) => {
  const item = req.body?.announcement;
  const validationError = validateAnnouncement(item);
  if (validationError) return res.status(400).json({ error: validationError });
  if (store.announcements.length >= 40) return res.status(400).json({ error: 'Announcement limit reached.' });
  if (store.announcements.some((entry) => entry.id === item.id)) return res.status(409).json({ error: 'Announcement already exists.' });
  const previous = store.announcements;
  store.announcements = [item, ...previous];
  if (!saveStore(store)) { store.announcements = previous; return res.status(500).json({ error: 'Could not save announcement.' }); }
  res.status(201).json({ announcement: item });
});

app.put('/api/admin/announcements/:id', authCheck, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = store.announcements.findIndex((item) => item.id === id);
  if (index < 0) return res.status(404).json({ error: 'Announcement not found.' });
  const item = req.body?.announcement;
  const validationError = validateAnnouncement(item, id);
  if (validationError) return res.status(400).json({ error: validationError });
  const previous = store.announcements;
  const next = [...previous];
  next[index] = item;
  store.announcements = next;
  if (!saveStore(store)) { store.announcements = previous; return res.status(500).json({ error: 'Could not save announcement.' }); }
  res.json({ announcement: item });
});

app.delete('/api/admin/announcements/:id', authCheck, (req: Request, res: Response) => {
  const previous = store.announcements;
  if (!previous.some((item) => item.id === req.params.id)) return res.status(404).json({ error: 'Announcement not found.' });
  store.announcements = previous.filter((item) => item.id !== req.params.id);
  if (!saveStore(store)) { store.announcements = previous; return res.status(500).json({ error: 'Could not delete announcement.' }); }
  res.json({ id: req.params.id });
});

app.post('/api/admin/announcements/:id/move', authCheck, (req: Request, res: Response) => {
  const direction = req.body?.direction;
  const index = store.announcements.findIndex((item) => item.id === req.params.id);
  const target = index + direction;
  if (![-1, 1].includes(direction) || index < 0 || target < 0 || target >= store.announcements.length) return res.status(400).json({ error: 'Announcement move is invalid.' });
  const previous = store.announcements;
  const next = [...previous];
  [next[index], next[target]] = [next[target], next[index]];
  store.announcements = next;
  if (!saveStore(store)) { store.announcements = previous; return res.status(500).json({ error: 'Could not reorder announcement.' }); }
  res.json({ announcements: store.announcements });
});

// Admin update live queue
app.post('/api/admin/queue', authCheck, (req: Request, res: Response) => {
  const { bikesAhead, estimatedWaitMinutes, customMessage, isVisible } = req.body;
  if (!Number.isInteger(bikesAhead) || bikesAhead < 0 || bikesAhead > 100 ||
      !Number.isInteger(estimatedWaitMinutes) || estimatedWaitMinutes < 0 || estimatedWaitMinutes > 1440 ||
      typeof customMessage !== 'string' || customMessage.length > 160 || typeof isVisible !== 'boolean') {
    return res.status(400).json({ error: 'Queue values are invalid.' });
  }

  const previous = store.queue;
  store.queue = {
    bikesAhead,
    estimatedWaitMinutes,
    statusLevel: bikesAhead > 5 ? 'busy' : bikesAhead > 2 ? 'moderate' : 'low',
    customMessage: customMessage.trim(),
    isVisible,
    updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };

  if (!saveStore(store)) {
    store.queue = previous;
    return res.status(500).json({ error: 'Could not save queue status.' });
  }
  res.json({ success: true, queue: store.queue });
});

// Admin update hours override
app.post('/api/admin/hours', authCheck, (req: Request, res: Response) => {
  const { enabled, isClosedToday, notice, startDate, endDate, openTime, closeTime } = req.body;
  const validTime = (value: unknown) => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  const validDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (typeof enabled !== 'boolean' || typeof isClosedToday !== 'boolean' || typeof notice !== 'string' || notice.length > 180 ||
      (enabled && (!validDate(startDate) || !validDate(endDate) || startDate > endDate)) ||
      (!isClosedToday && enabled && (!validTime(openTime) || !validTime(closeTime) || openTime >= closeTime))) {
    return res.status(400).json({ error: 'Hours override values are invalid.' });
  }

  const previous = store.hoursOverride;
  store.hoursOverride = {
    enabled,
    isClosedToday,
    notice: notice.trim(),
    specialHoursText: isClosedToday ? 'Closed' : `${openTime}–${closeTime}`,
    startDate: enabled ? startDate : '',
    endDate: enabled ? endDate : '',
    openTime: validTime(openTime) ? openTime : '06:00',
    closeTime: validTime(closeTime) ? closeTime : '20:00'
  };

  if (!saveStore(store)) {
    store.hoursOverride = previous;
    return res.status(500).json({ error: 'Could not save hours override.' });
  }
  res.json({ success: true, hoursOverride: store.hoursOverride });
});

// Admin update review status (Approve / Reject)
app.post('/api/admin/reviews/action', authCheck, (req: Request, res: Response) => {
  const { reviewId, action } = req.body;
  if (typeof reviewId !== 'string' || !['approve', 'reject', 'delete'].includes(action)) {
    return res.status(400).json({ error: 'Review action is invalid.' });
  }
  const index = store.reviews.findIndex((review) => review.id === reviewId);
  if (index < 0) {
    return res.status(404).json({ error: 'Review not found.' });
  }
  const previous = store.reviews;
  const review = previous[index];
  let resultReview = review;
  if (action === 'delete') {
    store.reviews = previous.filter((item) => item.id !== reviewId);
  } else {
    const updatedReview = { ...review, status: action === 'approve' ? 'approved' as const : 'rejected' as const };
    resultReview = updatedReview;
    const next = [...previous];
    next[index] = updatedReview;
    store.reviews = next;
  }

  if (!saveStore(store)) {
    store.reviews = previous;
    return res.status(500).json({ error: 'Could not save review changes.' });
  }
  res.json({ review: resultReview });
});

// Admin update booking status
app.post('/api/admin/bookings/status', authCheck, (req: Request, res: Response) => {
  const { bookingId, status, adminNote } = req.body;
  if (typeof bookingId !== 'string' || !['new', 'confirmed', 'completed', 'cancelled'].includes(status) ||
      (adminNote !== undefined && (typeof adminNote !== 'string' || adminNote.length > 240))) {
    return res.status(400).json({ error: 'Booking update is invalid.' });
  }
  const index = store.bookings.findIndex((booking) => booking.id === bookingId);
  if (index < 0) {
    return res.status(404).json({ error: 'Booking not found.' });
  }
  const previous = store.bookings;
  const booking = {
    ...previous[index],
    status,
    ...(adminNote === undefined ? {} : { adminNote: adminNote.trim() })
  };
  const next = [...previous];
  next[index] = booking;
  store.bookings = next;
  if (!saveStore(store)) {
    store.bookings = previous;
    return res.status(500).json({ error: 'Could not save booking changes.' });
  }
  res.json({ booking });
});

const pricingPackageIds = new Set(PRICING_TIERS.map((tier) => tier.id));
function validatePricingOverride(override: any) {
  return Boolean(override && typeof override === 'object' && !Array.isArray(override) &&
    (override.priceNPR === undefined || (Number.isInteger(override.priceNPR) && override.priceNPR >= 0 && override.priceNPR <= 1000000)) &&
    ['nameEn', 'nameNp', 'descriptionEn', 'descriptionNp'].every((key) => override[key] === undefined || (typeof override[key] === 'string' && override[key].length <= 160)) &&
    (override.popular === undefined || typeof override.popular === 'boolean'));
}

app.post('/api/admin/pricing', authCheck, (req: Request, res: Response) => {
  const { id, override } = req.body || {};
  if (typeof id !== 'string' || !pricingPackageIds.has(id) || !validatePricingOverride(override)) return res.status(400).json({ error: 'Package and price fields are invalid.' });
  if (store.pricingOverrides[id]?.active !== false && store.pricingOverrides[id]) return res.status(409).json({ error: 'Pricing override already exists. Update that package instead.' });
  const previous = store.pricingOverrides[id];
  store.pricingOverrides[id] = { ...override, active: true };
  if (!saveStore(store)) { if (previous) store.pricingOverrides[id] = previous; else delete store.pricingOverrides[id]; return res.status(500).json({ error: 'Could not create package pricing.' }); }
  res.status(201).json({ id, override: store.pricingOverrides[id] });
});

app.put('/api/admin/pricing/:id', authCheck, (req: Request, res: Response) => {
  const { id } = req.params;
  const override = req.body?.override;
  if (!pricingPackageIds.has(id) || !validatePricingOverride(override)) return res.status(400).json({ error: 'Package and price fields are invalid.' });
  const previous = store.pricingOverrides[id];
  store.pricingOverrides[id] = { ...previous, ...override, active: true };
  if (!saveStore(store)) { if (previous) store.pricingOverrides[id] = previous; else delete store.pricingOverrides[id]; return res.status(500).json({ error: 'Could not save package pricing.' }); }
  res.json({ id, override: store.pricingOverrides[id] });
});

app.delete('/api/admin/pricing/:id', authCheck, (req: Request, res: Response) => {
  const { id } = req.params;
  if (!pricingPackageIds.has(id)) return res.status(400).json({ error: 'Package ID is invalid.' });
  const previous = store.pricingOverrides[id];
  store.pricingOverrides[id] = { ...previous, active: false };
  if (!saveStore(store)) { if (previous) store.pricingOverrides[id] = previous; else delete store.pricingOverrides[id]; return res.status(500).json({ error: 'Could not delete package.' }); }
  res.json({ id });
});

// Keep unmatched API requests JSON even when the Vite SPA middleware is enabled.
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// -------------------------------------------------------------
// 4K RAW BIKE ANIMATION FRAME ASSETS
// -------------------------------------------------------------
const BIKE_ASSETS_BASE = '/Users/chandankumarsah/Documents/BIKE TRANSITION';
const BIKE_FOLDERS: Record<string, string> = {
  'ducati-monster': 'Ducati Monster',
  'bmw-r1250gs': 'BMW R 1250 GS',
  'triumph-street-triple': 'Triumph model',
  'harley-davidson': 'Harley-Davidson',
};

for (const [slug, folderName] of Object.entries(BIKE_FOLDERS)) {
  const framesPath = path.join(BIKE_ASSETS_BASE, folderName, 'frames_raw');
  app.use(`/bike-frames/${slug}`, express.static(framesPath, {
    maxAge: '1h',
    immutable: true,
  }));
}

// -------------------------------------------------------------
// VITE DEV SERVER OR STATIC ASSET SERVING
// -------------------------------------------------------------
async function startServer() {
  if (!isProd && !serverOnly) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else if (isProd) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Naresh Moto Repair Center server running on http://0.0.0.0:${PORT}`);
    console.log(`Configured Shop Notifications: ${SHOP_EMAIL}`);
  });
}

startServer();
