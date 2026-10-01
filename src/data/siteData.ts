export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  description: string;
  category: 'routine' | 'engine' | 'safety' | 'electrical' | 'specialty';
  icon: string;
  image: string;
  estimatedTime: string;
  estimatedPrice: string;
  highlights: string[];
}

export interface ReviewItem {
  id: string;
  author: string;
  location: string;
  bikeModel: string;
  rating: number;
  date: string;
  comment: string;
  serviceType: string;
}

export interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  priceNPR: number;
  duration: string;
  popular?: boolean;
  features: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  experienceYears: number;
  specialty: string;
  certifiedIn: string;
  photo: string;
  quote?: string;
  isFounder?: boolean;
  roleNp?: string;
  specialtyEn?: string;
  specialtyNp?: string;
}

export interface CatalogService {
  id: string;
  nameEn: string;
  nameNp: string;
  category: string;
  descriptionEn: string;
  descriptionNp: string;
  price: string;
  photo?: string;
  active: boolean;
}

export interface LiveQueueStatus {
  bikesAhead: number;
  estimatedWaitMinutes: number;
  statusLevel: 'low' | 'moderate' | 'busy';
  customMessage?: string;
  updatedAt: string;
}

export const BUSINESS_INFO = {
  name: "Naresh Moto Repair Center",
  shortName: "Naresh Moto",
  tagline: "Two Wheeler Repair Shop",
  rating: 4.5,
  reviewCount: 148,
  phone: "+977 982-9455583",
  phoneRaw: "+9779829455583",
  email: "chandan241470@gmail.com",
  facebookProfile1: "https://www.facebook.com/profile.php?id=61584467232104",
  facebookProfile2: "https://www.facebook.com/ladu.chauhan",
  address: "Dhore pakahamainpur - 1, Dhore, Nepal",
  plusCode: "2QC3+W5 Dhore, Madhesh Province, Nepal",
  mapsUrl: "https://www.google.com/maps/place/Naresh+Moto+Repair+Center/@27.0235028,84.7498964,1722m/data=!3m1!1e3!4m6!3m5!1s0x3993598ef96256ff:0x9a364e217f26105f!8m2!3d27.0223353!4d84.7529604!16s%2Fg%2F11vy16whjg?entry=ttu&g_ep=EgoyMDI2MDkyOC4wIKXMDSoASAFQAw%3D%3D",
  whatsAppUrl: "https://wa.me/9779829455583?text=Namaste%20Naresh%20Dai,%20I%20would%20like%20to%20inquire%20about%20bike%20servicing%20at%20Naresh%20Moto%20Repair%20Center.",
  openingTime: 6, // 6:00 AM
  closingTime: 20, // 8:00 PM (20:00)
  daysOpen: "Sunday – Saturday (Every day)",
  hoursDisplay: "6:00 AM – 8:00 PM, Sun–Sat",
  stats: {
    bikesServiced: 5200,
    yearsInBusiness: 12,
    ratingScore: "4.5",
    genuinePartsRate: "100%"
  }
};

