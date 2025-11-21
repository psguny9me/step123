import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import { useGameStore } from './store/gameStore';
import { StairManager } from './components/World/StairManager';
import { PlayerController } from './components/Player/PlayerController';


const RhythmIndicator = () => {
  const bpm = useGameStore(state => state.bpm);
  const lastStepTime = useGameStore(state => state.lastStepTime);
  const lastResult = useGameStore(state => state.lastResult);
  const nextInput = useGameStore(state => state.nextInput);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      const now = Date.now();
      const beatInterval = 60000 / bpm;
      const elapsed = now - lastStepTime;
      const p = Math.min(elapsed / beatInterval, 1.2);
      setProgress(p);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [bpm, lastStepTime]);

  // Visuals
  // Two bars approaching center.
  // Distance from center = (1 - progress) * 150px
  // If progress > 1, they cross (negative offset).
  const offset = (1 - progress) * 150;

  // Dynamic Color based on timing closeness
  let barColor = 'white';
  if (progress > 0.8 && progress < 1.2) barColor = '#4ecdc4'; // Teal for good timing window
  if (progress > 0.9 && progress < 1.1) barColor = '#ffe66d'; // Yellow for great
  if (progress > 0.95 && progress < 1.05) barColor = '#ff6b6b'; // Red/Pink for perfect center

  // Fade out if too late
  const opacity = progress > 1.3 ? Math.max(0, 1 - (progress - 1.3) * 2) : 1;

  const scale = progress > 0.9 && progress < 1.1 ? 1.2 : 1;

  // Result Color Map
  const getResultColor = (res: string) => {
    switch (res) {
      case 'Perfect': return '#ff6b6b';
      case 'Great': return '#ffe66d';
      case 'Good': return '#4ecdc4';
      case 'Bad': return '#556270';
      case 'Miss': return '#556270';
      default: return 'white';
    }
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '180px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '300px',
      height: '100px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      pointerEvents: 'none'
    }}>
      {/* Center Marker / Target */}
      <div style={{
        width: '60px', height: '60px',
        border: '4px solid rgba(255,255,255,0.3)',
        borderRadius: '50%',
        position: 'absolute',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.2)'
      }}>
        {/* Next Input Prompt */}
        <span style={{
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          opacity: 0.8
        }}>
          {nextInput === 'left' ? 'L' : 'R'}
        </span>
      </div>

      {/* Left Bar */}
      <div style={{
        width: '10px', height: '30px', background: barColor,
        position: 'absolute',
        transform: `translateX(-${offset}px) scale(${scale})`,
        borderRadius: '5px',
        boxShadow: `0 0 10px ${barColor}`,
        opacity: opacity
      }} />

      {/* Right Bar */}
      <div style={{
        width: '10px', height: '30px', background: barColor,
        position: 'absolute',
        transform: `translateX(${offset}px) scale(${scale})`,
        borderRadius: '5px',
        boxShadow: `0 0 10px ${barColor}`,
        opacity: opacity
      }} />

      {/* Feedback Text */}
      {lastResult && (
        <div key={lastStepTime} style={{
          position: 'absolute',
          top: '-60px',
          fontSize: '32px',
          fontWeight: 'bold',
          color: getResultColor(lastResult),
          animation: 'pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          textShadow: '2px 2px 0 #000',
          whiteSpace: 'nowrap'
        }}>
          {lastResult.toUpperCase()}!
        </div>
      )}

      <style>{`
        @keyframes pop {
          0% { transform: scale(0.5) translateY(20px); opacity: 0; }
          50% { transform: scale(1.2) translateY(-10px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

function App() {
  const { isPlaying, isGameOver, currentFloor, energy, score, startGame, step } = useGameStore();

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#111' }}>
      <Canvas shadows camera={{ position: [0, 2, 5], fov: 75 }}>
        <color attach="background" args={['#202025']} />
        <fog attach="fog" args={['#202025', 5, 20]} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <Sky sunPosition={[100, 20, 100]} />
        <Stars />
        <StairManager />
        <PlayerController />
      </Canvas>

      <div className="ui-overlay">
        {/* Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 20px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            Floor: <span style={{ color: '#4ecdc4' }}>{currentFloor}</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            Score: <span style={{ color: '#ffe66d' }}>{score}</span>
          </div>
        </div>

        {/* Energy Bar */}
        <div style={{ width: '100%', maxWidth: '400px', margin: '20px auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>ENERGY</span>
            <span>{Math.round(energy)}%</span>
          </div>
          <div style={{ width: '100%', height: '20px', background: '#333', borderRadius: '10px', overflow: 'hidden', border: '2px solid #555' }}>
            <div style={{
              width: `${energy}%`,
              height: '100%',
              background: energy > 30 ? 'linear-gradient(90deg, #4ecdc4, #556270)' : 'linear-gradient(90deg, #ff6b6b, #c0392b)',
              transition: 'width 0.2s ease-out'
            }} />
          </div>
        </div>

        {/* Rhythm Indicator */}
        {isPlaying && <RhythmIndicator />}

        {/* Start Screen */}
        {!isPlaying && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            background: 'rgba(0,0,0,0.8)', pointerEvents: 'auto'
          }}>
            <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#4ecdc4' }}>Kung-Jjak Stair Climber</h1>
            <div style={{ textAlign: 'left', marginBottom: '40px', background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
              <h3>HOW TO PLAY</h3>
              <p>1. 🎵 <b>Listen to the Rhythm</b>: Press keys to the beat!</p>
              <p>2. 👣 <b>Climb</b>: Press <kbd>←</kbd> / <kbd>→</kbd> or <kbd>A</kbd> / <kbd>D</kbd> to step.</p>
              <p>3. 🔄 <b>Turn</b>: The stairs turn automatically at landings.</p>
              <p>4. ⚡ <b>Energy</b>: Don't miss the beat! Energy drops if you miss.</p>
            </div>
            <button
              onClick={startGame}
              style={{ padding: '20px 40px', fontSize: '32px', cursor: 'pointer', background: '#ff6b6b', border: 'none', color: 'white', borderRadius: '50px', fontWeight: 'bold' }}
            >
              START GAME
            </button>
          </div>
        )}

        {/* Mobile Controls */}
        {isPlaying && !isGameOver && (
          <div style={{
            position: 'absolute', bottom: '20px', left: '0', width: '100%',
            display: 'flex', justifyContent: 'space-between', padding: '0 40px',
            boxSizing: 'border-box', pointerEvents: 'none'
          }}>
            <button
              onPointerDown={() => step('left')}
              style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', border: '2px solid white', color: 'white', fontSize: '24px', fontWeight: 'bold', pointerEvents: 'auto', backdropFilter: 'blur(5px)', touchAction: 'manipulation' }}
            >L</button>
            <button
              onPointerDown={() => step('right')}
              style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', border: '2px solid white', color: 'white', fontSize: '24px', fontWeight: 'bold', pointerEvents: 'auto', backdropFilter: 'blur(5px)', touchAction: 'manipulation' }}
            >R</button>
          </div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            background: 'rgba(0,0,0,0.9)', pointerEvents: 'auto', zIndex: 100
          }}>
            <h1 style={{ fontSize: '64px', marginBottom: '20px', color: '#ff6b6b', textShadow: '0 0 20px red' }}>GAME OVER</h1>

            <div style={{ display: 'flex', gap: '40px', marginBottom: '40px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', color: '#aaa' }}>FLOOR</div>
                <div style={{ fontSize: '48px', color: '#4ecdc4', fontWeight: 'bold' }}>{currentFloor}F</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', color: '#aaa' }}>SCORE</div>
                <div style={{ fontSize: '48px', color: '#ffe66d', fontWeight: 'bold' }}>{score}</div>
              </div>
            </div>

            <button
              onClick={startGame}
              style={{
                padding: '20px 50px',
                fontSize: '32px',
                cursor: 'pointer',
                background: 'white',
                border: 'none',
                color: '#333',
                borderRadius: '50px',
                fontWeight: 'bold',
                boxShadow: '0 0 20px rgba(255,255,255,0.5)'
              }}
            >
              RETRY
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
