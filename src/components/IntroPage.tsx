import React from 'react';
import logoImg from '../assets/logo.png';


interface IntroPageProps {
  onEnterMain: () => void;
  onSkip: () => void;
  onSkipForever: () => void;
  onMinimize: () => void;
  onAlwaysOnTop: () => void;
  onClose: () => void;
  fromAbout?: boolean;
}

const INTRO_TEXT = `<b>Как пользоваться программой</b><br><br>
<i>(рекомендуется прочитать перед первым использованием)</i><br><br>
Настоящая программа <b>GI chess-T1</b> представляет собой графический интерфейс тактико-стратегической игры <b>chess-T1</b>, частично похожей на шахматы. Она предоставляет пользователю возможность помощью компьютера играть в <b>chess-T1</b> с соперником, а также анализировать позиции и просматривать партии. Игра с компьютером (ИИ – искусственным интеллектом) не предусмотрена.<br><br>
Для игры с соперником необходимо, чтобы у каждого из игроков на компьютере была установлена программа, или же игроки используют один и тот же компьютер с программой. Когда игроки пользуются разными компьютерами (в том числе удаленно расположенными), им рекомендуется самостоятельно вести запись ходов. С помощью мессенджеров или электронной почты игроки могут направлять друг другу запись своего сделанного хода (в том числе со скриншотом позиции) сопернику. Таким образом воспроизводится классический, но более современный, формат игры «по переписке», широко применявшийся в шахматах в прежние годы.<br><br>
Программа также предоставляет пользователю возможность анализировать позиции, просматривать партии <b>chess-T1</b>, а также изучать литературу по этой игре.<br><br>
Применение программы предполагает, что пользователь знаком с правилами игры <b>chess-T1</b>. С правилами можно ознакомиться с помощью литературы, имеющейся в свободном (бесплатном) доступе в интернете, ключевые слова для поиска – «игра chess-T1»; книги: «Другие «шахматы» – логическая игра chess-t1», «Тактико-стратегическая игра chess-T1. Основы».<br><br>
Важный момент, программа не задает (не обозначает) правильные ходы и не ограничивает неправильные ходы фигурами – правильность ходов фигурами должны соблюдать сами игроки, в том числе и поэтому при игре важна самостоятельная запись ходов.<br><br>
Конечно, для любителей шахмат предлагаемый интерфейс программы выглядит слишком простым по сравнению многочисленными шахматными программами. Пояснение на этот счет следующее. Настоящая программа, как графический интерфейс, реализована на таком уровне в первую очередь по причине, что правила игры <b>chess-T1</b> по сравнению с шахматами более сложные. Поэтому, учитывая, что это первая программа по данной игре, было целесообразно реализовать ее сначала в более простом исполнении.<br><br>
Тем не менее программа предоставляет пользователю определенный набор удобных функций для игры и анализа.<br><br>
<b>Основные элементы управления интерфейса программы</b><br><br>
Верхний ряд кнопок:<br><br>
• <b>Начальная расстановка</b> — устанавливает фигуры в начальное положение<br><br>
• <b>Партия</b> — запускает сеанс игры<br><br>
• <b>Анализ</b> — позволяет расставить на доске нужную позицию, и далее с помощью кнопки <b>Ok</b> происходит переход в режим анализа данной позиции с возможностью ходов фигурами<br><br>
• <b>Свернуть</b> — сворачивает окно<br><br>
• <b>Поверх всех окон</b> — удерживает окно поверх других<br><br>
• <b>Закрыть</b> — закрывает программу<br><br>
Нижний ряд кнопок:<br><br>
• <b>Меню</b> — открывает список команд<br><br>
• <b>Предыдущий ход / Следующий ход</b> — навигация по истории<br><br>
• <b>Удалить фигуру</b> — удаляет выбранную фигуру с доски при расстановке фигур в режиме <b>Анализ</b><br><br>
• <b>Перевернуть доску</b> — поворот доски на 180°<br><br>
<b>Изменить размер</b> интерфейса программы пользователь может стандартно с помощью мыши, подводя курсор к границам интерфейса.<br><br>
<b>Индикация номера и очереди хода:</b><br><br>
В интерфейсе программы есть строка индикации номера и очередности хода. Фото (скриншоты) позиций сохраняются с именем текста строки индикации, либо пользователь сохраняет, используя другой вариант.<br><br>
<b>Режим "Партия":</b><br><br>
Нажмите кнопку "Партия" для начала новой партии. Будет предложено создать папку для сохранения скриншотов позиций. Белые ходят первыми.<br><br>
<b>Режим "Анализ":</b><br><br>
Нажмите кнопку <b>"Анализ"</b> для расстановки произвольной позиции. Используйте кассы фигур слева и справа от доски. После расстановки нажмите <b>"Ок"</b> для начала сеанса анализа позиции. Будет предложено создать папку для сохранения скриншотов позиций при анализе исходной позиции.<br><br>
<b>Сохранение скриншотов позиций:</b><br><br>
Посредством команд Меню можно сохранять фото позиций либо в созданную пользователем папку (программа предложит), либо скриншоты будут сохраняться в стандартную папку Изображений.<br><br>
<b>Выход (закрытие) из программы</b> пользователь может осуществить, не завершая партию (или анализ позиции – также считается партией). В этом случае при следующем запуске старт программы начинается с позиции, при которой произошло закрытие программы.<br><br>
<b>Перемещение фигур:</b><br><br>
Нажмите и удерживайте левую кнопку мыши на фигуре, перетащите на нужную клетку и отпустите. Фигура автоматически встанет в центр клетки.<br><br>
<b>Взятие фигур:</b><br><br>
Переместить фигуру на клетку, занятую фигурой противника; взятие фигуры противника происходит автоматически. Игрокам необходимо самим, помимо правила хода фигурой, соблюдать также условие для взятия фигуры противника (наличие, так называемого, <i>перевеса в силе</i>, см. правила игры). В программе автоматически реализован особый ход-взятие с разменом Разведчика (с доски снимаются обе взаимодействующие фигуры), когда он бьет фигуру противника в <b>замке</b> (особые клетки на доске, см. правила).<br><br>
<b>Превращение фигур:</b><br><br>
Белая «пешка» (Кнехт), вступившая на клетку на 6-й горизонтали, автоматически превращается в «пешку-ветеран» (Вер Кнехт). Аналогично черная «пешка», вступившая на клетку на 3-й горизонтали, автоматически превращается в «пешку-ветеран».<br><br>
Когда белая «пешка-ветеран» вступает на клетки a8, b8, g8, h8 пользователю (игроку) предлагается на выбор четыре старшие фигуры для превращения «пешки-ветерана». Аналогично происходит, когда черная «пешка-ветеран» вступает на клетки a1, b1, g1, h1.<br><br>
Когда белая «пешка-ветеран» вступает на клетки <b>замка</b> черных (c8, d8, e8, f8) пользователю (игроку) предлагается на выбор две старшие королевские фигуры для превращения «пешки-ветерана». Аналогично происходит, когда черная «пешка-ветеран» вступает на клетки <b>замка</b> белых – c1, d1, e1, f1.<br><br>
Когда белый Принц вступает на клетки <b>замка</b> черных пользователю (игроку) предлагается на выбор две королевские фигуры: Коннет («Ферзь) и Принц для превращения, или отказа от превращения (выбирая Принца), в соответствии правилом. Аналогично происходит, когда черный Принц вступает на клетки <b>замка</b> белых.<br><br>
Программа, с учетом превращения «пешки» в «пешку-ветерана» (см. выше), не позволяет ставить белые «пешки» на клетки 7-й и 8-й горизонталей, а черные «пешки» на клетки 2-й и 1-й горизонталей.<br><br>
<b>Нотация</b> (выполнение записи – самостоятельно)<b>:</b><br><br>
В <b>chess-T1</b> запись расположения фигур на доске и ходов аналогична шахматной. В качестве сокращений для фигур применяются следующие обозначения:<br><br>
«Пешка» (Кнехт) – Кн/ или без обозначения, «пешка-ветеран» (Вер Кнехт) – ВК/В, Риттер – Рт, Разведчик – Рк, Принц – Пр, Коннет («Ферзь») – Кт, Король – Кр. Начальная расстановка фигур, белые: a1-Рт, b1-Рк, c1-Пр, d1-Кт, e1-Кр, f1-Пр, g1-Рк, h1-Рт, 2-я горизонталь – белые «пешки»; черные: a8-Рт, b8-Рк, c8-Пр, d8-Кт, e8-Кр, f8-Пр, g8-Рк, h8-Рт, 7-я горизонталь – черные «пешки».`;

