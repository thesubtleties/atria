#!/usr/bin/env node

/**
 * Pre-render script using Playwright
 *
 * This script:
 * 1. Launches a headless browser
 * 2. Visits the built landing page
 * 3. Waits for content to render
 * 4. Injects critical CSS to show everything in final rendered state
 * 5. Saves the fully-rendered HTML with critical styles
 *
 * Result:
 * - Search engines see full content immediately
 * - Users see instant paint with no FOUC
 * - React hydrates normally and animations work on scroll
 */

import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_DIR = join(__dirname, '..', 'dist');
const INDEX_PATH = join(DIST_DIR, 'index.html');
const PREVIEW_URL = 'http://localhost:4173';

console.log('🎬 Starting pre-render process...\n');

async function prerender() {
  let browser;

  try {
    // Launch browser
    console.log('🚀 Launching browser...');

    // Use system chromium if available (for Docker Alpine builds)
    const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    const launchOptions = {
      headless: true,
    };

    if (chromiumPath) {
      console.log(`📍 Using system chromium: ${chromiumPath}`);
      launchOptions.executablePath = chromiumPath;
    }

    browser = await chromium.launch(launchOptions);

    const page = await browser.newPage();

    // Set user agent so we can detect pre-rendering in our code
    await page.setExtraHTTPHeaders({
      'User-Agent': 'PrerendererBot/1.0 (like Googlebot)',
    });

    console.log('📄 Navigating to landing page...');

    // Navigate to the preview server
    const response = await page.goto(PREVIEW_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    if (!response.ok()) {
      throw new Error(`Failed to load page: ${response.status()} ${response.statusText()}`);
    }

    console.log('⏳ Waiting for content to render...');

    // Wait for the hero section to be visible (means React has rendered)
    await page.waitForSelector('.hero', {
      state: 'visible',
      timeout: 10000,
    });

    // Give animations a moment to settle
    await page.waitForTimeout(2000);

    console.log('🎬 Generating critical CSS for initial states...');

    // Manual critical CSS to show everything in its final rendered state
    // This prevents FOUC and flashing during hydration
    // IMPORTANT: Uses body[data-page="landing"] selector to ONLY apply to landing page
    // This prevents accidentally affecting app pages
    const criticalCSS = `/* Critical initial states for pre-rendered HTML */

/* Center all fixed-width content - LANDING PAGE ONLY */
body[data-page="landing"]:not(.hydrated) #root {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
}

/* Drape needs dimensions to render the purple SVG */
/* Using stable class names instead of CSS module hashes for resilience */
body[data-page="landing"]:not(.hydrated) .drape {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 110vh !important;
  pointer-events: none !important;
}

body[data-page="landing"]:not(.hydrated) .drape-svg {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100vh !important;
}

body[data-page="landing"]:not(.hydrated) .moving-background {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100vh !important;
  background: #F3EACE !important;
  z-index: 1 !important;
}

/* Center the hero section */
body[data-page="landing"]:not(.hydrated) .hero {
  margin-left: auto !important;
  margin-right: auto !important;
}

/* Hero section - show all content immediately */
body[data-page="landing"]:not(.hydrated) .hero .drape {
  transform: translateY(0) !important;
}

body[data-page="landing"]:not(.hydrated) .hero .logoContainer,
body[data-page="landing"]:not(.hydrated) .hero .tagline,
body[data-page="landing"]:not(.hydrated) .hero .ctaWrapper,
body[data-page="landing"]:not(.hydrated) .hero .nav {
  opacity: 1 !important;
  transform: none !important;
}

body[data-page="landing"]:not(.hydrated) .hero .scrollIndicator {
  opacity: 1 !important;
}

/* Below-the-fold sections - show in final state */
body[data-page="landing"]:not(.hydrated) .audience-card,
body[data-page="landing"]:not(.hydrated) .demo-card,
body[data-page="landing"]:not(.hydrated) .panel,
body[data-page="landing"]:not(.hydrated) .mockInterface,
body[data-page="landing"]:not(.hydrated) .sectionTitle,
body[data-page="landing"]:not(.hydrated) .sectionSubtitle {
  opacity: 1 !important;
  visibility: visible !important;
}

body[data-page="landing"]:not(.hydrated) .problemStatement .word {
  opacity: 1 !important;
}
`;

    console.log('✅ Critical CSS generated');

    console.log('🎬 Capturing clean HTML...');

    // Get the fully rendered HTML
    let html = await page.content();

    console.log('🧹 Cleaning up GSAP ScrollTrigger inline styles...');

    // Remove problematic inline styles added by GSAP ScrollTrigger during pre-render
    // These are viewport-specific and prevent responsive centering
    // Let CSS (both module CSS and critical CSS) handle all styling
    html = html
      // Remove entire style attributes from sections/divs that have GSAP-generated inline styles
      // Match common GSAP ScrollTrigger patterns (inset, position, width/height constraints)
      .replace(/\s+style="[^"]*inset:[^"]*"/g, '')
      .replace(/\s+style="[^"]*width:\s*1280px[^"]*"/g, '')
      .replace(/\s+style="[^"]*max-width:\s*1280px[^"]*"/g, '')
      // Clean up empty style attributes left behind
      .replace(/\s+style="\s*"/g, '')
      // Remove 'hydrated' class from body (added during pre-render, shouldn't be in HTML)
      .replace(/<body class="hydrated"([^>]*)>/, '<body$1>')
      .replace(/class="hydrated\s*/g, 'class="')
      .replace(/\s+hydrated"/g, '"');

    console.log('💉 Injecting critical CSS...');

    // Inject critical CSS into <head>
    const criticalCSSTag = `
    <!-- Critical CSS for pre-rendered animation states -->
    <style id="critical-animations">
${criticalCSS}    </style>
  </head>`;

    html = html.replace('</head>', criticalCSSTag);

    console.log('🔧 Fixing GSAP text scramble glitch...');

    // Fix the scramble text glitch - GSAP captures mid-animation
    // Target the specific element by ID and set it to "community"
    // React hydration will reconcile this without issues
    html = html.replace(/(<p[^>]*id="hero-scramble-text"[^>]*>)[^<]*(<\/p>)/, '$1community$2');

    // Save it
    writeFileSync(INDEX_PATH, html, 'utf-8');

    console.log('✅ Pre-rendered HTML saved successfully!');
    console.log(`📦 Output: ${INDEX_PATH}`);

    // Show some stats
    const originalSize = readFileSync(INDEX_PATH, 'utf-8').length;
    console.log(`📊 HTML size: ${(originalSize / 1024).toFixed(2)} KB\n`);

    // Verify content was captured
    if (html.includes('atria') && html.includes('connections')) {
      console.log('✨ Content verification passed - landing page content found!\n');
    } else {
      console.warn('⚠️  Warning: Expected landing page content not found in HTML\n');
    }
  } catch (error) {
    console.error('❌ Pre-render failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🧹 Browser closed\n');
    }
  }
}

prerender();
