import React from 'react';

interface IntroPageProps {
  onEnterMain: () => void;
  onSkip: () => void;
  onSkipForever: () => void;
  onMinimize: () => void;
  onAlwaysOnTop: () => void;
  onClose: () => void;
}

const INTRO_TEXT = `Как пользоваться программой ГИ chess-T1
(вводный текст)

Настоящая программа ГИ chess-T1 (Графический интерфейс) пользователям игры chess-T1 предоставляет возможность с помощью компьютера:

(1) последовательно (пользователям) проводить анализ партий и позиций игры chess-T1.

(2) двум пользователям играть между собой в игру chess-T1.

Предполагается, что пользователи знают и соблюдают при использовании ГИ chess-T1 правила игры.

Основные элементы управления:

Верхний ряд кнопок:
• Начальная расстановка — устанавливает фигуры в начальное положение
• Партия — запускает режим игры
• Анализ — запускает режим анализа позиций
• Свернуть — сворачивает окно
• Поверх всех окон — удерживает окно поверх других
• Закрыть — закрывает программу

Нижний ряд кнопок:
• Меню — открывает список команд
• Предыдущий ход / Следующий ход — навигация по истории
• Удалить фигуру — удаляет выбранную фигуру с доски
• Перевернуть доску — поворот доски на 180°
• Изменить размер — изменение размера окна

Режим "Партия":
Нажмите кнопку "Партия" для начала новой партии. Будет предложено создать папку для сохранения скриншотов позиций. Белые ходят первыми.

Режим "Анализ":
Нажмите кнопку "Анализ" для расстановки произвольной позиции. Используйте кассы фигур слева и справа от доски. После расстановки нажмите "Ок" для начала игры.

Перемещение фигур:
Нажмите и удерживайте левую кнопку мыши на фигуре, перетащите на нужную клетку и отпустите. Фигура автоматически встанет в центр клетки.`;

// White circle window button — per intro page mockup
const WIN_BTN: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: '50%',
  border: '2px solid #1a1a1a',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};

const IntroPage: React.FC<IntroPageProps> = ({ onEnterMain, onSkip, onSkipForever, onMinimize, onAlwaysOnTop, onClose }) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #7ec0ee 0%, #4a9ae0 40%, #3a8ad0 100%)',
      overflow: 'hidden',
    }}>
      {/* Top controls row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 10px',
        gap: 8,
      }}>
        {/* Program symbol (decorative) — chess board icon per mockup */}
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.3)',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22">
            <rect x="1" y="1" width="10" height="10" fill="#fff" stroke="#333" strokeWidth="0.5"/>
            <rect x="11" y="1" width="10" height="10" fill="#888" stroke="#333" strokeWidth="0.5"/>
            <rect x="1" y="11" width="10" height="10" fill="#888" stroke="#333" strokeWidth="0.5"/>
            <rect x="11" y="11" width="10" height="10" fill="#fff" stroke="#333" strokeWidth="0.5"/>
          </svg>
        </div>

        {/* "Основной режим" — blue oval pill button per mockup */}
        <button
          onClick={onEnterMain}
          style={{
            padding: '6px 22px',
            backgroundColor: '#0068c8',
            color: '#ffffff',
            border: '2px solid #0028fa',
            borderRadius: 18,
            fontSize: 14,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            cursor: 'pointer',
          }}
        >
          Основной режим
        </button>

        <div style={{ flex: 1 }} />

        {/* Window controls — white circles per mockup */}
        <button onClick={onMinimize} style={WIN_BTN} title="Свернуть">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <line x1="3" y1="11" x2="11" y2="11" stroke="#0028fa" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button onClick={onAlwaysOnTop} style={WIN_BTN} title="Поверх всех окон">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect x="1" y="1" width="7" height="7" rx="1" fill="none" stroke="#0028fa" strokeWidth="1.5" />
            <rect x="4" y="4" width="7" height="7" rx="1" fill="rgba(0,40,250,0.1)" stroke="#0028fa" strokeWidth="1.5" />
          </svg>
        </button>
        <button onClick={onClose} style={WIN_BTN} title="Закрыть">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <line x1="3" y1="3" x2="11" y2="11" stroke="#cc2020" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="11" y1="3" x2="3" y2="11" stroke="#cc2020" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Skip buttons row — per mockup: two blue buttons side by side */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '0 10px 8px',
      }}>
        <button
          onClick={onSkip}
          style={{
            padding: '5px 14px',
            backgroundColor: '#0068c8',
            color: '#ffffff',
            border: '1px solid #0028fa',
            borderRadius: 4,
            fontSize: 11,
            fontFamily: 'Arial, sans-serif',
            cursor: 'pointer',
          }}
        >
          Пропустить вводный текст/ перейти в основной режим
        </button>
        <button
          onClick={onSkipForever}
          style={{
            padding: '5px 14px',
            backgroundColor: '#0068c8',
            color: '#ffffff',
            border: '1px solid #0028fa',
            borderRadius: 4,
            fontSize: 11,
            fontFamily: 'Arial, sans-serif',
            cursor: 'pointer',
          }}
        >
          Пропустить и не показывать больше
        </button>
      </div>

      {/* Text window — beige/sandy background per mockup */}
      <div style={{
        flex: 1,
        margin: '0 10px 10px',
        backgroundColor: '#d4bc8a',
        border: '2px solid #0028fa',
        borderRadius: 3,
        padding: 16,
        overflowY: 'auto',
        fontFamily: 'Arial, sans-serif',
        fontSize: 13,
        lineHeight: 1.6,
        color: '#1a1a1a',
        whiteSpace: 'pre-wrap',
      }}>
        {INTRO_TEXT}
      </div>
    </div>
  );
};

export default IntroPage;
