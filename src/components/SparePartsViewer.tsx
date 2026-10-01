import { Component, Suspense, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { PackageCheck, ShoppingCart, Wrench, X } from 'lucide-react';
import BikeModel from './3d/BikeModel';

const PART_DATABASE: Record<string, { name: string; oem: string; price: string; stock: string }> = {
  Engine_Mesh: { name: 'Engine Block Cover', oem: 'BAJ-ENG-150', price: 'NPR 1,250', stock: 'In Stock' },
  Front_Wheel_Mesh: { name: 'Front Disc Rotor', oem: 'BAJ-BRK-002', price: 'NPR 1,800', stock: 'Available on Order' },
  Brake_Pad_Mesh: { name: 'Front Brake Pads', oem: 'BAJ-PAD-099', price: 'NPR 450', stock: 'In Stock' },
};

function PlaceholderBike() {
  return (
    <mesh>
      <boxGeometry args={[2, 1, 0.5]} />
      <meshStandardMaterial color="#60bb46" wireframe />
    </mesh>
  );
}

class ModelErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Failed to load the bike model:', error, errorInfo);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export default function SparePartsViewer({ onClose }: { onClose: () => void }) {
  const [isExploded, setIsExploded] = useState(false);
  const [selectedPart, setSelectedPart] = useState<(typeof PART_DATABASE)[string] | null>(null);

  const handlePartClick = (meshName: string) => {
    const partData = PART_DATABASE[meshName];
    if (partData) setSelectedPart(partData);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950/95 backdrop-blur-xl animate-fade-in lg:flex-row">
      <div className="relative h-[55%] w-full lg:h-full lg:w-2/3">
        <Canvas camera={{ position: [5, 2, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <ModelErrorBoundary fallback={<PlaceholderBike />}>
            <Suspense fallback={<PlaceholderBike />}>
              <BikeModel isExploded={isExploded} onPartSelect={handlePartClick} />
            </Suspense>
          </ModelErrorBoundary>
          <Suspense fallback={null}>
            <Environment preset="city" />
            <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
          </Suspense>
          <OrbitControls makeDefault minDistance={2} maxDistance={10} maxPolarAngle={Math.PI / 2} />
        </Canvas>

        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2">
          <button
            type="button"
            onClick={() => setIsExploded((current) => !current)}
            className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 font-bold text-white shadow-lg transition-colors hover:bg-red-500"
          >
            <Wrench className="h-5 w-5" />
            {isExploded ? 'Assemble Bike' : 'Disassemble Parts'}
          </button>
        </div>
      </div>

      <div className="flex h-[45%] w-full flex-col border-t border-white/10 bg-[#131622] p-5 shadow-2xl lg:h-full lg:w-1/3 lg:border-l lg:border-t-0 lg:p-6">
        <div className="mb-5 flex items-center justify-between lg:mb-8">
          <h2 className="text-xl font-black text-white">Part Details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close spare parts viewer"
            className="rounded-lg bg-white/5 p-2 text-neutral-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {selectedPart ? (
          <div className="animate-fade-in space-y-5 overflow-y-auto lg:space-y-6">
            <div>
              <p className="mb-1 text-sm font-bold text-red-400">Selected Component</p>
              <h3 className="text-2xl font-black text-white lg:text-3xl">{selectedPart.name}</h3>
            </div>

            <div className="space-y-3 rounded-lg border border-white/5 bg-neutral-900/50 p-4 font-mono text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-neutral-400">OEM Number:</span>
                <span className="text-right text-white">{selectedPart.oem}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-neutral-400">Original Price:</span>
                <span className="text-right font-bold text-red-400">{selectedPart.price}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-neutral-400">Availability:</span>
                <span className="flex items-center gap-2 text-right text-white">
                  <PackageCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  {selectedPart.stock}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 font-black text-white transition-colors hover:bg-red-500 lg:py-4"
            >
              <ShoppingCart className="h-5 w-5" />
              Request This Part
            </button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center opacity-60">
            <Wrench className="mb-3 h-12 w-12 text-neutral-500 lg:mb-4 lg:h-16 lg:w-16" />
            <p className="font-bold text-neutral-300">Rotate the bike and tap any part to view details.</p>
          </div>
        )}
      </div>
    </div>
  );
}