export const DEFAULT_QUEUE_STATUS: LiveQueueStatus = {
  bikesAhead: 2,
  estimatedWaitMinutes: 40,
  statusLevel: 'low',
  customMessage: "Bays active · Fast turnaround today",
  updatedAt: "Just now"
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "naresh-founder",
    name: "Naresh Chauhan",
    role: "Founder & Master Technician",
    experienceYears: 14,
    specialty: "Engine Diagnostics & 4-Stroke Overhauls",
    certifiedIn: "Certified Master Tech – Hero MotoCorp & Bajaj Auto 4-Stroke Powerplants",
    photo: "/images/mechanics/naresh.jpg",
    quote: "Every motorcycle that enters this garage belongs to someone who depends on it for their family and livelihood. We diagnose with honesty and make sure your machine runs like new before you roll back onto Dhore's roads.",
    isFounder: true,
    roleNp: "संस्थापक तथा मास्टर प्राविधिक",
    specialtyEn: "Engine Diagnostics & 4-Stroke Overhauls",
    specialtyNp: "इन्जिन जाँच तथा ४-स्ट्रोक ओभरहाल"
  },
  {
    id: "bikash-patel",
    name: "Bikash Patel",
    role: "Senior Electrical & FI Specialist",
    experienceYears: 8,
    specialty: "Wiring Harness, 12V Battery & EFI Troubleshooting",
    certifiedIn: "Bosch Automotive 12V Electricals & Electronic Fuel Injection Systems",
    photo: "/images/mechanics/bikash.jpg",
    quote: "No tape jobs or guesswork. We test circuit resistance properly and secure water-tight OEM couplers for monsoon riding.",
    roleNp: "वरिष्ठ इलेक्ट्रिकल तथा एफआई विशेषज्ञ",
    specialtyEn: "Wiring Harness, 12V Battery & EFI Troubleshooting",
    specialtyNp: "वायरिङ, १२V ब्याट्री तथा EFI समस्या समाधान"
  },
  {
    id: "sunil-sah",
    name: "Sunil Sah",
    role: "Suspension & Brake Calibration Tech",
    experienceYears: 7,
    specialty: "Hydraulic Disc Calipers & Fork Damper Tuning",
    certifiedIn: "Endurance Suspension Tuning & Hydraulic Brake Fluid Safety Standards",
    photo: "/images/mechanics/sunil.jpg",
    roleNp: "सस्पेन्सन तथा ब्रेक प्राविधिक",
    specialtyEn: "Hydraulic Disc Calipers & Fork Damper Tuning",
    specialtyNp: "हाइड्रोलिक डिस्क ब्रेक तथा फोर्क ड्याम्पर मिलाउने"
  },
  {
    id: "ramesh-yadav",
    name: "Ramesh Yadav",
    role: "Express Periodic Service Specialist",
    experienceYears: 5,
    specialty: "45-Minute Periodic Maintenance & Drive Transmission",
    certifiedIn: "Castrol & Servo 4T Lubrication & Clutch Free-Play Calibration",
    photo: "/images/mechanics/ramesh.jpg",
    roleNp: "एक्सप्रेस नियमित सर्भिस विशेषज्ञ",
    specialtyEn: "45-Minute Periodic Maintenance & Drive Transmission",
    specialtyNp: "४५ मिनेटको नियमित मर्मत तथा ड्राइभ ट्रान्समिसन"
  }
];

export const DEFAULT_CATALOG_SERVICES: CatalogService[] = [
  { id: "01-general-servicing", nameEn: "General Servicing", nameNp: "नियमित सर्भिसिङ", category: "Oil & Fluids", descriptionEn: "Oil, filters, adjustments, and the checks that prevent small problems becoming expensive ones.", descriptionNp: "मोबिल, फिल्टर, ट्युनिङ र नियमित चेकजाँच जसले पछि आउने ठूलो खर्च हुनबाट जोगाउँछ।", price: "499–1,299", photo: "/images/workshop/live-feed-02.jpg", active: true },
  { id: "02-engine-starting", nameEn: "Engine & Starting", nameNp: "इन्जिन तथा स्टार्टिङ", category: "Engine", descriptionEn: "Hard starts, strange sounds, low pickup, or a bike that has gone quiet.", descriptionNp: "स्टार्ट हुन समस्या, अनौठो आवाज, कमजोर पिकअप वा बन्द भएको इन्जिनको भरपर्दो समाधान।", price: "800–3,500", photo: "/images/workshop/gallery-01.jpg", active: true },
  { id: "03-brakes-tyres", nameEn: "Brakes & Tyres", nameNp: "ब्रेक तथा टायर", category: "Brakes & Tyres", descriptionEn: "Brake feel, tyre changes, punctures, chain tension, and safer daily riding.", descriptionNp: "ब्रेक लिभर, नयाँ टायर फिटिङ, पन्चर, चेन टाइट र सडकमा सुरक्षित दैनिक यात्रा।", price: "350–1,800", photo: "/images/workshop/gallery-06.jpg", active: true },
  { id: "04-electrical-work", nameEn: "Electrical Work", nameNp: "विद्युतीय काम", category: "Electrical", descriptionEn: "Lights, battery, horn, wiring, and the little electrical faults that stop a ride.", descriptionNp: "हेडलाइट, ब्याट्री, हर्न, नयाँ वायरिङ र बाटोमा बाइक रोक्ने विद्युतीय समस्याहरूको समाधान।", price: "250–1,500", photo: "/images/workshop/gallery-16.jpg", active: true }
];

