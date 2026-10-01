export type WorkshopCategory =
  | 'Service & Maintenance'
  | 'Diagnostics'
  | 'Engine Work'
  | 'Electrical Repairs'
  | 'Bike Restoration'
  | 'Workshop Operations';

// Some reference images don't fit a category, so keep the tag optional instead of guessing.
export interface WorkshopGalleryImage {
  id: string;
  src: string;
  alt: string;
  description: string;
  category?: WorkshopCategory;
}

export const WORKSHOP_GALLERY: WorkshopGalleryImage[] = [
  { id: 'gallery-01', src: '/images/workshop/gallery-01.jpg', alt: 'Carburetor and finned engine in close view', description: 'A carburetor sits alongside the engine cooling fins.', category: 'Engine Work' },
  { id: 'gallery-02', src: '/images/workshop/gallery-02.jpg', alt: 'Polished motorcycle engine with exposed cylinders', description: 'Polished engine cylinders and metal components fill the frame.', category: 'Engine Work' },
  { id: 'gallery-03', src: '/images/workshop/gallery-03.jpg', alt: 'Motorcycle wheel and brake assembly', description: 'A close view shows the wheel hub and brake assembly.', category: 'Service & Maintenance' },
  { id: 'gallery-04', src: '/images/workshop/gallery-04.jpg', alt: 'Motorcycle positioned on a workshop lift', description: 'A motorcycle is raised for work inside a repair bay.', category: 'Workshop Operations' },
  { id: 'gallery-05', src: '/images/workshop/gallery-05.jpg', alt: 'Green service nozzle beside a motorcycle engine', description: 'A green nozzle is positioned beside an engine during service.', category: 'Service & Maintenance' },
  { id: 'gallery-06', src: '/images/workshop/gallery-06.jpg', alt: 'Rear motorcycle wheel and brake', description: 'The rear wheel, tyre, and brake are shown at close range.', category: 'Service & Maintenance' },
  { id: 'gallery-07', src: '/images/workshop/gallery-07.jpg', alt: 'Motorcycle headlight and front assembly', description: 'The headlight and front bodywork are shown in detail.', category: 'Bike Restoration' },
  { id: 'gallery-08', src: '/images/workshop/gallery-08.jpg', alt: 'Close view of a motorcycle fuel tank and controls', description: 'A close crop focuses on the fuel tank and handlebar area.', category: 'Bike Restoration' },
  { id: 'gallery-09', src: '/images/workshop/gallery-09.jpg', alt: 'Red motorcycle parked on a workshop floor', description: 'A red motorcycle is parked beside the service area.', category: 'Workshop Operations' },
  { id: 'gallery-10', src: '/images/workshop/gallery-10.jpg', alt: 'Red motorcycle viewed from the front side', description: 'A red motorcycle is photographed from the front side.', category: 'Bike Restoration' },
  { id: 'gallery-11', src: '/images/workshop/gallery-11.jpg', alt: 'Motorcycle in side profile', description: 'A commuter motorcycle is shown in a clear side profile.', category: 'Bike Restoration' },
  { id: 'gallery-12', src: '/images/workshop/gallery-12.jpg', alt: 'Motorcycle standing outdoors near a wall', description: 'A motorcycle stands outside against a plain workshop wall.', category: 'Workshop Operations' },
  { id: 'gallery-13', src: '/images/workshop/gallery-13.jpg', alt: 'Motorcycle exhaust and rear wheel detail', description: 'The exhaust, rear wheel, and lower frame are shown close up.', category: 'Service & Maintenance' },
  { id: 'gallery-14', src: '/images/workshop/gallery-14.jpg', alt: 'Blue motorcycle in a studio-style image', description: 'A blue motorcycle is presented against a dark background.', category: 'Bike Restoration' },
  { id: 'gallery-15', src: '/images/workshop/gallery-15.jpg', alt: 'Dark motorcycle parked outdoors in sunlight', description: 'A dark motorcycle is parked beneath trees in daylight.', category: 'Bike Restoration' },
  { id: 'gallery-16', src: '/images/workshop/gallery-16.jpg', alt: 'Motorcycle wiring harness laid out separately', description: 'A wiring harness is arranged for inspection.', category: 'Electrical Repairs' },
  { id: 'gallery-17', src: '/images/workshop/gallery-17.jpg', alt: 'Motorcycle engine casing and lower frame', description: 'The engine casing and lower frame are shown in close detail.', category: 'Engine Work' },
  { id: 'gallery-18', src: '/images/workshop/gallery-18.jpg', alt: 'Blue motorcycle in side profile', description: 'A blue motorcycle is presented against a light background.', category: 'Bike Restoration' },
  { id: 'gallery-19', src: '/images/workshop/gallery-19.jpg', alt: 'Silver motorcycle engine assembly', description: 'A silver engine assembly is shown beside the front frame.', category: 'Engine Work' },
  { id: 'gallery-20', src: '/images/workshop/gallery-20.jpg', alt: 'Black and white motorcycle in profile', description: 'A black and white motorcycle is shown in profile.', category: 'Bike Restoration' },
  { id: 'gallery-21', src: '/images/workshop/gallery-21.jpg', alt: 'People and motorcycles outside the workshop', description: 'Several motorcycles and people are gathered outside the service area.', category: 'Workshop Operations' },
  { id: 'gallery-22', src: '/images/workshop/gallery-22.jpg', alt: 'Motorcycle parked beside roadside vegetation', description: 'A motorcycle is parked beside grass and roadside plants.', category: 'Bike Restoration' },
  { id: 'gallery-23', src: '/images/workshop/gallery-23.jpg', alt: 'Dark motorcycle in a studio-style image', description: 'A dark motorcycle is isolated against a black background.', category: 'Bike Restoration' },
  { id: 'gallery-24', src: '/images/workshop/gallery-24.jpg', alt: 'Motorcycle engine below a red fuel tank', description: 'The engine and side cover sit below a red fuel tank.', category: 'Engine Work' },
  { id: 'gallery-25', src: '/images/workshop/gallery-25.jpg', alt: 'Motorcycle handlebar control switches', description: 'Handlebar switches are shown close up for inspection.', category: 'Electrical Repairs' },
  { id: 'gallery-26', src: '/images/workshop/gallery-26.jpg', alt: 'Motorcycle body panels displayed separately', description: 'Two motorcycle body panels are displayed apart from the bike.', category: 'Bike Restoration' },
  { id: 'gallery-27', src: '/images/workshop/gallery-27.jpg', alt: 'Illuminated motorcycle instrument display', description: 'An illuminated instrument cluster shows its dashboard indicators.', category: 'Diagnostics' },
  { id: 'gallery-28', src: '/images/workshop/gallery-28.jpg', alt: 'Starter motor beside a motorcycle engine', description: 'A starter motor is visible beside the engine casing.', category: 'Electrical Repairs' },
  { id: 'gallery-29', src: '/images/workshop/gallery-29.jpg', alt: 'Used motorcycle wheels and tyres grouped together', description: 'A stack of wheels and tyres is gathered in the work area.', category: 'Service & Maintenance' },
  { id: 'gallery-30', src: '/images/workshop/gallery-30.jpg', alt: 'Camshafts and engine pieces arranged in a tray', description: 'Camshafts and small engine parts rest together in a tray.', category: 'Engine Work' },
  { id: 'gallery-31', src: '/images/workshop/gallery-31.jpg', alt: 'Assorted motorcycle engine parts arranged for inspection', description: 'Engine components are arranged together for inspection.', category: 'Engine Work' },
  { id: 'gallery-32', src: '/images/workshop/gallery-32.jpg', alt: 'Motorcycle gears and shafts on a blue work surface', description: 'Gears and shafts are laid out across a blue work surface.', category: 'Engine Work' },
  { id: 'gallery-33', src: '/images/workshop/gallery-33.jpg', alt: 'Fork parts and suspension springs arranged on a blue cloth', description: 'Fork components and suspension springs are laid out for service.', category: 'Service & Maintenance' },
  { id: 'gallery-34', src: '/images/workshop/gallery-34.jpg', alt: 'Small motorcycle gears and metal components', description: 'Small gears and metal components are sorted for inspection.', category: 'Engine Work' },
  { id: 'gallery-35', src: '/images/workshop/gallery-35.jpg', alt: 'Disassembled motorcycle gearbox components', description: 'Gearbox components are arranged after disassembly.', category: 'Engine Work' },
  { id: 'gallery-36', src: '/images/workshop/gallery-36.jpg', alt: 'Motorcycle gears and shafts arranged on blue fabric', description: 'A second view shows gears and shafts ready for assembly.', category: 'Engine Work' },
  { id: 'gallery-37', src: '/images/workshop/gallery-37.jpg', alt: 'Brake discs and suspension pieces displayed together', description: 'Brake discs and suspension pieces are grouped for review.', category: 'Service & Maintenance' },
  { id: 'gallery-38', src: '/images/workshop/gallery-38.jpg', alt: 'Drive chain wrapped around a motorcycle sprocket', description: 'A drive chain runs around a close-up sprocket.', category: 'Service & Maintenance' },
  { id: 'gallery-39', src: '/images/workshop/gallery-39.jpg', alt: 'Black motorcycle against a dark background', description: 'A black motorcycle is shown in a studio-style side view.', category: 'Bike Restoration' },
  { id: 'gallery-40', src: '/images/workshop/gallery-40.jpg', alt: 'Motorcycle mechanical parts arranged in a monochrome layout', description: 'A collection of mechanical parts is arranged in rows.', category: 'Workshop Operations' },
  { id: 'gallery-41', src: '/images/workshop/gallery-41.jpg', alt: 'Clutch and engine components in a close view', description: 'Clutch components and circular engine parts fill the frame.', category: 'Engine Work' },
  { id: 'gallery-42', src: '/images/workshop/gallery-42.jpg', alt: 'Disassembled motorcycle engine parts on a work surface', description: 'An engine has been separated into components for inspection.', category: 'Engine Work' },
  { id: 'gallery-43', src: '/images/workshop/gallery-43.jpg', alt: 'Metal bearings and rings in a parts basket', description: 'Bearings and metal rings are collected in a small basket.', category: 'Engine Work' },
  { id: 'gallery-44', src: '/images/workshop/gallery-44.jpg', alt: 'Motorcycle components arranged in an exploded layout', description: 'Motorcycle components are displayed in an exploded-style layout.' },
  { id: 'gallery-45', src: '/images/workshop/gallery-45.jpg', alt: 'Clutch and gearbox parts in close view', description: 'Clutch and gearbox parts are shown in a close-up view.', category: 'Engine Work' },
  { id: 'gallery-46', src: '/images/workshop/gallery-46.jpg', alt: 'Hand working on a motorcycle chain with a tool', description: 'A hand uses a tool on the motorcycle drive chain.', category: 'Service & Maintenance' },
  { id: 'gallery-47', src: '/images/workshop/gallery-47.jpg', alt: 'Workshop shelves stocked with bottles and supplies', description: 'Shelves hold rows of workshop supplies and lubricant bottles.', category: 'Workshop Operations' },
  { id: 'gallery-48', src: '/images/workshop/gallery-48.jpg', alt: 'Close view of motorcycle gears and shafts', description: 'Several gear shafts are arranged side by side.', category: 'Engine Work' },
  { id: 'gallery-49', src: '/images/workshop/gallery-49.jpg', alt: 'Red motorcycle against a dark background', description: 'A red motorcycle is shown in a studio-style image.', category: 'Bike Restoration' }
];