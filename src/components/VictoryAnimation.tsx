import { useState } from 'react';
import './VictoryAnimation.css';

interface Particle {
    id: number;
    suit: string;
    x: number;
    y: number;
    rotation: number;
    delay: number;
}

export function VictoryAnimation() {
    const [particles] = useState(() => {
        const suits = ['♥', '♦', '♣', '♠'];
        const newParticles: Particle[] = [];

        // Create 52 particles (one for each card)
        for (let i = 0; i < 52; i++) {
            newParticles.push({
                id: i,
                suit: suits[i % 4],
                x: Math.random() * 100,
                y: Math.random() * 100,
                rotation: Math.random() * 360,
                delay: Math.random() * 0.5
            });
        }

        return newParticles;
    });

    return (
        <div className="victory-overlay">
            <div className="victory-content">
                <h1 className="victory-title">Victory!</h1>
                <div className="victory-cards">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="victory-card"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        />
                    ))}
                </div>
                <div className="particles">
                    {particles.map(particle => (
                        <div
                            key={particle.id}
                            className={`particle suit-${particle.suit === '♥' || particle.suit === '♦' ? 'red' : 'black'}`}
                            style={{
                                left: `${particle.x}%`,
                                top: `${particle.y}%`,
                                animationDelay: `${particle.delay}s`,
                                '--rotation': `${particle.rotation}deg`
                            } as React.CSSProperties}
                        >
                            {particle.suit}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