export const WHAT_ROLLS_THROUGH_OUR_DOOR: ServiceItem[] = [
  {
    id: "01-general-servicing",
    number: "01",
    title: "GENERAL SERVICING",
    description: "Oil, filters, adjustments, and the checks that prevent small problems becoming expensive ones.",
    category: "routine",
    icon: "Wrench",
    image: "/images/workshop/live-feed-02.jpg",
    estimatedTime: "45–60 mins",
    estimatedPrice: "रु 499 – रु 1,299",
    highlights: ["Engine oil flush & replacement", "Air & fuel filter cleaning", "Spark plug clearance check", "Full brake pad adjustment", "Chain cleaning & lubrication"]
  },
  {
    id: "02-engine-starting",
    number: "02",
    title: "ENGINE & STARTING",
    description: "Hard starts, strange sounds, low pickup, or a bike that has gone quiet.",
    category: "engine",
    icon: "Activity",
    image: "/images/workshop/gallery-01.jpg",
    estimatedTime: "2–4 hours",
    estimatedPrice: "रु 800 – रु 3,500",
    highlights: ["Compression testing", "Carburetor / FI tuning", "Valve clearance & timing check", "Clutch plate replacement", "Kick & self-starter overhaul"]
  },
  {
    id: "03-brakes-tyres",
    number: "03",
    title: "BRAKES & TYRES",
    description: "Brake feel, tyre changes, punctures, chain tension, and safer daily riding.",
    category: "safety",
    icon: "Disc",
    image: "/images/workshop/gallery-06.jpg",
    estimatedTime: "30–90 mins",
    estimatedPrice: "रु 350 – रु 1,800",
    highlights: ["Disc & drum brake shoe replacement", "Brake bleeding & hydraulic fluid check", "Tyre puncture repair & new fitting", "Wheel alignment & truing", "Drive chain slack adjustment"]
  },
  {
    id: "04-electrical-work",
    number: "04",
    title: "ELECTRICAL WORK",
    description: "Lights, battery, horn, wiring, and the little electrical faults that stop a ride.",
    category: "electrical",
    icon: "Zap",
    image: "/images/workshop/gallery-16.jpg",
    estimatedTime: "30–60 mins",
    estimatedPrice: "रु 250 – रु 1,500",
    highlights: ["12V battery health testing", "Headlight & indicator harness fixes", "Horn tuning & relay installation", "Self-starter relay diagnostic", "Blown fuse & short-circuit troubleshooting"]
  }
];

