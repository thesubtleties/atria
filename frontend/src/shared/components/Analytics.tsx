import { useEffect } from 'react';

/**
 * Analytics Component
 *
 * Loads Plausible analytics script once after React hydration.
 * This prevents double-counting that would occur if the script
 * was in the static HTML template (pre-render + hydration = 2 pageviews).
 *
 * Privacy-focused, GDPR compliant, no cookies, no personal data collection.
 */
export const Analytics = (): null => {
  useEffect(() => {
    // Only load in browser (not during SSR/pre-rendering)
    if (typeof window === 'undefined') return;

    // Check if script already exists to prevent duplicates
    const existingScript = document.querySelector('script[data-domain="atria.gg"]');
    if (existingScript) return;

    // Create and inject Plausible script
    const script = document.createElement('script');
    script.defer = true;
    script.setAttribute('data-domain', 'atria.gg');
    script.setAttribute('data-api', '/api/anonstats/event');
    script.src = '/api/anonstats/js/script.file-downloads.outbound-links.js';
    document.head.appendChild(script);

    // Cleanup function (removes script if component unmounts, though it typically won't)
    return () => {
      const scriptToRemove = document.querySelector('script[data-domain="atria.gg"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []); // Empty deps = run once on mount

  // This component renders nothing
  return null;
};
