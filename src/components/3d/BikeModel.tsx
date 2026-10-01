import { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BikeModelProps {
  isExploded: boolean;
  onPartSelect: (partName: string) => void;
}

export default function BikeModel({ isExploded, onPartSelect }: BikeModelProps) {
  const { nodes, materials } = useGLTF('/models/generic-commuter-bike.glb') as any;
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    const engine = groupRef.current.getObjectByName('Engine_Mesh');
    if (engine) {
      const targetX = isExploded ? 2.5 : 0;
      engine.position.x = THREE.MathUtils.lerp(engine.position.x, targetX, 0.1);
    }

    const frontWheel = groupRef.current.getObjectByName('Front_Wheel_Mesh');
    if (frontWheel) {
      const targetZ = isExploded ? 3 : 0;
      frontWheel.position.z = THREE.MathUtils.lerp(frontWheel.position.z, targetZ, 0.1);
    }
  });

  const handlePointerDown = (event: { stopPropagation: () => void; object: THREE.Object3D }) => {
    event.stopPropagation();
    onPartSelect(event.object.name);
  };

  return (
    <group ref={groupRef} dispose={null}>
      {Object.keys(nodes).map((key) => {
        const node = nodes[key];
        if (!node.isMesh) return null;

        return (
          <mesh
            key={key}
            name={key}
            geometry={node.geometry}
            material={materials[node.material.name]}
            position={node.position}
            rotation={node.rotation}
            scale={node.scale}
            onPointerDown={handlePointerDown}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          />
        );
      })}
    </group>
  );
}