import React, { Suspense, useState, useEffect } from 'react';
import { AlertTriangle, Box } from 'lucide-react';

// Tipagem frouxa para evitar erro de build se a lib não existir
// Em um cenário real com types instalados, usaríamos os tipos corretos
type CanvasProps = any;

// Wrapper interno que faz o import real das libs 3D
const ThreeCanvasLoader = React.lazy(async () => {
    try {
        // Tenta importar as bibliotecas 3D
        // @ts-ignore - Ignora erro de compilação se a lib não existir no build time
        const { Canvas } = await import('@react-three/fiber');
        // @ts-ignore
        const { OrbitControls, Environment } = await import('@react-three/drei');

        // Retorna um componente que usa essas libs
        return {
            default: ({ children }: { children: React.ReactNode }) => (
                <Canvas className="h-full w-full bg-slate-900 rounded-xl" camera={{ position: [0, 0, 5] }}>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                    <pointLight position={[-10, -10, -10]} />

                    {children}

                    <OrbitControls />
                    <Environment preset="city" />
                </Canvas>
            )
        };
    } catch (error) {
        console.error("Falha ao carregar motor 3D:", error);
        return {
            default: () => <ThreeDependencyError />
        };
    }
});

const threeDependencyCheck = async () => {
    try {
        // @ts-ignore
        await import('three');
        // @ts-ignore
        await import('@react-three/fiber');
        return true;
    } catch (e) {
        return false;
    }
}

const ThreeDependencyError = () => (
    <div className="flex flex-col items-center justify-center h-full bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
        <Box size={48} className="text-slate-400 mb-4" />
        <h3 className="font-bold text-slate-700 text-lg">Bibliotecas 3D Ausentes</h3>
        <p className="text-slate-500 max-w-sm my-2">
            O motor de simulação requer bibliotecas adicionais.
        </p>
        <div className="bg-slate-800 text-slate-200 p-3 rounded-lg font-mono text-xs text-left mt-2">
            npm install three @types/three @react-three/fiber @react-three/drei
        </div>
    </div>
);

interface SimulationRendererProps {
    children?: React.ReactNode;
}

export const SimulationRenderer: React.FC<SimulationRendererProps> = ({ children }) => {
    const [hasLibs, setHasLibs] = useState<boolean | null>(null);

    useEffect(() => {
        threeDependencyCheck().then(setHasLibs);
    }, []);

    if (hasLibs === false) {
        return <div className="h-[400px] w-full"><ThreeDependencyError /></div>;
    }

    return (
        <div className="h-[400px] w-full relative group">
            <Suspense fallback={
                <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                </div>
            }>
                <ThreeCanvasLoader>
                    {children}
                </ThreeCanvasLoader>
            </Suspense>

            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                Powered by R3F
            </div>
        </div>
    );
};
