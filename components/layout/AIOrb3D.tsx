import React, { useState, useRef, Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import { Bot } from 'lucide-react';
import * as THREE from 'three';
import '../../styles/ai-orb.css';

// ─── Inner Orb Core ──────────────────────────────────────────────
const OrbCore = ({ hovered, speaking }: { hovered: boolean, speaking: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const targetScale = speaking ? 1.5 : (hovered ? 1.25 : 1);

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * (speaking ? 1.2 : 0.4);
            meshRef.current.rotation.x += delta * (speaking ? 0.45 : 0.15);
            // Smooth scale lerp
            const s = meshRef.current.scale.x;
            const next = THREE.MathUtils.lerp(s, targetScale, delta * (speaking ? 10 : 5));
            meshRef.current.scale.setScalar(next);
        }
    });

    const active = hovered || speaking;
    const color = useMemo(() => new THREE.Color(active ? '#1cd3a2' : '#0ca3e1'), [active]);

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[1, 64, 64]} />
            <MeshDistortMaterial
                color={color}
                emissive={color}
                emissiveIntensity={active ? 0.8 : 0.4}
                roughness={0.2}
                metalness={0.7}
                distort={speaking ? 0.7 : (hovered ? 0.5 : 0.3)}
                speed={speaking ? 8 : (hovered ? 4 : 2)}
                transparent
                opacity={0.9}
            />
        </mesh>
    );
};

// ─── Orbital Rings ───────────────────────────────────────────────
const OrbitalRing = ({ axis, speed, radius, hovered, speaking }: { axis: [number, number, number]; speed: number; radius: number; hovered: boolean; speaking: boolean }) => {
    const ref = useRef<THREE.Mesh>(null!);

    useFrame((_, delta) => {
        if (ref.current) {
            const currentSpeed = speed * (speaking ? 3 : 1);
            ref.current.rotation.x += delta * currentSpeed * axis[0];
            ref.current.rotation.y += delta * currentSpeed * axis[1];
            ref.current.rotation.z += delta * currentSpeed * axis[2];
        }
    });

    const active = hovered || speaking;

    return (
        <mesh ref={ref}>
            <torusGeometry args={[radius, 0.015, 16, 100]} />
            <meshStandardMaterial
                color={active ? '#46c4f3' : '#1b6ca8'}
                emissive={active ? '#46c4f3' : '#1b6ca8'}
                emissiveIntensity={active ? 1.0 : 0.5}
                transparent
                opacity={active ? 0.7 : 0.4}
            />
        </mesh>
    );
};

// ─── Full 3D Scene ───────────────────────────────────────────────
const OrbScene = ({ hovered, speaking }: { hovered: boolean; speaking: boolean }) => {
    return (
        <>
            <ambientLight intensity={0.3} />
            <pointLight position={[3, 3, 3]} intensity={1.5} color="#46c4f3" />
            <pointLight position={[-3, -2, 2]} intensity={0.5} color="#1cd3a2" />

            <Float speed={speaking ? 4 : 2} rotationIntensity={speaking ? 0.8 : 0.4} floatIntensity={speaking ? 1.0 : 0.6}>
                <OrbCore hovered={hovered} speaking={speaking} />

                {/* Orbital rings */}
                <OrbitalRing axis={[0.3, 1, 0.2]} speed={0.8} radius={1.4} hovered={hovered} speaking={speaking} />
                <OrbitalRing axis={[1, 0.2, 0.5]} speed={-0.6} radius={1.6} hovered={hovered} speaking={speaking} />
                <OrbitalRing axis={[0.1, 0.5, 1]} speed={0.5} radius={1.8} hovered={hovered} speaking={speaking} />

                {/* Sparkle particles */}
                <Sparkles
                    count={speaking ? 100 : (hovered ? 50 : 25)}
                    scale={3.5}
                    size={speaking ? 5 : (hovered ? 3 : 2)}
                    speed={speaking ? 1.5 : 0.5}
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
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const supportsWebGL = useMemo(() => isWebGLSupported(), []);

    const phrases = [
        "Olá! Estou analisando os dados para você...",
        "Um momento, processando sua solicitação com inteligência artificial.",
        "Estou aqui para ajudar! Preparando o ambiente virtual.",
        "Conectando ao banco de conhecimentos do ExamePad...",
        "Iniciando protocolo de tutoria avançada..."
    ];

    const handleClick = () => {
        if (isExpanded) return; // Prevent double trigger

        setIsExpanded(true);
        setIsHovered(false); // remove tooltip

        // Small delay to let the visual expansion animate before speaking
        setTimeout(() => {
            setIsSpeaking(true);
            const phrase = phrases[Math.floor(Math.random() * phrases.length)];

            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(phrase);
                utterance.lang = 'pt-BR';
                utterance.rate = 1.1;
                utterance.pitch = 1.1;

                utterance.onend = () => {
                    setIsSpeaking(false);
                    setTimeout(() => {
                        setIsExpanded(false);
                        setTimeout(() => navigate('/aluno/tutor'), 600);
                    }, 500);
                };

                window.speechSynthesis.speak(utterance);
            } else {
                // Fallback timeout
                setTimeout(() => {
                    setIsSpeaking(false);
                    setIsExpanded(false);
                    setTimeout(() => navigate('/aluno/tutor'), 600);
                }, 3000);
            }
        }, 400);
    };

    return (
        <div
            className={`ai-orb-container ${isExpanded ? 'expanded' : ''}`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Tooltip */}
            {isHovered && !isExpanded && (
                <div className="ai-orb-tooltip">
                    Posso ajudar? 🧠
                </div>
            )}

            {supportsWebGL ? (
                <div className={`ai-orb-canvas-wrapper ${isExpanded ? 'expanded' : ''}`} onClick={handleClick}>
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
                            <OrbScene hovered={isHovered} speaking={isSpeaking} />
                        </Canvas>
                    </Suspense>
                </div>
            ) : (
                <FallbackButton onClick={handleClick} />
            )}
        </div>
    );
};
