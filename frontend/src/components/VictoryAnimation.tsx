import { useState } from 'react';
import './VictoryAnimation.css';

interface Particle {
    id: number;
    suit: string;
    angle: number;
    velocity: number;
    rotation: number;
    delay: number;
}

interface VictoryAnimationProps {
    onClose?: () => void;
}

export function VictoryAnimation({ onClose }: VictoryAnimationProps) {
    const [particles] = useState(() => {
        const suits = ['♥', '♦', '♣', '♠'];
        const newParticles: Particle[] = [];

        // Create 60 particles (15 per suit) that burst like fireworks
        for (let i = 0; i < 60; i++) {
            newParticles.push({
                id: i,
                suit: suits[i % 4],
                angle: (i * 360 / 60) + (Math.random() * 20 - 10), // Evenly distributed with slight randomness
                velocity: 300 + Math.random() * 400, // Increased velocity to reach screen edges
                rotation: Math.random() * 720 - 360, // Random rotation
                delay: Math.random() * 0.3 // Stagger the bursts slightly
            });
        }

        return newParticles;
    });

    return (
        <div className="victory-overlay" onClick={onClose}>
            <div className="victory-content">
                <h1 className="victory-title">Congratulations!</h1>
                <p className="victory-subtitle">You Won!</p>
                <div className="particles">
                    {particles.map(particle => {
                        // Calculate final position based on angle and velocity
                        const radians = (particle.angle * Math.PI) / 180;
                        const dx = Math.cos(radians) * particle.velocity;
                        const dy = Math.sin(radians) * particle.velocity;

                        return (
                            <div
                                key={particle.id}
                                className={`particle suit-${particle.suit === '♥' || particle.suit === '♦' ? 'red' : 'black'}`}
                                style={{
                                    '--dx': dx,
                                    '--dy': dy,
                                    '--rotation': `${particle.rotation}deg`,
                                    animationDelay: `${particle.delay}s`
                                } as React.CSSProperties}
                            >
                                {particle.suit}
                            </div>
                        );
                    })}
                </div>
                <p className="victory-hint">Click anywhere to continue</p>
            </div>
        </div>
    );
}
