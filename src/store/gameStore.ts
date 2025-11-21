import { create } from 'zustand';
import { sfx } from '../utils/audio';
import * as THREE from 'three';

export interface StairData {
  id: number;
  position: [number, number, number];
  rotation: [number, number, number];
  isLanding: boolean;
  direction: THREE.Vector3;
}

interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  currentFloor: number;
  energy: number;
  maxEnergy: number;
  score: number;
  bpm: number;
  combo: number;
  lastStepTime: number;
  totalSteps: number;
  lastResult: 'Perfect' | 'Great' | 'Good' | 'Bad' | 'Miss' | null;
  nextInput: 'left' | 'right';

  // Stair State
  stairs: StairData[];

  // Actions
  startGame: () => void;
  step: (inputDirection: string) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  reset: () => void;
  initStairs: () => void;
}

// Helper to generate stairs
const generateStair = (prevStair: StairData | null, id: number): StairData => {
  const STEP_HEIGHT = 0.5;
  const STEP_DEPTH = 1.0;
  const STEPS_PER_FLIGHT = 12;

  if (!prevStair) {
    return {
      id: 0,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      isLanding: false,
      direction: new THREE.Vector3(0, 0, -1)
    };
  }

  // Logic to determine if next is landing
  const isLanding = (id + 1) % (STEPS_PER_FLIGHT + 1) === 0;

  const newPos = new THREE.Vector3(...prevStair.position);
  const currentDir = prevStair.direction.clone();

  if (prevStair.isLanding) {
    // We are coming FROM a landing. The previous stair WAS a landing.
    // We need to have turned.
    // Wait, the landing itself is where we turn.
    // So if prev was landing, we are now starting a new flight.

    // Random turn direction was decided AT the landing generation?
    // Or we decide it now?
    // Let's decide turn when we create the landing, or deterministically based on ID.
    // Let's say odd landings turn left, even turn right? Or random.
    const turnRight = Math.random() > 0.5;
    const axis = new THREE.Vector3(0, 1, 0);
    const newDir = currentDir.clone().applyAxisAngle(axis, turnRight ? -Math.PI / 2 : Math.PI / 2);
    newDir.round();

    newPos.add(newDir.clone().multiplyScalar(STEP_DEPTH * 2));
    newPos.y += STEP_HEIGHT;

    return {
      id,
      position: [newPos.x, newPos.y, newPos.z],
      rotation: [0, Math.atan2(newDir.x, newDir.z) + Math.PI, 0],
      isLanding: false,
      direction: newDir
    };
  } else {
    // Normal step
    // If the NEXT one (current one we are building) is a landing, we need more space
    // because landing is deeper (3.0 vs 1.0).
    // Previous (Normal, depth 1) -> Current (Landing, depth 3).
    // Center to Center distance should be 0.5 + 1.5 = 2.0.
    // Currently STEP_DEPTH is 1.0.
    const distance = isLanding ? 2.0 : STEP_DEPTH;

    newPos.add(currentDir.clone().multiplyScalar(distance));
    newPos.y += STEP_HEIGHT;

    return {
      id,
      position: [newPos.x, newPos.y, newPos.z],
      rotation: prevStair.rotation,
      isLanding: isLanding,
      direction: currentDir
    };
  }
};

