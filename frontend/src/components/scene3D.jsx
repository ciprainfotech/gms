import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Effects } from '@react-three/drei';
import EngineModel from './EngineModel';
import AvatarModel from './AvatarModel.jsx';

export default function Scene3D({ interactionState, showPassword, isIgniting }) {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <spotLight position={[-10, 10, 5]} intensity={0.8} angle={0.3} penumbra={1} />
      
      <Suspense fallback={null}>
        <EngineModel isIgniting={isIgniting} />
        <AvatarModel interactionState={interactionState} showPassword={showPassword} />
        <Environment preset="city" />
        <Effects>
            {/* Post-processing bloom effect for the glow */}
            <unrealBloomPass threshold={0.8} strength={isIgniting ? 5.0 : 1.0} radius={1} />
        </Effects>
      </Suspense>
      
      {/* <OrbitControls enableZoom={false} enablePan={false} /> */}
    </Canvas>
  );
}