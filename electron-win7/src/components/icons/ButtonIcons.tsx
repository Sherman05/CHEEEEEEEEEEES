import React from 'react';

// Procedural SVG redraws of the customer-supplied reference icons in
// design/icons/image{2..6}.png. These are vector — sharp at any size.
// Palette is taken from the references.

const STROKE = '#1a1a1a';
const FACE = '#b8b8b8';        // gray button face
const BLUE = '#1a3df0';        // saturated blue used for marks

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// image2 — round Ok button. Gray disk, dark border, blue serif "Ok".
export const IconOk: React.FC<IconProps> = ({ size = 32, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <circle cx="50" cy="50" r="46" fill={FACE} stroke={STROKE} strokeWidth="4" />
    <text
      x="50"
      y="62"
      textAnchor="middle"
      fontFamily="'Times New Roman', Times, serif"
      fontSize="46"
      fontWeight="bold"
      fill={BLUE}
    >Ok</text>
  </svg>
);

// image3 — round Menu button (hamburger).
export const IconMenu: React.FC<IconProps> = ({ size = 32, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <circle cx="50" cy="50" r="46" fill={FACE} stroke={STROKE} strokeWidth="4" />
    {[35, 50, 65].map((y) => (
      <rect key={y} x="22" y={y - 4} width="56" height="8" fill={BLUE} />
    ))}
  </svg>
);

// Delete-piece button — blue rounded rectangle with a black X.
// Per design/icons/Символ Удалить фигуру.svg (customer 08.04.2026).
export const IconDelete: React.FC<IconProps> = ({ size = 32, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style} shapeRendering="geometricPrecision">
    <rect x="22" y="14" width="56" height="72" rx="10" ry="10"
      fill="#5BADE0" stroke="#000000" strokeWidth="4" />
    {/* X drawn as filled rotated rectangles — renders as solid pure black at small sizes,
        unlike stroked lines which get softened by anti-aliasing. */}
    <g fill="#000000" stroke="none">
      <rect x="46" y="20" width="8" height="60" transform="rotate(45 50 50)" />
      <rect x="46" y="20" width="8" height="60" transform="rotate(-45 50 50)" />
    </g>
  </svg>
);

// Reset button — gray disk with a counter-clockwise arrow.
// Per design/icons/Символ сброса.svg (customer 08.04.2026).
export const IconReset: React.FC<IconProps> = ({ size = 32, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <circle cx="50" cy="50" r="46" fill="#999999" stroke="#000000" strokeWidth="4" />
    {/* CCW arrow: arc from left side + arrowhead pointing left-down */}
    <path
      d="M 30 36 A 26 26 0 1 1 30 64"
      fill="none"
      stroke="#000000"
      strokeWidth="7"
      strokeLinecap="round"
    />
    <path d="M 30 22 L 30 40 L 46 36 Z" fill="#000000" stroke="#000000" strokeWidth="3" strokeLinejoin="round" />
  </svg>
);
