# 3D Rhythm Stair Climbing Game Implementation Prompt

## Project Overview
Create a 3D rhythm-based infinite stair climbing game where the player ascends an endless staircase in sync with a musical beat. The game combines rhythm game mechanics with 3D platformer visuals.

## Tech Stack
- **Framework**: React + Vite
- **Language**: TypeScript
- **3D Library**: Three.js with `@react-three/fiber` and `@react-three/drei`
- **State Management**: Zustand
- **Styling**: CSS Modules or Styled Components (Vanilla CSS is fine)
- **Audio**: Howler.js (or native Audio API)

## Core Gameplay Mechanics

### 1. Movement & Controls
- **Input**: Player uses two keys (e.g., Left/Right Arrow or A/D) to climb.
- **Alternating Steps**: The player MUST alternate inputs (Left -> Right -> Left). Pressing the same key twice is a "Miss".
- **Rhythm Sync**: Steps must be timed to the game's BPM.
    - **Perfect**: Exact timing (+/- 100ms). High score, energy heal.
    - **Great**: Good timing (+/- 150ms). Medium score.
    - **Good**: Acceptable (+/- 250ms). Low score, slight energy drain.
    - **Bad/Miss**: Off-beat or wrong key. Energy penalty, combo reset.
- **Turns**: The stairs automatically generate turns at landings (every 12 steps). The camera should smoothly follow the path.

### 2. Infinite Stair Generation
- **Procedural Generation**: Stairs are generated infinitely as the player climbs.
- **Object Pooling**: Maintain a fixed buffer of stair meshes (e.g., 50 steps) to ensure performance. Remove old stairs and add new ones dynamically.
- **Stairwell Design**: Enclosed stairwell feel with walls or railings. Landings should be spacious to allow for camera rotation.

### 3. Energy System
- **Health Bar**: Starts at 100%.
- **Decay**: Energy decreases on "Bad" or "Miss" steps.
- **Recovery**: Energy recovers slightly on "Perfect" steps and significantly upon completing a flight of stairs (e.g., every 20 floors).
- **Game Over**: When energy hits 0, the game ends. Show a "Game Over" screen with Final Score and Floor Count.

### 4. Visuals & Camera
- **Perspective**: First-person view.
- **Camera Movement**:
    - Smoothly interpolate position to the current step.
    - "Head Bob" effect on each step for realism.
    - Look-ahead logic to anticipate turns.
- **Rhythm Indicator**: A visual UI element (e.g., converging bars) that shows the beat timing and the required next input (L/R).
- **Feedback**: Pop-up text ("Perfect!", "Miss!") and screen shake or color flashes on errors.

### 5. Audio
- **BPM**: Start at ~100 BPM and gradually increase difficulty (speed) as the player progresses.
- **SFX**: Distinct sounds for steps, misses, and level-ups. Pitch modulation based on Combo count (higher pitch for higher combos).

## Implementation Steps

1.  **Setup**: Initialize Vite project with React/TS and install R3F dependencies.
2.  **Store**: Create a Zustand store to manage `stairs`, `currentFloor`, `score`, `energy`, `bpm`, `lastStepTime`, etc.
3.  **World Component**: Create `StairManager` to render the stair meshes based on store data.
4.  **Player Component**: Create `PlayerController` to handle camera logic and inputs (if not handled globally).
5.  **Game Logic**: Implement the `step()` function in the store:
    *   Validate Input (L vs R).
    *   Calculate Timing Error (`Date.now() - lastStepTime`).
    *   Update Score/Energy/Combo.
    *   Generate next stair / Remove old stair.
6.  **UI Overlay**: Build the HUD (Heads-Up Display) for Score, Energy, and the Rhythm Indicator.
7.  **Polish**: Add lighting (Sky, Stars), particle effects, and sound integration.

## Key Algorithms
- **Stair Generation**:
    ```typescript
    // Pseudo-code
    function generateStair(prevStair) {
      if (isLanding(prevStair)) {
        // Random 90 degree turn
        return newStairWithTurn;
      } else {
        // Straight up
        return newStairStraight;
      }
    }
    ```
- **Rhythm Check**:
    ```typescript
    const error = Math.abs((Date.now() - lastStepTime) - (60000 / bpm));
    if (error < 100) return 'Perfect';
    ```

## User Experience Goals
- "Juicy" feedback: Everything should react to the music and player input.
- Forgiving but challenging: Resume logic for pauses, but strict penalties for spamming keys.
- Mobile friendly: On-screen touch controls for L/R.
