import { Canvas, useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF, Environment, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import React from 'react'
import { animalConfig, getTierForUser } from '../../core/animalConfig'
import { useAuth } from '../../core/auth'

export class PetErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

// THEHDREALMODEL Loader mapping to the Configuration
export function HDAnimal({ animal = 'fox' }: { animal?: keyof typeof animalConfig }) {
  const config = animalConfig[animal]
  const primitiveRef = useRef<THREE.Group>(null)
  const lookTarget = useRef({ x: 0, y: 0 })
  const gltf = useGLTF(config.modelPath)
  const { actions, names } = useAnimations((gltf as any).animations ?? [], primitiveRef)

  useEffect(() => {
    // Make the animal pick new random visual targets to stare at every few seconds!
    const interval = setInterval(() => {
      lookTarget.current = {
        y: (Math.random() - 0.5) * 2.5, // Look deeply left or right
        x: (Math.random() - 0.2) * 0.3, // Nod slightly up or down
      }
    }, 3500)

    if (!names || names.length === 0) return;
    
    let currentIndex = 0;
    let currentAction = actions[names[currentIndex]];
    
    if (currentAction) {
      currentAction.reset().fadeIn(0.5).play();
    }

    const animInterval = setInterval(() => {
      if (currentAction) currentAction.fadeOut(0.5);
      
      currentIndex = (currentIndex + 1) % names.length;
      currentAction = actions[names[currentIndex]];
      
      if (currentAction) currentAction.reset().fadeIn(0.5).play();
    }, 6000);

    return () => {
      clearInterval(interval)
      clearInterval(animInterval)
    }
  }, [actions, names])

  useFrame(() => {
    if (!primitiveRef.current) return
    
    // Smoothly pan the head drastically across screen towards the randomly generated targets
    primitiveRef.current.rotation.y = THREE.MathUtils.lerp(primitiveRef.current.rotation.y, lookTarget.current.y, 0.02)
    primitiveRef.current.rotation.x = THREE.MathUtils.lerp(primitiveRef.current.rotation.x, lookTarget.current.x, 0.02)
  })

  // Locked rotation angled towards the left (-0.5) to acknowledge the UI text while keeping its front visible
  return (
    <group scale={config.scale} position={[0, -0.2, 0]} rotation={[0, -0.5, 0]}>
      <primitive ref={primitiveRef} object={(gltf as any).scene} />
    </group>
  )
}

// Fallback Geometric "Stylized HD" Fox if the user hasn't dropped the GLB file yet.
export function StylizedPlaceholderWolf({ tierLevel = 'bronze' }: { tierLevel?: string }) {
  const group = useRef<THREE.Group>(null)
  const leftEye = useRef<THREE.Mesh>(null)
  const rightEye = useRef<THREE.Mesh>(null)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })

  const color = animalConfig.fox.auraColor[getTierForUser(tierLevel)]

  useEffect(() => {
    const onMove = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const blink = useMemo(() => ({ t: 0, next: 1 + Math.random() * 3 }), [])

  useFrame((state, delta) => {
    if (!group.current) return
    blink.t += delta
    if (blink.t > blink.next) {
      const s = Math.max(0.08, 1 - (blink.t - blink.next) * 10)
      if (leftEye.current) leftEye.current.scale.y = s
      if (rightEye.current) rightEye.current.scale.y = s
      if (blink.t - blink.next > 0.12) {
        if (leftEye.current) leftEye.current.scale.y = 1
        if (rightEye.current) rightEye.current.scale.y = 1
        blink.t = 0
        blink.next = 1.2 + Math.random() * 3.8
      }
    }

    const nx = (cursor.x / Math.max(1, window.innerWidth)) * 2 - 1
    const ny = (cursor.y / Math.max(1, window.innerHeight)) * 2 - 1
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, nx * 0.5, 0.05)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -ny * 0.3, 0.05)
    
    // Natural breathing
    const breath = Math.sin(state.clock.elapsedTime * 2) * 0.03
    group.current.scale.set(1 + breath*0.2, 1 + breath, 1 + breath*0.2)
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.08
  })

  return (
    <group ref={group} scale={1.5}>
      {/* Majestic Head Base */}
      <mesh>
        <octahedronGeometry args={[0.7, 2]} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.8} />
      </mesh>
      
      {/* Glowing Inner Core */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={animalConfig.fox.eyeColor} toneMapped={false} />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.4, 0.6, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.2, 0.8, 4]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.6} />
      </mesh>
      <mesh position={[0.4, 0.6, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.2, 0.8, 4]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Majestic Eyes */}
      <mesh ref={leftEye} position={[-0.25, 0.1, 0.61]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={animalConfig.fox.eyeColor} toneMapped={false} />
      </mesh>
      <mesh ref={rightEye} position={[0.25, 0.1, 0.61]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={animalConfig.fox.eyeColor} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function BigPetView() {
  const { user } = useAuth()
  const tier = getTierForUser(user?.tier)
  const auraColor = animalConfig.fox.auraColor[tier]
  const [hasRealPet, setHasRealPet] = useState(false)

  useEffect(() => {
    fetch(animalConfig.fox.modelPath, { method: 'HEAD' }).then(r => {
      // Relaxed MIME type checking to reliably load from the Vite dev server
      setHasRealPet(r.ok)
    }).catch(() => {})
  }, [])

  return (
    <div className="w-full h-full cursor-auto overflow-visible">
      <PetErrorBoundary fallback={<div className="h-full w-full" />}>
        {/* gl without alpha, attaching #0b0f14 background perfectly solves Bloom transparency square bugs */}
        <Canvas camera={{ position: [0, 0, 6], fov: 40 }} gl={{ antialias: false }}>
          <color attach="background" args={['#0b0f14']} />
          
          <ambientLight intensity={0.2} color="#ffffff" />
          
          {/* Rim lights to make the white fox "glow naturally from the sides" */}
          <directionalLight position={[4, 1, -2]} intensity={3.5} color="#e0f2fe" castShadow />
          <directionalLight position={[-4, 1, -2]} intensity={3.5} color="#e0f2fe" castShadow />
          <directionalLight position={[0, 4, 3]} intensity={0.5} />
          
          <Environment preset="night" />
          
          <Suspense fallback={null}>
            {hasRealPet ? <HDAnimal animal="fox" /> : <StylizedPlaceholderWolf tierLevel={tier} />}
          </Suspense>

          {/* Diamond tier cinematic particles */}
          {tier === 'diamond' && (
            <Sparkles count={150} scale={4} size={3} speed={0.4} opacity={0.6} color={auraColor} />
          )}

          <EffectComposer>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} />
          </EffectComposer>
        </Canvas>
      </PetErrorBoundary>
    </div>
  )
}