export const EXPANDED_SERVICES: ServiceItem[] = [
  ...WHAT_ROLLS_THROUGH_OUR_DOOR,
  {
    id: "05-suspension-shocks",
    number: "05",
    title: "SUSPENSION & FORK OVERHAUL",
    description: "Front fork oil leakage, blown seals, bottoming out over potholes, and rear monoshock tuning.",
    category: "specialty",
    icon: "ShieldAlert",
    image: "/images/workshop/gallery-33.jpg",
    estimatedTime: "1.5–3 hours",
    estimatedPrice: "रु 650 – रु 2,200",
    highlights: ["Fork oil seal replacement", "Hydraulic fluid refill", "Bushing inspection", "Rear shock damping check"]
  },
  {
    id: "06-periodic-maintenance",
    number: "06",
    title: "PERIODIC MAINTENANCE PACKAGES",
    description: "Structured manufacturer-interval maintenance (3,000 km, 6,000 km, 10,000 km) for worry-free commuting.",
    category: "routine",
    icon: "CalendarCheck",
    image: "/images/workshop/live-feed-02.jpg",
    estimatedTime: "2 hours",
    estimatedPrice: "रु 1,299",
    highlights: ["32-point inspection", "All fluid checks", "Cable lubrication", "Nut & bolt torquing"]
  },
  {
    id: "07-genuine-spare-parts",
    number: "07",
    title: "GENUINE SPARE PARTS FITTING",
    description: "Direct on-shelf inventory for Hero, Bajaj, TVS, Honda, Yamaha, and Castrol lubricants.",
    category: "specialty",
    icon: "PackageCheck",
    image: "/images/workshop/gallery-32.jpg",
    estimatedTime: "Immediate",
    estimatedPrice: "MRP + Minimal labor",
    highlights: ["100% genuine sealed parts", "Oils: Servo, Gulf, Lazer, Castrol", "Spark plugs, filters, brake shoes", "Factory guarantee"]
  },
  {
    id: "08-emergency-assistance",
    number: "08",
    title: "EMERGENCY ROADSIDE BREAKDOWN",
    description: "Stuck in Dhore, Pakahamainpur, or Dhore outskirts with a dead bike? Call us for immediate field support.",
    category: "specialty",
    icon: "PhoneCall",
    image: "/images/workshop/gallery-21.jpg",
    estimatedTime: "Rapid response",
    estimatedPrice: "Distance based",
    highlights: ["On-call mechanic dispatch", "Jump-start assistance", "Puncture repair on spot", "Towing to shop if needed"]
  }
];

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "tier-basic",
    name: "Quick Commuter Check",
    tagline: "Essential tune-up for daily office & local errand riders",
    priceNPR: 499,
    duration: "45 mins",
    popular: false,
    features: [
      "Engine oil inspection & top-up",
      "Brake shoe clearance adjustment",
      "Drive chain cleaning & tensioning",
      "Air filter dust blow-out",
      "Tyre pressure check & visual inspection",
      "Spark plug cleaning"
    ]
  },
  {
    id: "tier-standard",
    name: "Standard Periodic Service",
    tagline: "Our most popular comprehensive service for trouble-free riding",
    priceNPR: 1299,
    duration: "90–120 mins",
    popular: true,
    features: [
      "Complete engine oil flush & refill",
      "New genuine oil filter installation",
      "Carburetor / throttle body ultrasonic cleaning",
      "Brake pads & shoe deep cleaning & de-glazing",
      "Clutch cable & throttle cable free-play calibration",
      "Battery voltage & charging circuit test",
      "Chassis nut & bolt tightening",
      "High-pressure wash & engine degreasing"
    ]
  },
  {
    id: "tier-overhaul",
    name: "Master Engine & Chassis Overhaul",
    tagline: "Total rebuild and deep restoration for older or heavily-used two-wheelers",
    priceNPR: 2899,
    duration: "Full day",
    popular: false,
    features: [
      "Everything in Standard Periodic Service",
      "Full engine compression & valve clearance setting",
      "Front fork suspension oil & seal overhaul",
      "Wheel bearing inspection & grease repacking",
      "Complete wiring harness integrity scan",
      "Fuel tank rust & sediment flush",
      "Full road test with master mechanic Naresh",
      "30-day post-service warranty"
    ]
  }
];

