import { useEffect, useRef, useState } from 'react';
import type { Card as CardType } from '../types/card';
import { Card } from './Card';
import './AnimatedCard.css';

interface AnimatedCardProps {
    cards: CardType[];
    startPos: { x: number; y: number };
    endPos: { x: number; y: number };
    onComplete: () => void;
    duration?: number;
}

export function AnimatedCard({
    cards,
    startPos,
    endPos,
    onComplete,
    duration = 300
}: AnimatedCardProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Trigger animation in next frame to ensure CSS transition works
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsAnimating(true);
            });
        });

        // Complete animation after duration
        const timer = setTimeout(() => {
            onComplete();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    const transform = isAnimating
        ? `translate(${endPos.x - startPos.x}px, ${endPos.y - startPos.y}px)`
        : 'translate(0, 0)';

    return (
        <div
            ref={containerRef}
            className="animated-card-container"
            style={{
                position: 'fixed',
                left: startPos.x,
                top: startPos.y,
                zIndex: 1000,
                pointerEvents: 'none',
                transform,
                transition: `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
        >
            {cards.map((card, index) => (
                <Card
                    key={card.id}
                    card={card}
                    style={{
                        marginTop: index === 0 ? '0' : `calc(var(--card-height, 140px) * -0.75)`
                    }}
                />
            ))}
        </div>
    );
}
