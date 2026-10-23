import React, { Suspense, useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// Low-poly food models using Three.js primitives
const FoodModel = ({ category, vegetarian }: { category: string; vegetarian?: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const color1 = vegetarian ? '#4ade80' : '#f97316';
  const color2 = vegetarian ? '#22c55e' : '#ea580c';

  if (category === 'Beverages') {
    return (
      <group ref={groupRef}>
        {/* Cup */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.4, 1.2, 8]} />
          <meshStandardMaterial color="#e0e0e0" flatShading />
        </mesh>
        {/* Liquid */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.4, 8]} />
          <meshStandardMaterial color="#8B4513" flatShading />
        </mesh>
        {/* Handle */}
        <mesh position={[0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.2, 0.05, 6, 8, Math.PI]} />
          <meshStandardMaterial color="#e0e0e0" flatShading />
        </mesh>
      </group>
    );
  }

  if (category === 'Desserts') {
    return (
      <group ref={groupRef}>
        {/* Cake base */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.5, 8]} />
          <meshStandardMaterial color="#D2691E" flatShading />
        </mesh>
        {/* Frosting */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.62, 0.6, 0.2, 8]} />
          <meshStandardMaterial color="#FFF8DC" flatShading />
        </mesh>
        {/* Cherry */}
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.12, 6, 6]} />
          <meshStandardMaterial color="#DC143C" flatShading />
        </mesh>
      </group>
    );
  }

  if (category === 'Starters' || category === 'Snacks') {
    return (
      <group ref={groupRef}>
        {/* Plate */}
        <mesh position={[0, -0.3, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 0.08, 8]} />
          <meshStandardMaterial color="#f5f5f5" flatShading />
        </mesh>
        {/* Food items */}
        {[[-0.2, 0, 0.1], [0.2, 0, -0.1], [0, 0, 0.2]].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color={i % 2 === 0 ? color1 : color2} flatShading />
          </mesh>
        ))}
      </group>
    );
  }

  // Mains - plate with main dish
  return (
    <group ref={groupRef}>
      {/* Plate */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.8, 0.85, 0.1, 10]} />
        <meshStandardMaterial color="#fafafa" flatShading />
      </mesh>
      {/* Main dish */}
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
        <RoundedBox args={[0.8, 0.35, 0.6]} radius={0.08} position={[0, 0, 0]}>
          <meshStandardMaterial color={color1} flatShading />
        </RoundedBox>
      </Float>
      {/* Garnish */}
      <mesh position={[0.35, 0.1, 0.25]}>
        <icosahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial color="#22c55e" flatShading />
      </mesh>
      <mesh position={[-0.3, 0.1, -0.2]}>
        <icosahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial color="#ef4444" flatShading />
      </mesh>
    </group>
  );
};

const LoadingFallback = () => (
  <mesh>
    <boxGeometry args={[0.5, 0.5, 0.5]} />
    <meshStandardMaterial color="hsl(var(--muted))" wireframe />
  </mesh>
);

interface MenuItem3DViewerProps {
  category: string;
  vegetarian?: boolean;
  itemName: string;
  fallbackImage: string;
}

const MenuItem3DViewer: React.FC<MenuItem3DViewerProps> = ({ category, vegetarian, itemName, fallbackImage }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-xl">
        <img src={fallbackImage} alt={itemName} className="w-full h-full object-cover rounded-xl" loading="lazy" />
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-muted/20 to-muted/5">
      <ErrorBoundary onError={() => setHasError(true)} fallbackImage={fallbackImage} itemName={itemName}>
        <Canvas
          camera={{ position: [2, 1.5, 2], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-3, 3, -3]} intensity={0.4} color="#fbbf24" />
          <Suspense fallback={<LoadingFallback />}>
            <FoodModel category={category} vegetarian={vegetarian} />
            <Environment preset="studio" />
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={2}
            maxDistance={6}
            autoRotate
            autoRotateSpeed={1.5}
          />
        </Canvas>
      </ErrorBoundary>
      <p className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground/60 pointer-events-none">
        Drag to rotate • Scroll to zoom
      </p>
    </div>
  );
};

class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  onError: () => void;
  fallbackImage: string;
  itemName: string;
}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { this.props.onError(); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img src={this.props.fallbackImage} alt={this.props.itemName} className="w-full h-full object-cover rounded-xl" />
        </div>
      );
    }
    return this.props.children;
  }
}

export default MenuItem3DViewer;
