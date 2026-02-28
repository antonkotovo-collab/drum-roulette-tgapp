import React from 'react';
import { Prize } from '../../types/prizes';

interface DrumItemProps {
    prize: Prize;
    isHighlighted?: boolean;
}

/**
 * Один слот барабана — иконка + название приза.
 * При isHighlighted подсвечивается зелёной рамкой.
 */
const DrumItem: React.FC<DrumItemProps> = ({ prize, isHighlighted = false }) => {
    return (
        <div
            className={`
        flex-shrink-0 flex flex-col items-center justify-center
        w-[120px] h-[140px] mx-1 rounded-xl select-none
        transition-all duration-200
        ${isHighlighted
                    ? 'bg-primary/20 border-2 border-primary shadow-[0_0_20px_rgba(127,255,0,0.6)]'
                    : 'bg-card border-2 border-card-border'
                }
      `}
        >
            {/* Иконка приза */}
            <span className="text-5xl mb-2 leading-none">{prize.icon}</span>

            {/* Название приза (маленький текст, 2 строки макс) */}
            <span
                className={`
          text-center text-[11px] font-medium leading-tight px-2
          ${isHighlighted ? 'text-primary' : 'text-gray-400'}
        `}
                style={{ wordBreak: 'break-word', maxWidth: '100px' }}
            >
                {prize.name}
            </span>
        </div>
    );
};

export default DrumItem;
