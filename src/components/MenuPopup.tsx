import React from 'react';
import { useGameStore, getViewMode } from '../stores/gameStore';

interface MenuPopupProps {
  onClose: () => void;
  onAbout: () => void;
  onSavePosition: () => void;
  onSavePositionAs: () => void;
  onEndParty: () => void;
  onExit: () => void;
}

const MenuPopup: React.FC<MenuPopupProps> = ({ onClose, onAbout, onSavePosition, onSavePositionAs, onEndParty, onExit }) => {
  const { gameMode, gameStage } = useGameStore();
  const viewMode = getViewMode({ gameMode, gameStage });
  const isStart = viewMode === 'start';
  const isSetup = gameStage === 'setup';

  const items = [
    { label: 'О программе', action: onAbout, frozen: false },
    { label: 'Сохранить позицию', action: onSavePosition, frozen: isStart || isSetup },
    { label: 'Сохранить позицию как', action: onSavePositionAs, frozen: isStart || isSetup },
    { label: 'Завершить партию', action: onEndParty, frozen: isStart || isSetup },
    { label: 'Создать ярлык', action: () => {}, frozen: false },
    { label: 'Выход', action: onExit, frozen: false },
  ];

  return (
    <>
      {/* Backdrop to close on outside click */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
        }}
        onClick={onClose}
      />
      {/* Menu popup — fixed position, opens UPWARD from bottom-left corner.
          Per ТЗ: "Меню не перекрывает игровое поле — раскрывается влево за пределы окна ГИ"
          Using fixed positioning to avoid any overflow clipping. */}
      <div style={{
        position: 'fixed',
        bottom: 54,
        left: 8,
        width: 210,
        backgroundColor: '#f5f5f5',
        border: '2px solid #0028fa',
        borderRadius: 6,
        boxShadow: '0 -4px 16px rgba(0,0,0,0.3)',
        zIndex: 9999,
        overflow: 'hidden',
      }}>
        {items.map((item, i) => (
          <button
            key={i}
            disabled={item.frozen}
            onClick={() => {
              if (!item.frozen) {
                item.action();
                onClose();
              }
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              borderBottom: i < items.length - 1 ? '1px solid #ddd' : 'none',
              backgroundColor: 'transparent',
              textAlign: 'left',
              fontSize: 13,
              color: item.frozen ? '#aaa' : '#1a1a1a',
              cursor: item.frozen ? 'default' : 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}
            onMouseEnter={(e) => {
              if (!item.frozen) {
                (e.target as HTMLElement).style.backgroundColor = '#d0e0f0';
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default MenuPopup;
