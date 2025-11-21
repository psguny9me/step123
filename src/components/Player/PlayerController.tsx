import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

export const PlayerController: React.FC = () => {
    const { camera } = useThree();
    const currentFloor = useGameStore((state) => state.currentFloor);
    const step = useGameStore((state) => state.step);
    const takeDamage = useGameStore((state) => state.takeDamage);
    const isPlaying = useGameStore((state) => state.isPlaying);

    // Head bobbing state
    const bobTime = useRef(0);

    // Input handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPlaying) return;

            // Prevent default scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }

            // Movement Logic
            let inputDir = '';
            if (e.key === 'ArrowLeft' || e.key === 'a') inputDir = 'left';
            if (e.key === 'ArrowRight' || e.key === 'd') inputDir = 'right';
            if (e.key === 'ArrowUp' || e.key === 'w') inputDir = 'up';

            if (!inputDir) return;

            step(inputDir);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, step]);

    // Energy Decay over time
    useFrame((state, delta) => {
        if (!isPlaying) return;
        // Decay energy slowly over time (e.g., 5 per second)
        takeDamage(delta * 2);
    });

    // Update loop
    useFrame((state, delta) => {
        if (!isPlaying) return;

        // Lerp camera to target
        const stairs = useGameStore.getState().stairs;
        const totalSteps = useGameStore.getState().totalSteps;

        // We want to be at the stair corresponding to our totalSteps count.
        // However, since we might be between steps or moving, let's target the "current" step.
        const targetStair = stairs.find(s => s.id === totalSteps);

        if (targetStair) {
            const targetY = targetStair.position[1] + 2;
            const targetX = targetStair.position[0];
            const targetZ = targetStair.position[2];

            // Head bobbing
            bobTime.current += delta * 15;
            const bobOffset = Math.sin(bobTime.current) * 0.15;

            camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, delta * 5);
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY + bobOffset, delta * 5);
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 5);

            // Look direction
            // Look at a stair a few steps ahead to anticipate turns
            const lookAtStair = stairs.find(s => s.id === totalSteps + 3);
            if (lookAtStair) {
                camera.lookAt(lookAtStair.position[0], lookAtStair.position[1], lookAtStair.position[2]);
            } else {
                // Fallback look
                camera.lookAt(targetX, targetY, targetZ - 5);
            }
        }
    });

    return null;
};
