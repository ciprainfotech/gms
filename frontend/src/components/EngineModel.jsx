import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

export default function EngineModel({ isIgniting }) {
  const group = useRef();
  // IMPORTANT: Replace 'models/engine.glb' with the actual path to your model.
  const { nodes, materials } = useGLTF('models/engine.glb');

  // Rotation and ignition animation
  useFrame((state, delta) => {
    if (isIgniting) {
      group.current.rotation.y += delta * 25; // Spin fast
    } else {
      group.current.rotation.y += delta * 0.2; // Slow rotation
    }
  });

  return (
    // This structure depends on your actual 3D model.
    // You might need to adjust it after loading your model.
    <group ref={group} dispose={null} scale={1.5} position={[0, 0, 0]}>
      <mesh geometry={nodes.EngineBlock?.geometry} material={materials.Metal} />
      <mesh geometry={nodes.Pistons?.geometry} material={materials.Chrome} />
      {/* Add other parts of your engine model here */}
    </group>
  );
}

// Preload the model for faster access
useGLTF.preload('models/engine.glb');