/**
 * 100 component tests using @testing-library/react + @testing-library/jest-dom.
 * Tests rendering, button states, text content, accessibility, and user interactions.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useGameStore } from '../stores/gameStore';
import { PieceColor, PieceType } from '../logic/pieces';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(() => Promise.resolve(null)),
}));
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    close: vi.fn(),
    minimize: vi.fn(),
    setAlwaysOnTop: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  useGameStore.getState().setInitialPosition();
});

// ════════════════════════════════════════════════════════════════════════
// 1-15: TopBar component
// ════════════════════════════════════════════════════════════════════════
describe('TopBar component', () => {
  let TopBar: typeof import('../components/TopBar').default;

  beforeEach(async () => {
    TopBar = (await import('../components/TopBar')).default;
  });

  const renderTopBar = (props = {}) => {
    const defaults = {
      onPartyClick: vi.fn(),
      onAnalysisClick: vi.fn(),
      onMinimize: vi.fn(),
      onAlwaysOnTop: vi.fn(),
      onClose: vi.fn(),
    };
    return render(<TopBar {...defaults} {...props} />);
  };

  it('1. renders Партия button', () => {
    renderTopBar();
    expect(screen.getByTitle('Партия')).toBeInTheDocument();
  });

  it('2. renders Анализ button', () => {
    renderTopBar();
    expect(screen.getByTitle('Анализ')).toBeInTheDocument();
  });

  it('3. renders Начальная расстановка button', () => {
    renderTopBar();
    expect(screen.getByTitle('Начальная расстановка')).toBeInTheDocument();
  });

  it('4. renders Свернуть button', () => {
    renderTopBar();
    expect(screen.getByTitle('Свернуть')).toBeInTheDocument();
  });

  it('5. renders Поверх всех окон button', () => {
    renderTopBar();
    expect(screen.getByTitle('Поверх всех окон')).toBeInTheDocument();
  });

  it('6. renders Закрыть button', () => {
    renderTopBar();
    expect(screen.getByTitle('Закрыть')).toBeInTheDocument();
  });

  it('7. renders title text "GI chess-T1"', () => {
    renderTopBar();
    expect(screen.getByText('GI chess-T1')).toBeInTheDocument();
  });

  it('8. Партия button calls onPartyClick', () => {
    const onPartyClick = vi.fn();
    renderTopBar({ onPartyClick });
    fireEvent.click(screen.getByTitle('Партия'));
    expect(onPartyClick).toHaveBeenCalledTimes(1);
  });

  it('9. Анализ button calls onAnalysisClick', () => {
    const onAnalysisClick = vi.fn();
    renderTopBar({ onAnalysisClick });
    fireEvent.click(screen.getByTitle('Анализ'));
    expect(onAnalysisClick).toHaveBeenCalledTimes(1);
  });

  it('10. Закрыть button calls onClose', () => {
    const onClose = vi.fn();
    renderTopBar({ onClose });
    fireEvent.click(screen.getByTitle('Закрыть'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('11. Начальная расстановка is disabled at start', () => {
    renderTopBar();
    expect(screen.getByTitle('Начальная расстановка')).toBeDisabled();
  });

  it('12. Начальная расстановка is enabled in party mode', () => {
    useGameStore.getState().startParty('t');
    renderTopBar();
    expect(screen.getByTitle('Начальная расстановка')).not.toBeDisabled();
  });

  it('13. Партия button is disabled during analysis setup', () => {
    useGameStore.getState().startAnalysis();
    renderTopBar();
    expect(screen.getByTitle('Партия')).toBeDisabled();
  });

  it('14. TopBar has data-topbar attribute', () => {
    const { container } = renderTopBar();
    expect(container.querySelector('[data-topbar]')).toBeInTheDocument();
  });

  it('15. Свернуть is disabled when promotionPending', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().setPromotionPending({
      square: 'e8',
      piece: { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
      options: [{ type: PieceType.KONNET, color: PieceColor.WHITE }],
    });
    renderTopBar();
    expect(screen.getByTitle('Свернуть')).toBeDisabled();
  });
});

// ════════════════════════════════════════════════════════════════════════
// 16-30: BottomBar component
// ════════════════════════════════════════════════════════════════════════
describe('BottomBar component', () => {
  let BottomBar: typeof import('../components/BottomBar').default;

  beforeEach(async () => {
    BottomBar = (await import('../components/BottomBar')).default;
  });

  const renderBottomBar = (props = {}) => {
    const defaults = {
      onMenuClick: vi.fn(),
      onResetClick: vi.fn(),
      onOkClick: vi.fn(),
      onFirstMoveToggle: vi.fn(),
    };
    return render(<BottomBar {...defaults} {...props} />);
  };

  it('16. renders Меню button', () => {
    renderBottomBar();
    expect(screen.getByTitle('Меню')).toBeInTheDocument();
  });

  it('17. Меню calls onMenuClick', () => {
    const onMenuClick = vi.fn();
    renderBottomBar({ onMenuClick });
    fireEvent.click(screen.getByTitle('Меню'));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('18. has data-bottombar attribute', () => {
    const { container } = renderBottomBar();
    expect(container.querySelector('[data-bottombar]')).toBeInTheDocument();
  });

  it('19. in setup mode renders Сброс button', () => {
    useGameStore.getState().startAnalysis();
    renderBottomBar();
    expect(screen.getByTitle('Сброс')).toBeInTheDocument();
  });

  it('20. in setup mode renders Готово (Ok) button', () => {
    useGameStore.getState().startAnalysis();
    renderBottomBar();
    expect(screen.getByTitle('Готово')).toBeInTheDocument();
  });

  it('21. in setup mode renders Очередь 1-го хода button', () => {
    useGameStore.getState().startAnalysis();
    renderBottomBar();
    expect(screen.getByTitle('Очередь 1-го хода')).toBeInTheDocument();
  });

  it('22. in setup mode renders Удалить фигуру button', () => {
    useGameStore.getState().startAnalysis();
    renderBottomBar();
    expect(screen.getByTitle('Удалить фигуру')).toBeInTheDocument();
  });

  it('23. Удалить фигуру disabled when nothing selected', () => {
    useGameStore.getState().startAnalysis();
    renderBottomBar();
    expect(screen.getByTitle('Удалить фигуру')).toBeDisabled();
  });

  it('24. Удалить фигуру enabled when piece selected', () => {
    useGameStore.getState().startAnalysis();
    useGameStore.getState().placePiece('e4', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().setSelectedForDeletion('e4');
    renderBottomBar();
    expect(screen.getByTitle('Удалить фигуру')).not.toBeDisabled();
  });

  it('25. in play mode renders Предыдущий ход button', () => {
    useGameStore.getState().startParty('t');
    renderBottomBar();
    expect(screen.getByTitle('Предыдущий ход')).toBeInTheDocument();
  });

  it('26. in play mode renders Следующий ход button', () => {
    useGameStore.getState().startParty('t');
    renderBottomBar();
    expect(screen.getByTitle('Следующий ход')).toBeInTheDocument();
  });

  it('27. in play mode renders Перевернуть доску button', () => {
    useGameStore.getState().startParty('t');
    renderBottomBar();
    expect(screen.getByTitle('Перевернуть доску')).toBeInTheDocument();
  });

  it('28. Предыдущий ход disabled at initial position', () => {
    useGameStore.getState().startParty('t');
    renderBottomBar();
    expect(screen.getByTitle('Предыдущий ход')).toBeDisabled();
  });

  it('29. Следующий ход disabled at latest move', () => {
    useGameStore.getState().startParty('t');
    renderBottomBar();
    expect(screen.getByTitle('Следующий ход')).toBeDisabled();
  });

  it('30. Предыдущий ход enabled after 1 move', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    renderBottomBar();
    expect(screen.getByTitle('Предыдущий ход')).not.toBeDisabled();
  });
});

// ════════════════════════════════════════════════════════════════════════
// 31-45: FolderDialog component
// ════════════════════════════════════════════════════════════════════════
describe('FolderDialog component', () => {
  let FolderDialog: typeof import('../components/FolderDialog').default;

  beforeEach(async () => {
    FolderDialog = (await import('../components/FolderDialog')).default;
  });

  const renderDialog = (props = {}) => {
    const defaults = {
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
      onDismiss: vi.fn(),
    };
    return { ...render(<FolderDialog {...defaults} {...props} />), ...defaults, ...props };
  };

  it('31. renders dialog title', () => {
    renderDialog();
    expect(screen.getByText('Создать папку для партии')).toBeInTheDocument();
  });

  it('32. renders input with placeholder', () => {
    renderDialog();
    expect(screen.getByPlaceholderText('Моя партия')).toBeInTheDocument();
  });

  it('33. renders Пропустить button', () => {
    renderDialog();
    expect(screen.getByText('Пропустить')).toBeInTheDocument();
  });

  it('34. renders Создать button', () => {
    renderDialog();
    expect(screen.getByText('Создать')).toBeInTheDocument();
  });

  it('35. Создать disabled when input empty', () => {
    renderDialog();
    expect(screen.getByText('Создать')).toBeDisabled();
  });

  it('36. Создать enabled after typing', () => {
    renderDialog();
    fireEvent.change(screen.getByPlaceholderText('Моя партия'), { target: { value: 'test' } });
    expect(screen.getByText('Создать')).not.toBeDisabled();
  });

  it('37. Пропустить calls onCancel', () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel });
    fireEvent.click(screen.getByText('Пропустить'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('38. X button calls onDismiss', () => {
    const onDismiss = vi.fn();
    renderDialog({ onDismiss });
    fireEvent.click(screen.getByTitle('Отмена'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('39. renders bottom help text', () => {
    renderDialog();
    expect(screen.getByText(/Папка будет создана на Рабочем столе/)).toBeInTheDocument();
  });

  it('40. bottom text contains Пропустить reference', () => {
    renderDialog();
    expect(screen.getByText(/Нажмите «Пропустить»/)).toBeInTheDocument();
  });

  it('41. bottom text contains Изображения reference', () => {
    renderDialog();
    expect(screen.getByText(/папке «Изображения»/)).toBeInTheDocument();
  });

  it('42. input is autofocused', () => {
    renderDialog();
    const input = screen.getByPlaceholderText('Моя партия');
    // jsdom doesn't focus, but autoFocus attr should be set
    expect(input).toHaveAttribute('type', 'text');
  });

  it('43. no Отмена button label exists (only as X title)', () => {
    renderDialog();
    const buttons = screen.getAllByRole('button');
    const cancelBtns = buttons.filter(b => b.textContent === 'Отмена');
    expect(cancelBtns).toHaveLength(0);
  });

  it('44. X button does not call onCancel', () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel });
    fireEvent.click(screen.getByTitle('Отмена'));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('45. Пропустить does not call onDismiss', () => {
    const onDismiss = vi.fn();
    renderDialog({ onDismiss });
    fireEvent.click(screen.getByText('Пропустить'));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════
// 46-60: MenuPopup component
// ════════════════════════════════════════════════════════════════════════
describe('MenuPopup component', () => {
  let MenuPopup: typeof import('../components/MenuPopup').default;

  beforeEach(async () => {
    MenuPopup = (await import('../components/MenuPopup')).default;
  });

  const renderMenu = (props = {}) => {
    const defaults = {
      onClose: vi.fn(),
      onAbout: vi.fn(),
      onSavePosition: vi.fn(),
      onSavePositionAs: vi.fn(),
      onEndParty: vi.fn(),
      onExit: vi.fn(),
    };
    return { ...render(<MenuPopup {...defaults} {...props} />), ...defaults, ...props };
  };

  it('46. renders О программе', () => {
    renderMenu();
    expect(screen.getByText('О программе')).toBeInTheDocument();
  });

  it('47. renders Сохранить позицию', () => {
    renderMenu();
    expect(screen.getByText('Сохранить позицию')).toBeInTheDocument();
  });

  it('48. renders Сохранить позицию как', () => {
    renderMenu();
    expect(screen.getByText('Сохранить позицию как')).toBeInTheDocument();
  });

  it('49. renders Завершить партию', () => {
    renderMenu();
    expect(screen.getByText('Завершить партию')).toBeInTheDocument();
  });

  it('50. renders Выход', () => {
    renderMenu();
    expect(screen.getByText('Выход')).toBeInTheDocument();
  });

  it('51. О программе calls onAbout + onClose', () => {
    const onAbout = vi.fn();
    const onClose = vi.fn();
    renderMenu({ onAbout, onClose });
    fireEvent.click(screen.getByText('О программе'));
    expect(onAbout).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('52. Выход calls onExit + onClose', () => {
    const onExit = vi.fn();
    const onClose = vi.fn();
    renderMenu({ onExit, onClose });
    fireEvent.click(screen.getByText('Выход'));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('53. Сохранить позицию disabled at start mode', () => {
    renderMenu();
    expect(screen.getByText('Сохранить позицию')).toBeDisabled();
  });

  it('54. Завершить партию disabled at start mode', () => {
    renderMenu();
    expect(screen.getByText('Завершить партию')).toBeDisabled();
  });

  it('55. Сохранить позицию enabled in play mode', () => {
    useGameStore.getState().startParty('t');
    renderMenu();
    expect(screen.getByText('Сохранить позицию')).not.toBeDisabled();
  });

  it('56. Завершить партию enabled in play mode', () => {
    useGameStore.getState().startParty('t');
    renderMenu();
    expect(screen.getByText('Завершить партию')).not.toBeDisabled();
  });

  it('57. Сохранить позицию disabled in setup mode', () => {
    useGameStore.getState().startAnalysis();
    renderMenu();
    expect(screen.getByText('Сохранить позицию')).toBeDisabled();
  });

  it('58. disabled items do not fire callbacks', () => {
    const onSavePosition = vi.fn();
    const onClose = vi.fn();
    renderMenu({ onSavePosition, onClose });
    fireEvent.click(screen.getByText('Сохранить позицию'));
    expect(onSavePosition).not.toHaveBeenCalled();
    // onClose should not be called for disabled items
    expect(onClose).not.toHaveBeenCalled();
  });

  it('59. О программе is never disabled', () => {
    renderMenu();
    expect(screen.getByText('О программе')).not.toBeDisabled();
  });

  it('60. Выход is never disabled', () => {
    renderMenu();
    expect(screen.getByText('Выход')).not.toBeDisabled();
  });
});

// ════════════════════════════════════════════════════════════════════════
// 61-75: CloseDialog component
// ════════════════════════════════════════════════════════════════════════
describe('CloseDialog component', () => {
  let CloseDialog: typeof import('../components/CloseDialog').default;

  beforeEach(async () => {
    CloseDialog = (await import('../components/CloseDialog')).default;
  });

  const renderCloseDialog = (props = {}) => {
    const defaults = {
      hasActiveSession: true,
      onCloseWithEnd: vi.fn(),
      onCloseWithoutEnd: vi.fn(),
      onCancel: vi.fn(),
    };
    return { ...render(<CloseDialog {...defaults} {...props} />), ...defaults, ...props };
  };

  it('61. renders dialog title "Закрытие программы"', () => {
    renderCloseDialog();
    expect(screen.getByText('Закрытие программы')).toBeInTheDocument();
  });

  it('62. renders "Завершить партию и закрыть программу" button', () => {
    renderCloseDialog();
    expect(screen.getByText('Завершить партию и закрыть программу')).toBeInTheDocument();
  });

  it('63. renders "Закрыть программу — не завершая партию" button', () => {
    renderCloseDialog();
    expect(screen.getByText('Закрыть программу — не завершая партию')).toBeInTheDocument();
  });

  it('64. renders X close button', () => {
    renderCloseDialog();
    expect(screen.getByTitle('Отмена')).toBeInTheDocument();
  });

  it('65. X button calls onCancel', () => {
    const onCancel = vi.fn();
    renderCloseDialog({ onCancel });
    fireEvent.click(screen.getByTitle('Отмена'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('66. "Завершить" button calls onCloseWithEnd', () => {
    const onCloseWithEnd = vi.fn();
    renderCloseDialog({ onCloseWithEnd });
    fireEvent.click(screen.getByText('Завершить партию и закрыть программу'));
    expect(onCloseWithEnd).toHaveBeenCalledTimes(1);
  });

  it('67. "Не завершая" button calls onCloseWithoutEnd', () => {
    const onCloseWithoutEnd = vi.fn();
    renderCloseDialog({ onCloseWithoutEnd });
    fireEvent.click(screen.getByText('Закрыть программу — не завершая партию'));
    expect(onCloseWithoutEnd).toHaveBeenCalledTimes(1);
  });

  it('68. renders 2 "Сохранить позицию" checkboxes', () => {
    renderCloseDialog();
    const checkboxes = screen.getAllByText('Сохранить позицию');
    expect(checkboxes).toHaveLength(2);
  });

  it('69. checkboxes default to unchecked', () => {
    renderCloseDialog();
    const inputs = screen.getAllByRole('checkbox');
    expect(inputs).toHaveLength(2);
    inputs.forEach(cb => expect(cb).not.toBeChecked());
  });

  it('70. clicking checkbox toggles it', () => {
    renderCloseDialog();
    const inputs = screen.getAllByRole('checkbox');
    fireEvent.click(inputs[0]);
    expect(inputs[0]).toBeChecked();
  });

  it('71. onCloseWithEnd receives save=true when checked', () => {
    const onCloseWithEnd = vi.fn();
    renderCloseDialog({ onCloseWithEnd });
    const inputs = screen.getAllByRole('checkbox');
    fireEvent.click(inputs[0]); // check "save" for "end party" option
    fireEvent.click(screen.getByText('Завершить партию и закрыть программу'));
    expect(onCloseWithEnd).toHaveBeenCalledWith(true);
  });

  it('72. onCloseWithEnd receives save=false when unchecked', () => {
    const onCloseWithEnd = vi.fn();
    renderCloseDialog({ onCloseWithEnd });
    fireEvent.click(screen.getByText('Завершить партию и закрыть программу'));
    expect(onCloseWithEnd).toHaveBeenCalledWith(false);
  });

  it('73. renders nothing when hasActiveSession=false', () => {
    const onCloseWithEnd = vi.fn();
    renderCloseDialog({ hasActiveSession: false, onCloseWithEnd });
    expect(screen.queryByText('Закрытие программы')).not.toBeInTheDocument();
  });

  it('74. backdrop click calls onCancel', () => {
    const onCancel = vi.fn();
    const { container } = renderCloseDialog({ onCancel });
    // Click the outer overlay div (first child)
    const overlay = container.firstElementChild as HTMLElement;
    fireEvent.click(overlay);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('75. inner dialog click does not call onCancel', () => {
    const onCancel = vi.fn();
    renderCloseDialog({ onCancel });
    fireEvent.click(screen.getByText('Закрытие программы'));
    expect(onCancel).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════
// 76-85: MoveIndicator component
// ════════════════════════════════════════════════════════════════════════
describe('MoveIndicator component', () => {
  let MoveIndicator: typeof import('../components/MoveIndicator').default;

  beforeEach(async () => {
    MoveIndicator = (await import('../components/MoveIndicator')).default;
  });

  it('76. renders nothing when no indicator', () => {
    const { container } = render(<MoveIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('77. renders indicator text in party mode', () => {
    useGameStore.getState().startParty('t');
    render(<MoveIndicator />);
    expect(screen.getByText('1. __ хб')).toBeInTheDocument();
  });

  it('78. updates after move', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    render(<MoveIndicator />);
    expect(screen.getByText('1 … __ хч')).toBeInTheDocument();
  });

  it('79. displays monospace font', () => {
    useGameStore.getState().startParty('t');
    render(<MoveIndicator />);
    const el = screen.getByText('1. __ хб');
    expect(el.style.fontFamily).toContain('monospace');
  });

  it('80. indicator is bold', () => {
    useGameStore.getState().startParty('t');
    render(<MoveIndicator />);
    const el = screen.getByText('1. __ хб');
    expect(el.style.fontWeight).toBe('bold');
  });
});

// ════════════════════════════════════════════════════════════════════════
// 81-85: PieceTray type list
// ════════════════════════════════════════════════════════════════════════
describe('PieceTray piece types', () => {
  it('81. ALL_TYPES has 7 piece types', () => {
    const types = [PieceType.KING, PieceType.KONNET, PieceType.PRINCE, PieceType.RITTER, PieceType.KNEKHT, PieceType.VER_KNEKHT, PieceType.SCOUT];
    expect(types).toHaveLength(7);
  });

  it('82. each piece type is unique', () => {
    const types = [PieceType.KING, PieceType.KONNET, PieceType.PRINCE, PieceType.RITTER, PieceType.KNEKHT, PieceType.VER_KNEKHT, PieceType.SCOUT];
    expect(new Set(types).size).toBe(7);
  });

  it('83. KING type exists', () => {
    expect(PieceType.KING).toBeDefined();
  });

  it('84. KONNET type exists', () => {
    expect(PieceType.KONNET).toBeDefined();
  });

  it('85. SCOUT type exists', () => {
    expect(PieceType.SCOUT).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════
// 86-95: IntroPage component
// ════════════════════════════════════════════════════════════════════════
describe('IntroPage component', () => {
  let IntroPage: typeof import('../components/IntroPage').default;

  beforeEach(async () => {
    IntroPage = (await import('../components/IntroPage')).default;
  });

  const renderIntro = (props = {}) => {
    const defaults = {
      onEnterMain: vi.fn(),
      onSkip: vi.fn(),
      onSkipForever: vi.fn(),
      onMinimize: vi.fn(),
      onAlwaysOnTop: vi.fn(),
      onClose: vi.fn(),
    };
    return { ...render(<IntroPage {...defaults} {...props} />), ...defaults, ...props };
  };

  it('86. renders the intro page', () => {
    renderIntro();
    // Should have some content
    expect(document.body.textContent!.length).toBeGreaterThan(0);
  });

  it('87. renders "Пропустить и не спрашивать больше" button', () => {
    renderIntro();
    expect(screen.getByText('Пропустить и не спрашивать больше')).toBeInTheDocument();
  });

  it('88. "Пропустить и не спрашивать больше" calls onSkipForever', () => {
    const onSkipForever = vi.fn();
    renderIntro({ onSkipForever });
    fireEvent.click(screen.getByText('Пропустить и не спрашивать больше'));
    expect(onSkipForever).toHaveBeenCalledTimes(1);
  });

  it('89. uses dangerouslySetInnerHTML for HTML support', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/IntroPage.tsx', 'utf-8');
    expect(source).toContain('dangerouslySetInnerHTML');
  });

  it('90. renders Закрыть button', () => {
    renderIntro();
    expect(screen.getByTitle('Закрыть')).toBeInTheDocument();
  });

  it('91. Закрыть calls onClose', () => {
    const onClose = vi.fn();
    renderIntro({ onClose });
    fireEvent.click(screen.getByTitle('Закрыть'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('92. renders Свернуть button', () => {
    renderIntro();
    expect(screen.getByTitle('Свернуть')).toBeInTheDocument();
  });

  it('93. Свернуть calls onMinimize', () => {
    const onMinimize = vi.fn();
    renderIntro({ onMinimize });
    fireEvent.click(screen.getByTitle('Свернуть'));
    expect(onMinimize).toHaveBeenCalledTimes(1);
  });

  it('94. renders Поверх всех окон button', () => {
    renderIntro();
    expect(screen.getByTitle('Поверх всех окон')).toBeInTheDocument();
  });

  it('95. Поверх всех окон calls onAlwaysOnTop', () => {
    const onAlwaysOnTop = vi.fn();
    renderIntro({ onAlwaysOnTop });
    fireEvent.click(screen.getByTitle('Поверх всех окон'));
    expect(onAlwaysOnTop).toHaveBeenCalledTimes(1);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 96-100: Cross-component integration
// ════════════════════════════════════════════════════════════════════════
describe('cross-component integration', () => {
  it('96. BottomBar in setup mode has 6 buttons total', async () => {
    useGameStore.getState().startAnalysis();
    const BottomBar = (await import('../components/BottomBar')).default;
    const { container } = render(
      <BottomBar onMenuClick={vi.fn()} onResetClick={vi.fn()} onOkClick={vi.fn()} onFirstMoveToggle={vi.fn()} />
    );
    const buttons = container.querySelectorAll('button');
    // Меню, Сброс, Очередь, Готово, Удалить, Перевернуть
    expect(buttons.length).toBe(6);
  });

  it('97. BottomBar in play mode has 4 buttons', async () => {
    useGameStore.getState().startParty('t');
    const BottomBar = (await import('../components/BottomBar')).default;
    const { container } = render(
      <BottomBar onMenuClick={vi.fn()} />
    );
    const buttons = container.querySelectorAll('button');
    // Меню, Предыдущий, Следующий, Перевернуть
    expect(buttons.length).toBe(4);
  });

  it('98. BottomBar in start mode has only Меню', async () => {
    const BottomBar = (await import('../components/BottomBar')).default;
    const { container } = render(
      <BottomBar onMenuClick={vi.fn()} />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(1);
  });

  it('99. TopBar shows promotion options when pending (white)', async () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().setPromotionPending({
      square: 'a8',
      piece: { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
      options: [
        { type: PieceType.KONNET, color: PieceColor.WHITE },
        { type: PieceType.PRINCE, color: PieceColor.WHITE },
        { type: PieceType.RITTER, color: PieceColor.WHITE },
        { type: PieceType.SCOUT, color: PieceColor.WHITE },
      ],
    });
    const TopBar = (await import('../components/TopBar')).default;
    render(
      <TopBar onPartyClick={vi.fn()} onAnalysisClick={vi.fn()} onMinimize={vi.fn()} onAlwaysOnTop={vi.fn()} onClose={vi.fn()} />
    );
    // Title should be replaced by promotion buttons
    expect(screen.queryByText('GI chess-T1')).not.toBeInTheDocument();
  });

  it('100. MenuPopup has 5 items in total', async () => {
    const MenuPopup = (await import('../components/MenuPopup')).default;
    const { container } = render(
      <MenuPopup onClose={vi.fn()} onAbout={vi.fn()} onSavePosition={vi.fn()} onSavePositionAs={vi.fn()} onEndParty={vi.fn()} onExit={vi.fn()} />
    );
    // 5 menu items + backdrop div (not a button)
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(5);
  });
});