// Dark metallic circle for window controls — per mockup
const WIN_BTN: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: '50%',
  border: '1.5px solid #333',
  background: 'linear-gradient(180deg, #808080 0%, #606060 40%, #484848 70%, #383838 100%)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  boxShadow: '0 2px 3px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.15)',
};

const IntroPage: React.FC<IntroPageProps> = ({ onEnterMain, onSkip, onSkipForever, onMinimize, onAlwaysOnTop, onClose, fromAbout }) => {
  const [closeWarning, setCloseWarning] = React.useState(false);

  const handleClose = () => {
    if (fromAbout) {
      setCloseWarning(true);
    } else {
      onClose();
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#e8d8c0',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Top blue bar — draggable window region (data-tauri-drag-region) */}
      <div
        data-tauri-drag-region
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          padding: '6px 10px',
          gap: 8,
          background: 'linear-gradient(180deg, #7ec0ee 0%, #4a9ae0 50%, #3a8ad0 100%)',
          minHeight: 44,
          flexShrink: 0,
          cursor: 'move',
        }}
      >
        {/* Centered title — sits on top of the drag region, ignores pointer events */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: 16,
          fontWeight: 'bold',
          textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          letterSpacing: 0.3,
        }}>
          GI chess-T1
        </div>
        {/* Program logo */}
        <img
          src={logoImg}
          alt="GI chess-T1"
          draggable={false}
          style={{
            width: 32, height: 32, objectFit: 'contain', flexShrink: 0,
            borderRadius: 3,
            pointerEvents: 'none',
          }}
        />

        {/* "Основной режим" button — blue rectangle, white text */}
        <button
          onClick={onEnterMain}
          style={{
            padding: '5px 18px',
            backgroundColor: '#2060b0',
            color: '#ffffff',
            border: '1px solid #1a4080',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          Основной режим
        </button>

        <div data-tauri-drag-region style={{ flex: 1, alignSelf: 'stretch', cursor: 'move' }} />

        {/* 3 round buttons: Minimize, AlwaysOnTop, Close */}
        <button onClick={onMinimize} style={WIN_BTN} title="Свернуть">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="2" y1="9" x2="10" y2="9" stroke="#ddd" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button onClick={onAlwaysOnTop} style={WIN_BTN} title="Поверх всех окон">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="1" width="5" height="5" fill="#888" stroke="#ccc" strokeWidth="0.5"/>
            <rect x="5" y="5" width="5" height="5" fill="#bbb" stroke="#ccc" strokeWidth="0.5"/>
          </svg>
        </button>
        <button onClick={handleClose} style={WIN_BTN} title="Закрыть">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="2" y1="2" x2="10" y2="10" stroke="#ddd" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="10" y1="2" x2="2" y2="10" stroke="#ddd" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Two skip buttons — beige background, black text, thin border */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '6px 10px',
      }}>
        <button
          onClick={onSkip}
          style={{
            padding: '5px 14px',
            backgroundColor: '#e8dcc8',
            color: '#1a1a1a',
            border: '1px solid #a09070',
            borderRadius: 3,
            fontSize: 11,
            fontFamily: 'Arial, sans-serif',
            cursor: 'pointer',
          }}
        >
          Пропустить вводный текст / перейти в основной режим
        </button>
        <button
          onClick={onSkipForever}
          style={{
            padding: '5px 14px',
            backgroundColor: '#e8dcc8',
            color: '#1a1a1a',
            border: '1px solid #a09070',
            borderRadius: 3,
            fontSize: 11,
            fontFamily: 'Arial, sans-serif',
            cursor: 'pointer',
          }}
        >
          Пропустить и не спрашивать больше
        </button>
      </div>

      {/* Warning banner — shown when close is clicked from "О программе" */}
      {closeWarning && (
        <div style={{
          margin: '0 10px',
          padding: '8px 14px',
          backgroundColor: '#f0d8a0',
          border: '1px solid #c0a060',
          borderRadius: 3,
          fontFamily: 'Arial, sans-serif',
          fontSize: 13,
          fontWeight: 'bold',
          color: '#5a3e10',
          textAlign: 'center',
        }}>
          Необходимо вернуться в Основной режим
        </div>
      )}

      {/* Text area — sandy/beige background with scrollbar.
          Uses dangerouslySetInnerHTML so the text can contain <b>, <i>, <u> tags. */}
      <div style={{
        flex: 1,
        minHeight: 0,
        margin: '0 10px 10px',
        backgroundColor: '#d4bc8a',
        border: '1px solid #a09070',
        borderRadius: 3,
        padding: 16,
        overflowY: 'auto',
        fontFamily: 'Arial, sans-serif',
        fontSize: 13,
        lineHeight: 1.7,
        color: '#1a1a1a',
        whiteSpace: 'normal',
      }}
        dangerouslySetInnerHTML={{ __html: INTRO_TEXT }}
      />


    </div>
  );
};

export default IntroPage;
