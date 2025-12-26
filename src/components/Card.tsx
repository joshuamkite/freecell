import type { Card as CardType } from '../types/card';
import { getCardImagePath } from '../types/card';
import './Card.css';

interface CardProps {
    card: CardType;
    onClick?: () => void;
    onDoubleClick?: () => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    className?: string;
    style?: React.CSSProperties;
}

export function Card({
    card,
    onClick,
    onDoubleClick,
    draggable = false,
    onDragStart,
    onDragEnd,
    className = '',
    style,
}: CardProps) {
    const imagePath = getCardImagePath(card);

    return (
        <div
            className={`card ${className}`}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            style={style}
            data-card-id={card.id}
        >
            <img
                src={imagePath}
                alt={`${card.rank} of ${card.suit}`}
                draggable={false}
            />
        </div>
    );
}
