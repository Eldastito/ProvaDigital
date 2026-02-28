import React, { Suspense, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows, Environment, Sphere, Cylinder, Cone, Torus, Box, useGLTF } from '@react-three/drei';
import { Maximize, Minimize, MousePointer2, RefreshCw } from 'lucide-react';
import * as THREE from 'three';
import '../../styles/interactive-3d-viewer.css';

// ==========================================
// PROCEDURAL MODELS CATALOG
// ==========================================

const ModelCube = () => (
    <group>
        <Box args={[2, 2, 2]}>
            <meshStandardMaterial color="#1b6ca8" roughness={0.4} metalness={0.2} />
        </Box>
        <Box args={[2.01, 2.01, 2.01]}> {/* Wireframe overlay */}
            <meshBasicMaterial color="#ffffff" wireframe />
        </Box>
        <Html position={[1, 1, 1]}><div className="vr-label">Vértice</div></Html>
        <Html position={[0, 1.1, 0]}><div className="vr-label">Face Superior</div></Html>
    </group>
);

const ModelSphere = () => (
    <group>
        <Sphere args={[1.5, 32, 32]}>
            <meshStandardMaterial color="#0ca3e1" roughness={0.3} metalness={0.4} />
        </Sphere>
        <Sphere args={[1.51, 16, 12]}>
            <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.3} />
        </Sphere>
        <Html position={[0, 1.6, 0]}><div className="vr-label">Pólo Norte</div></Html>
        <Html position={[1.6, 0, 0]}><div className="vr-label">Equador</div></Html>
    </group>
);

const ModelCylinder = () => (
    <group>
        <Cylinder args={[1, 1, 3, 32]}>
            <meshStandardMaterial color="#1cd3a2" roughness={0.5} metalness={0.1} />
        </Cylinder>
        <Html position={[0, 1.6, 0]}><div className="vr-label">Base Superior (πr²)</div></Html>
        <Html position={[1.1, 0, 0]}><div className="vr-label">Altura (h)</div></Html>
    </group>
);

const ModelTorus = () => (
    <group>
        <Torus args={[1.5, 0.5, 16, 100]}>
            <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.8} />
        </Torus>
        <Html position={[0, 0, 0]}><div className="vr-label">Centro</div></Html>
        <Html position={[1.5, 0.6, 0]}><div className="vr-label">Raio Menor</div></Html>
    </group>
);

const ModelPyramid = () => (
    <group>
        {/* Usando Cylinder com radiusTop=0 para fazer uma pirâmide/cone de base quadrada */}
        <Cylinder args={[0, 1.5, 2.5, 4]}>
            <meshStandardMaterial color="#8b5cf6" roughness={0.6} metalness={0.1} />
        </Cylinder>
        <Cylinder args={[0, 1.51, 2.5, 4]}>
            <meshBasicMaterial color="#ffffff" wireframe />
        </Cylinder>
        <Html position={[0, 1.4, 0]}><div className="vr-label">Ápice</div></Html>
        <Html position={[1.2, -1.2, 1.2]}><div className="vr-label">Aresta da Base</div></Html>
    </group>
);

const ModelWaterMolecule = () => {
    // H2O: 1 Oxigênio (maior, vermelho), 2 Hidrogênios (menores, brancos)
    return (
        <group>
            {/* Oxigênio */}
            <Sphere args={[0.8, 32, 32]} position={[0, 0, 0]}>
                <meshStandardMaterial color="#ef4444" roughness={0.2} metalness={0.5} />
            </Sphere>
            <Html position={[0, 1.1, 0]}><div className="vr-label text-red-100">Oxigênio (O)</div></Html>

            {/* Hidrogênio 1 */}
            <Sphere args={[0.5, 32, 32]} position={[-0.8, -0.6, 0]}>
                <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
            </Sphere>
            <Html position={[-1.2, -1, 0]}><div className="vr-label">Hidrogênio (H)</div></Html>

            {/* Hidrogênio 2 */}
            <Sphere args={[0.5, 32, 32]} position={[0.8, -0.6, 0]}>
                <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
            </Sphere>
            <Html position={[1.2, -1, 0]}><div className="vr-label">Hidrogênio (H)</div></Html>

            {/* Ligações Covalentes (Bonds) */}
            <Cylinder args={[0.1, 0.1, 1.1]} position={[-0.4, -0.3, 0]} rotation={[0, 0, Math.PI / 4]}>
                <meshStandardMaterial color="#94a3b8" />
            </Cylinder>
            <Cylinder args={[0.1, 0.1, 1.1]} position={[0.4, -0.3, 0]} rotation={[0, 0, -Math.PI / 4]}>
                <meshStandardMaterial color="#94a3b8" />
            </Cylinder>
        </group>
    );
};

