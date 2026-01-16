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
    duration = 200
}: AnimatedCardProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Use a minimal delay to ensure the element is rendered before animating
        // This is faster than double RAF on mobile
        const startTimer = setTimeout(() => {
            setIsAnimating(true);
        }, 10);

        // Complete animation after duration
        const completeTimer = setTimeout(() => {
            onComplete();
        }, duration + 10);

        return () => {
            clearTimeout(startTimer);
            clearTimeout(completeTimer);
        };
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
                transition: `transform ${duration}ms ease-out`,
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