export const useGameStore = create<GameState>((set, get) => ({
  isPlaying: false,
  isGameOver: false,
  currentFloor: 1,
  energy: 100,
  maxEnergy: 100,
  score: 0,
  bpm: 100, // Starting BPM
  combo: 0,
  lastStepTime: 0,
  totalSteps: 0,
  lastResult: null,
  nextInput: 'left', // Start with left
  stairs: [],

  initStairs: () => {
    const stairs: StairData[] = [];
    let prev: StairData | null = null;
    for (let i = 0; i < 50; i++) {
      const newStair = generateStair(prev, i);
      stairs.push(newStair);
      prev = newStair;
    }
    set({ stairs });
  },

  startGame: () => {
    get().initStairs();
    set({ isPlaying: true, isGameOver: false, energy: 100, currentFloor: 1, score: 0, bpm: 100, combo: 0, lastStepTime: Date.now(), totalSteps: 0, lastResult: null, nextInput: 'left' });
  },

  step: (inputDirection: string) => set((state) => {
    const now = Date.now();
    const beatInterval = 60000 / state.bpm;
    const timeSinceLast = now - state.lastStepTime;
    const error = Math.abs(timeSinceLast - beatInterval);

    // Input Validation (Must match nextInput)
    // Map 'a'/'ArrowLeft' to 'left', 'd'/'ArrowRight' to 'right'
    let normalizedInput = inputDirection;
    if (inputDirection === 'a' || inputDirection === 'ArrowLeft') normalizedInput = 'left';
    if (inputDirection === 'd' || inputDirection === 'ArrowRight') normalizedInput = 'right';

    if (normalizedInput !== state.nextInput) {
      sfx.miss.play();
      // Even on wrong key, we should probably update time or penalty?
      // If we don't update time, they can spam keys until they hit the right one?
      // Let's just penalize and NOT update time, forcing them to wait for rhythm?
      // Or update time to prevent spam?
      // Let's update time to now, effectively "wasting" a beat.
      return {
        energy: Math.max(0, state.energy - 5),
        combo: 0,
        lastResult: 'Miss',
        lastStepTime: now // Update time to prevent spam/stuck
      };
    }

    let result: 'Perfect' | 'Great' | 'Good' | 'Bad' | 'Miss' = 'Miss';
    let energyChange = 0;
    let scoreAdd = 0;
    let isSuccess = false;

    // RESUME LOGIC: If pause is too long (> 1.5s), treat as a fresh start
    if (state.totalSteps === 0 || timeSinceLast > 1500) {
      result = 'Perfect';
      isSuccess = true;
      sfx.step.play();
      // No combo increase for resume, but no penalty
      scoreAdd = 10;
    } else {
      if (error < 100) {
        result = 'Perfect';
        energyChange = 1;
        scoreAdd = 100 + state.combo * 10;
        isSuccess = true;
      } else if (error < 150) {
        result = 'Great';
        energyChange = 0;
        scoreAdd = 80 + state.combo * 5;
        isSuccess = true;
      } else if (error < 250) {
        result = 'Good';
        energyChange = -1;
        scoreAdd = 50;
        isSuccess = true;
      } else {
        result = 'Bad';
        energyChange = -5;
        scoreAdd = 0;
        isSuccess = false;
      }
    }

    if (isSuccess) {
      sfx.step.rate(1.0 + Math.min(state.combo, 20) * 0.01);
      sfx.step.play();

      const newTotalSteps = state.totalSteps + 1;
      const newFloor = Math.floor(newTotalSteps / 13) + 1;
      const newBpm = state.bpm + (newTotalSteps % 10 === 0 && newTotalSteps > 0 ? 2 : 0);
      const nextInput = state.nextInput === 'left' ? 'right' : 'left';
      const newCombo = state.combo + 1;
      const newScore = state.score + scoreAdd;

      // Generate new stair
      const lastStair = state.stairs[state.stairs.length - 1];
      const newStair = generateStair(lastStair, lastStair.id + 1);
      let newStairs = [...state.stairs, newStair];
      if (newStairs[0].id < newTotalSteps - 10) {
        newStairs.shift();
      }

      // Energy Recovery
      let newEnergy = state.energy + energyChange;
      if (newTotalSteps > 0 && newTotalSteps % 20 === 0) {
        newEnergy += 20;
      }
      newEnergy = Math.min(state.maxEnergy, Math.max(0, newEnergy));

      const isGameOver = newEnergy <= 0;

      return {
        stairs: newStairs,
        totalSteps: newTotalSteps,
        currentFloor: newFloor,
        lastStepTime: now,
        combo: newCombo,
        score: newScore,
        energy: newEnergy,
        lastResult: result,
        bpm: newBpm,
        nextInput: nextInput,
        isGameOver: isGameOver,
        isPlaying: !isGameOver
      };
    } else {
      // FAILED STEP (Bad Timing)
      sfx.miss.play();
      const newEnergy = Math.max(0, state.energy + energyChange);
      const isGameOver = newEnergy <= 0;

      return {
        energy: newEnergy,
        combo: 0,
        lastResult: result,
        lastStepTime: now,
        isGameOver: isGameOver,
        isPlaying: !isGameOver
      };
    }
  }),

  takeDamage: (amount) => set((state) => {
    const newEnergy = Math.max(0, state.energy - amount);
    return {
      energy: newEnergy,
      isGameOver: newEnergy <= 0,
      isPlaying: newEnergy > 0,
      combo: 0,
    };
  }),

  heal: (amount) => set((state) => ({
    energy: Math.min(state.maxEnergy, state.energy + amount),
  })),

  reset: () => set({
    isPlaying: false,
    isGameOver: false,
    currentFloor: 1,
    energy: 100,
    score: 0,
    bpm: 100,
    combo: 0,
    totalSteps: 0,
    stairs: [],
    lastResult: null
  }),
}));