const ModelDNA = () => {
    // Hélice dupla simples usando instâncias ou array
    const pairs = 12;
    const groupRef = useRef<THREE.Group>(null!);

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.2; // Rotação lenta contínua
        }
    });

    return (
        <group ref={groupRef} position={[0, -2.5, 0]}>
            {Array.from({ length: pairs }).map((_, i) => {
                const y = i * 0.4;
                const angle = i * 0.5;
                const x1 = Math.cos(angle) * 1;
                const z1 = Math.sin(angle) * 1;
                const x2 = Math.cos(angle + Math.PI) * 1;
                const z2 = Math.sin(angle + Math.PI) * 1;

                return (
                    <group key={i} position={[0, y, 0]}>
                        {/* Fita A */}
                        <Sphere args={[0.15, 16, 16]} position={[x1, 0, z1]}>
                            <meshStandardMaterial color="#0ca3e1" />
                        </Sphere>
                        {/* Fita B */}
                        <Sphere args={[0.15, 16, 16]} position={[x2, 0, z2]}>
                            <meshStandardMaterial color="#1cd3a2" />
                        </Sphere>
                        {/* Ponte (Base Nitrogenada) */}
                        <Cylinder
                            args={[0.05, 0.05, 2]}
                            position={[0, 0, 0]}
                            rotation={[Math.PI / 2, 0, -angle]}
                        >
                            <meshStandardMaterial color={i % 2 === 0 ? "#f59e0b" : "#8b5cf6"} />
                        </Cylinder>
                    </group>
                );
            })}
            <Html position={[1.5, 2.4, 1]}><div className="vr-label">Hélice Dupla</div></Html>
            <Html position={[-1.5, 1.2, -1]}><div className="vr-label">Bases Nitrogenadas</div></Html>
        </group>
    );
};

const ModelGLB = ({ url, explodeFactor = 0 }: { url: string; explodeFactor?: number }) => {
    const { scene } = useGLTF(url);
    const originalPositions = useRef<Map<THREE.Object3D, THREE.Vector3>>(new Map());

    // Capture and apply displacement
    useFrame(() => {
        scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh || obj instanceof THREE.Group) {
                // Initialize original positions if not already stored
                if (!originalPositions.current.has(obj)) {
                    originalPositions.current.set(obj, obj.position.clone());
                }

                const origPos = originalPositions.current.get(obj)!;

                // Explode logic: move away from model center
                // Simple version: use relative world direction from (0,0,0)
                const dir = origPos.clone().normalize();

                // If it's at world zero, give it a tiny random push so it moves
                if (dir.lengthSq() === 0) dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();

                obj.position.x = origPos.x + dir.x * explodeFactor * 5;
                obj.position.y = origPos.y + dir.y * explodeFactor * 5;
                obj.position.z = origPos.z + dir.z * explodeFactor * 5;
            }
        });
    });

    return <primitive object={scene} scale={1.5} />;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

interface Interactive3DViewerProps {
    preset?: string;
    description?: string;
}

// Map of presets
const PRESET_MAP: Record<string, React.FC> = {
    'preset:cube': ModelCube,
    'preset:sphere': ModelSphere,
    'preset:cylinder': ModelCylinder,
    'preset:torus': ModelTorus,
    'preset:pyramid': ModelPyramid,
    'preset:molecule_h2o': ModelWaterMolecule,
    'preset:dna_helix': ModelDNA,
};

