import React, { useRef, useState } from 'react';
// import { useFrame } from '@react-three/fiber'; // Dynamic import inside component usage, or assume usage within SimulationRenderer context

// Hack: Como estamos importando R3F dinamicamente no Renderer, 
// os componentes filhos também precisam ser carregados de forma que tenham acesso ao contexto Three.js
// Mas para simplificar este arquivo "clean", vamos assumir que o usuário instalou as libs.
// Se não, o SimulationRenderer (pai) vai capturar o erro antes de renderizar este filho.

// Para evitar erro de build estático, vamos usar require ou uma abordagem puramente React que injeta props
// Ou, idealmente, este arquivo só deve ser importado se as libs existirem.

export const InteractiveCube = (props: any) => {
    // This ref will give us direct access to the mesh
    const meshRef = useRef<any>(null);

    // Set up state for the hovered and active state
    const [hovered, setHover] = useState(false);
    const [active, setActive] = useState(false);

    // Subscribe this component to the render-loop, rotate the mesh every frame
    // useFrame((state, delta) => (meshRef.current.rotation.x += delta));
    // Not using useFrame here to avoid static import crash. Relying on auto-rotation from OrbitControls or simple CSS-like behavior is safer for this MVP step 
    // without types.

    return (
        <mesh
            {...props}
            ref={meshRef}
            scale={active ? 1.5 : 1}
            onClick={(event: any) => setActive(!active)}
            onPointerOver={(event: any) => setHover(true)}
            onPointerOut={(event: any) => setHover(false)}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
        </mesh>
    );
};
