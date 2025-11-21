import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface StairProps {
    position: [number, number, number];
    rotation: [number, number, number];
    isLanding: boolean;
    id: number;
}

export const Stair: React.FC<StairProps> = ({ position, rotation = [0, 0, 0], isLanding = false, id = 0 }) => {
    // Calculate floor number based on id (assuming 12 steps per flight + 1 landing)
    const floorNum = Math.floor((id + 1) / 13) + 1;

    return (
        <group position={position} rotation={rotation}>
            {/* Step Visual */}
            <mesh position={[0, 0, 0]} receiveShadow castShadow>
                <boxGeometry args={isLanding ? [3, 0.5, 3] : [2, 0.5, 1]} />
                <meshStandardMaterial color={isLanding ? "#ff6b6b" : "#4ecdc4"} roughness={0.8} />
            </mesh>

            {/* Floor Number on Landing */}
            {isLanding && (
                <Text
                    position={[0, 0.26, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    fontSize={1.5}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                >
                    {floorNum + "F"}
                </Text>
            )}

            {/* Railings */}
            {!isLanding && (
                <>
                    {/* Normal Stair Railings (Left/Right) */}
                    <group position={[-1.1, 0, 0]}>
                        <mesh position={[0, 1, -0.4]}><boxGeometry args={[0.1, 2, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
                        <mesh position={[0, 1, 0.4]}><boxGeometry args={[0.1, 2, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
                        <mesh position={[0, 2, 0]}><boxGeometry args={[0.15, 0.1, 1]} /><meshStandardMaterial color="#555" /></mesh>
                    </group>
                    <group position={[1.1, 0, 0]}>
                        <mesh position={[0, 1, -0.4]}><boxGeometry args={[0.1, 2, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
                        <mesh position={[0, 1, 0.4]}><boxGeometry args={[0.1, 2, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
                        <mesh position={[0, 2, 0]}><boxGeometry args={[0.15, 0.1, 1]} /><meshStandardMaterial color="#555" /></mesh>
                    </group>
                </>
            )}

            {/* Landing: No Railings to ensure open path for turns */}

            {/* Decorative Lines */}
            <lineSegments position={[0, 0.26, 0]}>
                <edgesGeometry args={[isLanding ? new THREE.BoxGeometry(3, 0.5, 3) : new THREE.BoxGeometry(2, 0.5, 1)]} />
                <lineBasicMaterial color="black" linewidth={2} />
            </lineSegments>
        </group>
    );
};
