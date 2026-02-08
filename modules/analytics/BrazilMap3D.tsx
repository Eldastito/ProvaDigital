
import React, { useMemo, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center, Text, Float, Stars, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
// @ts-ignore
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { BRAZIL_STATES } from './GeoMap';

// --- Types ---
interface DataPoint {
    id: string;
    x: number; // Percent 0-100
    y: number; // Percent 0-100
    label: string;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
    value: number;
}

interface BrazilMap3DProps {
    dataPoints: DataPoint[];
    onSelect?: (id: string) => void;
}

// --- Constants ---
const MAP_WIDTH = 612;
const MAP_HEIGHT = 650;
const EXTRUDE_DEPTH = 10;

// --- Colors ---
const COLOR_STATE_DEFAULT = '#1e293b'; // Slate-800
const COLOR_STATE_HOVER = '#334155';   // Slate-700
const COLOR_STATE_ACTIVE = '#0f172a';  // Slate-900
const COLOR_STROKE = '#475569';        // Slate-600

const STATUS_COLORS = {
    NORMAL: '#34d399',  // Emerald-400
    WARNING: '#fbbf24', // Amber-400
    CRITICAL: '#f43f5e', // Rose-500
};

// --- Helper Components ---

const StateMesh = ({ uf, pathData, isHovered, onHover, onClick }: any) => {
    const shape = useMemo(() => {
        try {
            const loader = new SVGLoader();
            const path = loader.parse(pathData).paths[0];
            if (!path) {
                console.warn(`No path found for UF: ${uf}`);
                return null;
            }
            const shapes = path.toShapes(true);
            return shapes[0];
        } catch (e) {
            console.error(`Error parsing SVG for UF: ${uf}`, e);
            return null;
        }
    }, [pathData, uf]);

    if (!shape) return null;

    // Spring-like hover animation (simple lerp in useFrame could be added for smoothness)

    return (
        <mesh
            onClick={(e) => {
                e.stopPropagation();
                onClick && onClick(uf);
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                onHover(uf);
            }}
            onPointerOut={() => onHover(null)}
            position={[0, 0, isHovered ? 5 : 0]} // "Lift" effect
        >
            <extrudeGeometry args={[shape, { depth: EXTRUDE_DEPTH, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2 }]} />
            <meshStandardMaterial
                color={isHovered ? COLOR_STATE_HOVER : COLOR_STATE_DEFAULT}
                roughness={0.4}
                metalness={0.3}
                side={THREE.DoubleSide}
            />
            {/* Outline edge hack or wireframe could go here, but simple is better for perf */}
        </mesh>
    );
};

const DataOrb = ({ point }: { point: DataPoint }) => {
    // Coordinate mapping:
    // SVG X (0-612) -> 3D X
    // SVG Y (0-650) -> 3D Y (Inverted because SVG Y is down)

    const x = point.x * (MAP_WIDTH / 100);
    const y = (100 - point.y) * (MAP_HEIGHT / 100); // Invert Y percent before scaling? No, logic depends on how SVG coords work. 
    // SVG Y=0 is top. Three Y=0 is center (usually) but here we are drawing in SVG coords.
    // In SVGLoader, Y is usually inverted relative to Three.js Y. 
    // Let's assume we maintain the SVG coordinate system grouping and just flip the whole group or camera.
    // Actually, `SVGLoader` usually creates shapes where +Y is DOWN if not handled. 
    // But `toShapes` creates standard 2D shapes.
    // Let's stick to the raw map coordinates. SVG Path data usually has Y growing downwards.
    // DataPoints are 0-100% relative to the box. 0,0 is Top-Left.
    // So x = point.x * W / 100. y = point.y * H / 100.

    const posX = (point.x / 100) * MAP_WIDTH;
    const posY = (point.y / 100) * MAP_HEIGHT;

    // We need to match the SVG geometry. SVG paths Y grows DOWN.
    // In Three.js, we usually want Y UP. 
    // We will render the map with scale={[1, -1, 1]} to flip Y, matching SVG.

    const color = STATUS_COLORS[point.status];
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y = meshRef.current.position.y + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        }
    });

    return (
        <group position={[posX, posY, EXTRUDE_DEPTH + 10]}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh ref={meshRef}>
                    <sphereGeometry args={[8, 32, 32]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={0.5}
                        toneMapped={false}
                    />
                </mesh>
                <pointLight color={color} intensity={1} distance={50} decay={2} />
            </Float>

            {/* Html Tooltip or Label could go here */}
            {point.status === 'CRITICAL' && (
                <Html position={[0, 15, 0]} center pointerEvents="none">
                    <div className="px-2 py-1 bg-rose-500/90 text-white text-[10px] font-bold rounded shadow-lg backdrop-blur whitespace-nowrap">
                        ! {point.value.toFixed(1)}
                    </div>
                </Html>
            )}
        </group>
    );
};

export const BrazilMap3D = ({ dataPoints, onSelect }: BrazilMap3DProps) => {
    const [hoveredUF, setHoveredUF] = useState<string | null>(null);

    return (
        <div className="w-full h-full min-h-[500px] bg-slate-900 rounded-2xl overflow-hidden relative shadow-2xl">
            {/* Title / Legend Overlay */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h2 className="text-white font-black text-xl tracking-tight opacity-50">BRAZIL 3D</h2>
                <p className="text-emerald-400 text-xs font-mono">LIVE MONITORING</p>
            </div>

            <Canvas camera={{ position: [300, 300, 600], fov: 45 }}>
                <color attach="background" args={['#0f172a']} />
                <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    minDistance={200}
                    maxDistance={1200}
                    // Limit angles to keep map viewable
                    maxPolarAngle={Math.PI / 2.2}
                />

                <ambientLight intensity={0.2} />
                <directionalLight position={[100, 200, 100]} intensity={1} castShadow />
                <pointLight position={[-100, -100, 200]} intensity={0.5} color="#blue" />

                <Center top>
                    <group scale={[1, -1, 1]}> {/* Flip Y to match SVG coordinate system */}
                        {/* Map States */}
                        {Object.entries(BRAZIL_STATES).map(([uf, path]) => (
                            <StateMesh
                                key={uf}
                                uf={uf}
                                pathData={path}
                                isHovered={hoveredUF === uf}
                                onHover={setHoveredUF}
                                onClick={onSelect}
                            />
                        ))}

                        {/* Data Points */}
                        {dataPoints.map(point => (
                            <DataOrb key={point.id} point={point} />
                        ))}
                    </group>
                </Center>

                <Environment preset="city" />
            </Canvas>
        </div>
    );
};