export const Interactive3DViewer: React.FC<Interactive3DViewerProps> = ({
    preset = 'preset:cube',
    description = 'Modelo 3D Interativo'
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    };

    // Listen to fullscreen changes to update exact state
    React.useEffect(() => {
        const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    const [supportsWebGL, setSupportsWebGL] = useState(true);
    const [explodeFactor, setExplodeFactor] = useState(0);

    // Check WebGL support
    React.useEffect(() => {
        try {
            const canvas = document.createElement('canvas');
            setSupportsWebGL(!!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))));
        } catch {
            setSupportsWebGL(false);
        }
    }, [preset]); // Re-eval if remounts

    const isSketchfab = preset.startsWith('sketchfab:') || preset.includes('sketchfab.com/3d-models/');
    const isGLB = preset.endsWith('.glb') || preset.includes('.glb?') || preset.startsWith('https://'); // Supabase URLs or direct links

    // Determine which component to use
    let ModelComponent: React.FC<any> = PRESET_MAP[preset] || ModelCube;
    if (isGLB && !isSketchfab) {
        ModelComponent = () => <ModelGLB url={preset} explodeFactor={explodeFactor} />;
    }

    if (!supportsWebGL && !isSketchfab) {
        return (
            <div className="p-4 bg-slate-100 border rounded-xl text-center text-slate-500 mb-6 py-12">
                <p>O seu navegador ou dispositivo atual não suporta visualização em 3D.</p>
                <p className="text-xs mt-2 opacity-70">Alternativa descritiva: {description}</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`interactive-3d-viewer interactive-3d-viewer-container ${isFullscreen ? 'fullscreen' : ''}`}
        >
            {/* Header Toolbar */}
            <div className="interactive-3d-header">
                <div className="interactive-3d-title-group">
                    <div className="interactive-3d-badge">
                        <div className="interactive-3d-dot" />
                        3D
                    </div>
                    <span className="interactive-3d-title">Modo Inspeção</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="interactive-3d-instructions hidden sm:flex">
                        <MousePointer2 size={14} />
                        <span>Arraste para girar • Scroll para zoom</span>
                    </div>

                    <div className="interactive-3d-actions">
                        <button onClick={toggleFullscreen} title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}>
                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                    </div>
                </div>

                {/* NATIVE EXPLODE TOOLBAR (Only for GLB) */}
                {isGLB && !isSketchfab && (
                    <div className="bg-indigo-50/80 border-b border-indigo-100 px-4 py-2 flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 whitespace-nowrap">
                            <RefreshCw size={14} className={explodeFactor > 0 ? "animate-pulse" : ""} />
                            DECOMPOR PEÇAS:
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={explodeFactor}
                            onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                            className="flex-1 accent-indigo-600 h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-indigo-500 w-8">{Math.round(explodeFactor * 100)}%</span>
                        <button
                            onClick={() => setExplodeFactor(0)}
                            className="p-1 hover:bg-white rounded transition-colors text-indigo-600"
                            title="Resetar"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* WebGL Viewport or Iframe */}
            <div className="interactive-3d-canvas-wrapper" aria-label={description}>
                {isSketchfab ? (
                    (() => {
                        let uid = '';
                        let queryStr = 'autostart=1';

                        if (preset.startsWith('sketchfab:')) {
                            const raw = preset.replace('sketchfab:', '');
                            const split = raw.split('?');
                            uid = split[0];
                            // Default params: autostart, inspector ON, infos OFF, settings ON
                            queryStr = split[1] || 'autostart=1&ui_inspector=1&ui_infos=0&ui_settings=1&ui_help=0';
                        } else if (preset.includes('sketchfab.com/3d-models/')) {
                            // URL format: https://sketchfab.com/3d-models/name-ID
                            const urlObj = preset.split('?');
                            const pathParts = urlObj[0].split('-');
                            uid = pathParts[pathParts.length - 1];
                            // Default params
                            queryStr = urlObj[1] || 'autostart=1&ui_inspector=1&ui_infos=0&ui_settings=1&ui_help=0';
                        }

                        // Force these to ensure visibility of the "Model Inspector" button
                        if (!queryStr.includes('ui_inspector')) queryStr += '&ui_inspector=1';
                        if (!queryStr.includes('ui_settings')) queryStr += '&ui_settings=1';
                        if (!queryStr.includes('ui_infos')) queryStr += '&ui_infos=0';
                        if (!queryStr.includes('ui_help')) queryStr += '&ui_help=0';
                        if (!queryStr.includes('autostart')) queryStr += '&autostart=1';

                        const src = `https://sketchfab.com/models/${uid}/embed?${queryStr}`;
                        return (
                            <iframe
                                title={description}
                                src={src}
                                allow="autoplay; fullscreen; xr-spatial-tracking"
                                execution-while-out-of-viewport="true"
                                execution-while-not-rendered="true"
                                web-share="true"
                                className="w-full h-full border-0 absolute inset-0"
                            ></iframe>
                        );
                    })()
                ) : (
                    <Suspense fallback={
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                            <RefreshCw className="animate-spin" size={24} />
                        </div>
                    }>
                        <Canvas camera={{ position: [0, 0, 5], fov: 50 }} shadows>
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
                            <pointLight position={[-10, -10, -10]} intensity={0.5} />

                            <Environment preset="city" />

                            <group position={[0, -0.5, 0]}>
                                <ModelComponent />
                                <ContactShadows
                                    position={[0, -2, 0]}
                                    opacity={0.4}
                                    scale={10}
                                    blur={2}
                                    far={4}
                                    color="#000000"
                                />
                            </group>

                            <OrbitControls
                                enablePan={true}
                                enableZoom={true}
                                enableRotate={true}
                                makeDefault
                                minDistance={2}
                                maxDistance={10}
                            />
                        </Canvas>
                    </Suspense>
                )}
            </div>
        </div>
    );
};
