import React, { useState, useRef, Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import { Bot } from 'lucide-react';
import * as THREE from 'three';
import '../../styles/ai-orb.css';

// ─── Inner Orb Core ──────────────────────────────────────────────
const OrbCore = ({ hovered }: { hovered: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const targetScale = hovered ? 1.25 : 1;

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.4;
            meshRef.current.rotation.x += delta * 0.15;
            // Smooth scale lerp
            const s = meshRef.current.scale.x;
            const next = THREE.MathUtils.lerp(s, targetScale, delta * 5);
            meshRef.current.scale.setScalar(next);
        }
    });

    const color = useMemo(() => new THREE.Color(hovered ? '#1cd3a2' : '#0ca3e1'), [hovered]);

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[1, 64, 64]} />
            <MeshDistortMaterial
                color={color}
                emissive={color}
                emissiveIntensity={hovered ? 0.8 : 0.4}
                roughness={0.2}
                metalness={0.7}
                distort={hovered ? 0.5 : 0.3}
                speed={hovered ? 4 : 2}
                transparent
                opacity={0.9}
            />
        </mesh>
    );
};

// ─── Orbital Rings ───────────────────────────────────────────────
const OrbitalRing = ({ axis, speed, radius, hovered }: { axis: [number, number, number]; speed: number; radius: number; hovered: boolean }) => {
    const ref = useRef<THREE.Mesh>(null!);

    useFrame((_, delta) => {
        if (ref.current) {
            ref.current.rotation.x += delta * speed * axis[0];
            ref.current.rotation.y += delta * speed * axis[1];
            ref.current.rotation.z += delta * speed * axis[2];
        }
    });

    return (
        <mesh ref={ref}>
            <torusGeometry args={[radius, 0.015, 16, 100]} />
            <meshStandardMaterial
                color={hovered ? '#46c4f3' : '#1b6ca8'}
                emissive={hovered ? '#46c4f3' : '#1b6ca8'}
                emissiveIntensity={hovered ? 1.0 : 0.5}
                transparent
                opacity={hovered ? 0.7 : 0.4}
            />
        </mesh>
    );
};

// ─── Full 3D Scene ───────────────────────────────────────────────
const OrbScene = ({ hovered }: { hovered: boolean }) => {
    return (
        <>
            <ambientLight intensity={0.3} />
            <pointLight position={[3, 3, 3]} intensity={1.5} color="#46c4f3" />
            <pointLight position={[-3, -2, 2]} intensity={0.5} color="#1cd3a2" />

            <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
                <OrbCore hovered={hovered} />

                {/* Orbital rings */}
                <OrbitalRing axis={[0.3, 1, 0.2]} speed={0.8} radius={1.4} hovered={hovered} />
                <OrbitalRing axis={[1, 0.2, 0.5]} speed={-0.6} radius={1.6} hovered={hovered} />
                <OrbitalRing axis={[0.1, 0.5, 1]} speed={0.5} radius={1.8} hovered={hovered} />

                {/* Sparkle particles */}
                <Sparkles
                    count={hovered ? 50 : 25}
                    scale={3.5}
                    size={hovered ? 3 : 2}
                    speed={0.5}
                    color="#46c4f3"
                />
            </Float>
        </>
    );
};

// ─── 2D Fallback ─────────────────────────────────────────────────
const FallbackButton = ({ onClick }: { onClick: () => void }) => (
    <button className="ai-orb-fallback" onClick={onClick} aria-label="Assistente IA">
        <Bot size={28} strokeWidth={2} />
    </button>
);

// ─── WebGL Support Detection ─────────────────────────────────────
const isWebGLSupported = (): boolean => {
    try {
        const canvas = document.createElement('canvas');
        return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
    } catch {
        return false;
    }
};

// ─── Main Exported Component ─────────────────────────────────────
export const AIOrb3D = () => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const supportsWebGL = useMemo(() => isWebGLSupported(), []);

    const handleClick = () => {
        navigate('/aluno/tutor');
    };

    return (
        <div
            className="ai-orb-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Tooltip */}
            {isHovered && (
                <div className="ai-orb-tooltip">
                    Posso ajudar? 🧠
                </div>
            )}

            {supportsWebGL ? (
                <div className="ai-orb-canvas-wrapper" onClick={handleClick}>
                    {/* CSS glow ring */}
                    <div className="ai-orb-glow" />

                    <Suspense fallback={<FallbackButton onClick={handleClick} />}>
                        <Canvas
                            camera={{ position: [0, 0, 4.5], fov: 45 }}
                            style={{
                                width: '100%',
                                height: '100%',
                                background: 'transparent',
                                borderRadius: '50%',
                            }}
                            gl={{ alpha: true, antialias: true }}
                        >
                            <OrbScene hovered={isHovered} />
                        </Canvas>
                    </Suspense>
                </div>
            ) : (
                <FallbackButton onClick={handleClick} />
            )}
        </div>
    );
};
