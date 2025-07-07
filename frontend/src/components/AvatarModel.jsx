import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';

export default function AvatarModel({ interactionState, showPassword }) {
  const group = useRef();
  // IMPORTANT: Replace 'models/avatar.glb' with the path to your character model.
  const { nodes, materials, animations } = useGLTF('models/avatar.glb');
  const { actions } = useAnimations(animations, group);

  // This hook controls which animation is playing
  useEffect(() => {
    // Fade out all other animations
    Object.values(actions).forEach(action => action.fadeOut(0.5));

    // Play animation based on the interaction state
    if (showPassword) {
      actions.visor_down?.reset().fadeIn(0.5).play();
    } else if (interactionState === 'typing-id') {
      actions.point?.reset().fadeIn(0.5).play();
    } else if (interactionState === 'typing-key') {
      actions.arms_crossed?.reset().fadeIn(0.5).play();
    } else if (interactionState === 'success') {
      actions.nod?.reset().fadeIn(0.5).play();
    } else {
      actions.idle?.reset().fadeIn(0.5).play(); // Default idle animation
    }
  }, [interactionState, showPassword, actions]);

  return (
    <group ref={group} dispose={null} position={[2, -1.5, 0]} scale={1.2}>
      {/* This structure is highly dependent on your 3D model */}
      <primitive object={nodes.Hips} />
      <skinnedMesh geometry={nodes.Body.geometry} material={materials.AvatarMaterial} skeleton={nodes.Body.skeleton} />
    </group>
  );
}

useGLTF.preload('models/avatar.glb');