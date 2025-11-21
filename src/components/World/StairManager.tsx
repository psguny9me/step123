import React from 'react';
import { Stair } from './Stair';
import { useGameStore } from '../../store/gameStore';

export const StairManager: React.FC = () => {
    const stairs = useGameStore((state) => state.stairs);

    return (
        <group>
            {stairs.map((stair) => (
                <Stair
                    key={stair.id}
                    id={stair.id}
                    position={stair.position}
                    rotation={stair.rotation}
                    isLanding={stair.isLanding}
                />
            ))}
        </group>
    );
};
