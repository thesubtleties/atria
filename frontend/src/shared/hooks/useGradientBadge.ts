import { useMemo, type CSSProperties } from 'react';

/** Gradient badge style properties */
interface GradientBadgeStyles extends CSSProperties {
  background: string;
  boxShadow: string;
  border: string;
  backdropFilter?: string;
  WebkitBackdropFilter?: string;
  color?: string;
}

/**
 * Hook to generate gradient badge styles from a single color
 * Creates a gradient effect similar to session type badges
 * @param baseColor - Hex color (e.g., '#8B5CF6')
 * @returns Style object with gradient, shadows, and backdrop effects
 */
export const useGradientBadge = (
  baseColor: string | null | undefined
): GradientBadgeStyles => {
  const styles = useMemo<GradientBadgeStyles>(() => {
    if (!baseColor) {
      return {
        background: 'rgba(107, 114, 128, 0.88)',
        boxShadow:
          '0 2px 12px rgba(107, 114, 128, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
      };
    }

    // Convert hex to RGB
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Create a darker shade for gradient (reduce brightness by 15%)
    const darkerR = Math.max(0, Math.floor(r * 0.85));
    const darkerG = Math.max(0, Math.floor(g * 0.85));
    const darkerB = Math.max(0, Math.floor(b * 0.85));

    // Generate the gradient background
    const background = `linear-gradient(
      135deg,
      rgba(${r}, ${g}, ${b}, 0.88) 0%,
      rgba(${darkerR}, ${darkerG}, ${darkerB}, 0.88) 100%
    )`;

    // Generate box shadow with the color
    const boxShadow = `
      0 2px 12px rgba(${r}, ${g}, ${b}, 0.25),
      inset 0 1px 1px rgba(255, 255, 255, 0.2)
    `;

    // Calculate text color based on luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const textColor = luminance > 0.5 ? '#1E293B' : '#FFFFFF';

    return {
      background,
      boxShadow,
      border: '1px solid rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      color: textColor,
    };
  }, [baseColor]);

  return styles;
};

/**
 * Get inline styles for a gradient badge
 * Useful when you need to apply styles directly to an element
 * @param baseColor - Hex color
 * @returns Style object ready for inline use
 */
export const getGradientBadgeStyles = (
  baseColor: string | null | undefined
): GradientBadgeStyles => {
  if (!baseColor) {
    return {
      background: 'rgba(107, 114, 128, 0.88)',
      boxShadow:
        '0 2px 12px rgba(107, 114, 128, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    };
  }

  // Convert hex to RGB
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Create a darker shade for gradient
  const darkerR = Math.max(0, Math.floor(r * 0.85));
  const darkerG = Math.max(0, Math.floor(g * 0.85));
  const darkerB = Math.max(0, Math.floor(b * 0.85));

  // Calculate text color
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textColor = luminance > 0.5 ? '#1E293B' : '#FFFFFF';

  return {
    background: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.88) 0%, rgba(${darkerR}, ${darkerG}, ${darkerB}, 0.88) 100%)`,
    boxShadow: `0 2px 12px rgba(${r}, ${g}, ${b}, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)`,
    border: '1px solid rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: textColor,
  };
};