export const REVIEWS_DATA: ReviewItem[] = [
  {
    id: "rev-1",
    author: "Rameshwar Prasad Patel",
    location: "Dhore-14, Pipra",
    bikeModel: "Hero Super Splendor 125",
    rating: 5,
    date: "3 days ago",
    comment: "Naresh Dai ekdam anubhavi mechanic hunuhunchha. Mero bike ko idling thik thiyena ra pickup pani kam thiyo, aru dui ota workshop le samasya samadhan garna sakena. Uha le 20 minute mai pilot jet jam bhayeko thaha paunu bhayo, safa garnu bhayo, ani ahile bike naya jastai chalchha. Rate pani ekdam imandar chha!",
    serviceType: "Engine & Starting"
  },
  {
    id: "rev-2",
    author: "Bikash Thapa",
    location: "Pakahamainpur, Dhore",
    bikeModel: "Bajaj Pulsar 150 UG5",
    rating: 5,
    date: "1 week ago",
    comment: "Dhore/Pakahamainpur tira ko sabai bhanda ramro motorcycle repair workshop. Hero ra Bajaj ko asli parts sajilai paainchha, parkhera basnu pardaina ra Dhore bazar samma dhaunu pani pardaina. Chhito ra milayera kaam garnuhunchha.",
    serviceType: "General Servicing & Parts"
  },
  {
    id: "rev-3",
    author: "Sunil Kumar Shah",
    location: "Adarsh Nagar, Dhore",
    bikeModel: "Honda Shine BS4",
    rating: 5,
    date: "2 weeks ago",
    comment: "Bihana 6 baje nai kholnuhunchha, kaam ma janu aghi bike banauna parne haru ko lagi dherai sajilo. Brake pad ferne ra chain sprocket milaune kaam chhittai bhayo. Purna sifaris garchhu.",
    serviceType: "Brakes & Tyres"
  },
  {
    id: "rev-4",
    author: "Amit Chaudhary",
    location: "Murli, Dhore",
    bikeModel: "TVS NTorq 125",
    rating: 4,
    date: "1 month ago",
    comment: "Starting button ra wiring ko samasya ramrari banaidinu bhayo. Kunai part kholnu aghi kharcha kati lagchha bhanera safa bujhaidinu bhayo. Najikai ko ekdam ramro workshop.",
    serviceType: "Electrical Work"
  }
];

export const FAQ_ITEMS = [
  {
    question: "Do I need to book an appointment, or are walk-ins welcome?",
    answer: "Walk-ins are always welcome! We open every single day from 6:00 AM to 8:00 PM. For quick jobs like oil changes, tyre punctures, chain tightening, or brake adjustments, just pull up to our shop in Dhore pakahamainpur - 1. For engine overhauls or deep rebuilds, an advance call helps us reserve a service lift."
  },
  {
    question: "Do you keep genuine spare parts in stock?",
    answer: "Yes. We maintain a large on-site inventory of genuine OEM parts and lubricants for Hero, Bajaj, Honda, TVS, and Yamaha, including certified oils (Castrol, Servo, Gulf, Lazer), spark plugs, cables, brake shoes, gaskets, and filters."
  },
  {
    question: "What types of two-wheelers do you repair?",
    answer: "We repair and tune all two-wheelers ridden in Nepal: daily commuter motorcycles (Hero Splendor, HF Deluxe, Glamour, Honda Shine, Unicorn, Bajaj Platina), sport commuters (Pulsar 150/220/NS, Yamaha FZ/R15, Apache RTR), cruiser motorcycles (Royal Enfield Bullet/Classic), and automatic scooters (Honda Dio/Activa, TVS NTorq/Jupiter, Suzuki Burgman/Access)."
  },
  {
    question: "Can you help if my bike breaks down on the road near Dhore?",
    answer: "Yes! If you're stalled in Dhore, Pakahamainpur, Bahuarwa, or the surrounding Dhore rural/urban stretch, call our hotline (+977 982-9455583). We can dispatch emergency tools, fuel, battery jump, or arrange safe transport back to the workshop."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept Cash (Nepali Rupees) as well as quick mobile digital QR payments via Fonepay, eSewa, and Khalti for your convenience."
  },
  {
    question: "Do you provide a warranty on mechanical repairs?",
    answer: "Yes. All major repairs and parts fitted by Naresh Moto come with our workmanship assurance. If you notice any sound or discrepancy within 15 to 30 days after the job, bring it back and we inspect it free of charge."
  }
];

export const MOTORCYCLE_BRANDS = [
  "Hero MotoCorp",
  "Bajaj Auto",
  "Honda Motorcycles",
  "TVS Motor",
  "Yamaha",
  "Royal Enfield",
  "Suzuki",
  "KTM"
];
