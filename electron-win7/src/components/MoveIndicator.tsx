import React from 'react';
import { useGameStore } from '../stores/gameStore';

const MoveIndicator: React.FC = () => {
  const moveIndicator = useGameStore((s) => s.moveIndicator);

  if (!moveIndicator) return null;

  return (
    <div style={{
      padding: '4px 12px',
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderRadius: 4,
      fontSize: 14,
      fontFamily: 'monospace',
      fontWeight: 'bold',
      color: '#1a1a1a',
      whiteSpace: 'nowrap',
      border: '1px solid rgba(0,0,0,0.2)',
    }}>
      {moveIndicator}
    </div>
  );
};

export default MoveIndicator;
