import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const css = readFileSync('src/app.css', 'utf8');
const themes = ['fanzine', 'midnight', 'y2k', 'sakura', 'ocean', 'candy', 'mission'] as const;
const tokens = ['--orbit-paper', '--orbit-paper-deep', '--orbit-surface', '--orbit-ink', '--orbit-muted', '--orbit-line', '--orbit-line-strong', '--orbit-coral', '--orbit-coral-dark', '--orbit-coral-soft', '--orbit-lavender', '--orbit-mint', '--orbit-shadow', '--orbit-shadow-raised', '--orbit-rail', '--orbit-link', '--orbit-focus', '--orbit-selection', '--orbit-success', '--orbit-warning', '--orbit-error', '--orbit-overlay'];
const primitiveTokens = [
 '--orbit-radius-control', '--orbit-radius-surface', '--orbit-radius-menu-dialog', '--orbit-radius-badge',
 '--orbit-border-width', '--orbit-border-style', '--orbit-border-default', '--orbit-border-strong',
 '--orbit-border-interactive', '--orbit-border-focus', '--orbit-shadow-surface', '--orbit-shadow-raised',
 '--orbit-shadow-overlay', '--orbit-shadow-interactive', '--orbit-shadow-accent', '--orbit-font-display',
 '--orbit-font-body', '--orbit-font-heading-weight', '--orbit-font-label-weight', '--orbit-font-letter-spacing',
 '--orbit-font-decorative', '--orbit-texture-opacity', '--orbit-texture-image', '--orbit-accent-image',
 '--orbit-motion-fast', '--orbit-motion-standard', '--orbit-motion-theme', '--orbit-motion-ease'
] as const;
const themeBlock = (theme: string) => {
 const selector = theme === 'fanzine' ? ':root' : `[data-theme='${theme}']`;
 return css.match(new RegExp(`${selector.replace('[', '\\[').replace(']', '\\]')}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
};
describe('theme CSS contract', () => {
 it.each(themes)('%s defines semantic tokens', (theme) => {
  const block = themeBlock(theme);
  for (const token of tokens) expect(`${block}\n${css}`).toContain(token);
 });
  it('has no dark or system branch', () => { expect(css).not.toMatch(/data-theme=['"]dark['"]|prefers-color-scheme/); });
  it.each(themes)('%s defines every visual primitive', (theme) => {
   const block = themeBlock(theme);
   for (const token of primitiveTokens) expect(block).toContain(token);
  });
   it('keeps concrete, non-cyclic fanzine fallbacks for every visual primitive', () => {
   const root = themeBlock('fanzine');
   for (const token of primitiveTokens) {
    const declaration = root.match(new RegExp(`${token}\\s*:\\s*([^;]+);`))?.[1].trim();
    expect(declaration).toBeTruthy();
    expect(declaration).not.toBe(`var(${token})`);
   }
  });
    it('drives legacy radii through a theme token and preserves named recipes', () => {
      expect(css).toMatch(/body\s*\*\s*\{[\s\S]*border-radius:\s*var\(--orbit-radius-legacy/);
      expect(css).toMatch(/:is\(body \.glass-card[\s\S]*border-radius:\s*var\(--orbit-radius-surface[^;]*\)\s*!important/);
      expect(css).toMatch(/body \.orbit-badge\s*\{[\s\S]*border-radius:\s*var\(--orbit-radius-badge[^;]*\)\s*!important/);
      expect(css).toContain('.orbit-round-data');
      expect(css).toContain('border-radius: 9999px !important');
    });
      it('keeps zine text underlines square in rounded mode', () => {
         expect(css).toMatch(/body \.orbit-nav-item\.shell-navlink \.orbit-nav-indicator\s*\{\s*border-radius:\s*0\s*!important;/);
         expect(css).toMatch(/\.shell-bottomnav\s*\{[\s\S]*?border-radius:\s*0\s*!important;/);
       });
        it('clips the desktop poster without clipping the countdown sticker', () => {
          expect(css).toMatch(/@media \(min-width:\s*640px\)[\s\S]*\[data-shape='rounded'\]\s+\.zine-countdown\s*\{\s*overflow:\s*visible;/);
          expect(css).not.toMatch(/\[data-shape='rounded'\]\s+\.zine-countdown\s*\{\s*overflow:\s*hidden;/);
          expect(css).toMatch(/\[data-shape='rounded'\]\s+\.zine-countdown-poster\s*\{[\s\S]*?border-radius:[^;]*--zine-countdown-card-border[^;]*!important;/);
          expect(css).toMatch(/\.zine-countdown-poster picture,[\s\S]*\.zine-countdown-img\s*\{\s*border-radius:\s*0\s*!important;/);
          expect(css).toMatch(/\[data-shape='rounded'\]\[data-theme='y2k'\]\s+\.zine-countdown-poster\s*\{\s*border-top-left-radius:\s*0\s*!important;/);
        });
         it('rounds only the top of the Y2K card titlebar', () => {
           expect(css).toMatch(/\[data-theme='y2k'\] \.zine-card::before\s*\{[\s\S]*border-radius:\s*max\(0px, calc\(var\(--orbit-radius-legacy, 0px\) - 2px\)\) max\(0px, calc\(var\(--orbit-radius-legacy, 0px\) - 2px\)\) 0 0;/);
         });
          it('does not decorate the Sakura brand with a pseudo-element', () => {
            expect(css).not.toMatch(/\[data-theme='sakura'\] \.zine-brand::after\s*\{/);
          });
         it('places featured posters flush with the polaroid frame', () => {
          expect(css).toMatch(/\.zine-polaroid\s*\{\s*padding:\s*0 0 0\.75rem;\s*\}/);
          expect(css).toMatch(/\.zine-polaroid > p\s*\{\s*padding-inline:\s*0\.625rem;\s*\}/);
        });
        it('keeps polaroid poster layers square inside the clipping card', () => {
          expect(css).toMatch(/\.zine-polaroid\s*\{[\s\S]*?overflow:\s*hidden;/);
          expect(css).toMatch(/\.zine-polaroid-poster,\s*\.zine-polaroid-poster picture,\s*\.zine-polaroid-poster img\s*\{\s*border-radius:\s*0 !important;/);
        });
        it('keeps a sharp legacy radius across themes until rounded shape overrides it', () => {
      for (const theme of themes) {
        expect(themeBlock(theme)).toMatch(/--orbit-radius-legacy:\s*0(px)?/);
      }
      expect(css).toMatch(/\[data-shape='rounded'\]\s*\{[\s\S]*--orbit-radius-legacy:\s*0\.75rem/);
      expect(css).toMatch(/\[data-shape='rounded'\]\s*\{[\s\S]*--orbit-radius-surface:\s*1rem/);
       expect(css).toMatch(/\.orbit-round-data\s*\{[\s\S]*border-radius: 9999px !important/);
     });
     it('preserves only explicitly marked semantic circles in rounded mode', () => {
       const circleInventory = [
         'src/lib/components/BackToTopButton.svelte',
         'src/lib/components/chat/ChatApp.svelte',
         'src/lib/components/Navigation.svelte',
         'src/lib/components/SeriesDetailPanel.svelte',
         'src/routes/[lang=lang]/(app)/menus/+page.svelte'
       ];
       for (const file of circleInventory) expect(readFileSync(file, 'utf8')).toContain('orbit-round-data');
       expect(css).not.toMatch(/rounded-full[^\n]*border-radius:\s*9999px/);
     });
   it('uses only valid registered-property grammars for visual primitives', () => {
    expect(css).not.toMatch(/@property[^}]*syntax:\s*'<shadow>'/);
    expect(css).not.toMatch(/@property[^}]*syntax:\s*'<image>'[^}]*initial-value:\s*none/);
    expect(css).toContain("@property --orbit-font-heading-weight { syntax: '<number>'");
    expect(css).toContain("@property --orbit-font-label-weight { syntax: '<number>'");
    expect(css).toContain("@property --orbit-motion-fast { syntax: '<time>'");
    expect(css).toContain("@property --orbit-motion-ease { syntax: '<easing-function>'");
    expect(css).toContain("@property --orbit-radius-legacy { syntax: '<length>'");
   });
   it('keeps shared recipes recoverable when primitive tokens are missing or cyclic', () => {
      const recipes = ['.glass-card', '.glass-card-strong', '.orbit-surface', '.orbit-rail', '.orbit-control', '.orbit-menu', '.orbit-menu-item', '.orbit-action', '.orbit-menu-dialog', '.orbit-dialog', '.orbit-dialog-panel', '.orbit-input', '.orbit-focusable', '.orbit-badge'];
     for (const recipe of recipes) {
      const block = css.match(new RegExp(`${recipe.replace('.', '\\.')}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
       expect(block).not.toMatch(/var\(--[\w-]+\s*\)/);
       expect(block).toMatch(/var\(--[\w-]+,\s*[^)]+\)/);
     }
      // var() fallbacks cover missing/cyclic references, not arbitrary invalid
      // values supplied by unregistered custom properties.
      expect(css).toContain('var(--orbit-surface, #ffffff)');
      expect(css).toContain('var(--orbit-radius-control, 0.25rem)');
    });
    it('keeps shared recipes valid: shadows stay literal, fonts need fallbacks', () => {
      const recipes = css.match(/\.(?:glass-card|orbit-surface|orbit-control|orbit-menu|orbit-dialog-panel)[^{]*\{[\s\S]*?\}/g)?.join('\n') ?? '';
     expect(recipes).not.toMatch(/var\(--orbit.shadow-|var\(--orbit-font-(?:display|body)\)/);
      expect(css).toContain('background-image: var(--orbit-accent-image, none);');
   });
    it('provides inline decorative images and textures for personality themes', () => {
    const sakura = themeBlock('sakura');
    const midnight = themeBlock('midnight');
    const y2k = themeBlock('y2k');
    const fanzine = themeBlock('fanzine');
    expect(sakura).toMatch(/--orbit-texture-image:\s*url\("data:image\/svg\+xml,/);
    expect(sakura).toMatch(/--orbit-accent-image:\s*url\("data:image\/svg\+xml,/);
    expect(midnight).toMatch(/--orbit-texture-image:\s*url\("data:image\/svg\+xml,/);
    expect(y2k).toMatch(/--orbit-texture-image:\s*url\("data:image\/svg\+xml,/);
    expect(fanzine).toMatch(/--orbit-accent-image:\s*url\("data:image\/svg\+xml,/);
      expect(css).toMatch(/\.noise-overlay::after\s*\{[\s\S]*pointer-events: none;/);
     expect(css).toMatch(/\[data-theme='sakura'\][\s\S]*\.minimal-shell[\s\S]*\.noise-overlay::after\s*\{[\s\S]*display: block;[\s\S]*pointer-events: none;[\s\S]*animation: none;/);
     expect(css).toMatch(/\[data-theme='midnight'\][\s\S]*\.minimal-shell[\s\S]*\.noise-overlay::after\s*\{[\s\S]*display: block;[\s\S]*pointer-events: none;[\s\S]*animation: none;/);
    });
    it('consumes personality effects through bounded shared recipes', () => {
      expect(css).toMatch(/\.orbit-action\s*\{[\s\S]*var\(--orbit-shadow-accent, 0 0 0 transparent\)/);
      expect(css).toMatch(/\.orbit-action::after\s*\{[\s\S]*background: var\(--orbit-accent-image, none\);[\s\S]*pointer-events: none;/);
      expect(css).toMatch(/\.orbit-decoration\s*\{[\s\S]*background-image: var\(--orbit-accent-image, none\);[\s\S]*pointer-events: none;/);
      expect(css).toMatch(/\.noise-overlay::after\s*\{[\s\S]*background-image: var\(--orbit-texture-image, none\);/);
    });
    it('preserves theme radius tokens for navigation items', () => {
      expect(css).toMatch(/:is\(body [^)]*body \.orbit-nav-item\)[\s\S]*border-radius: var\(--orbit-radius-surface/);
    });
   it('applies the shared label weight to action, menu, and badge recipes', () => {
     for (const recipe of ['.orbit-control', '.orbit-menu', '.orbit-menu-item', '.orbit-dialog-action', '.orbit-action', '.orbit-menu-dialog', '.orbit-badge']) {
       const block = css.match(new RegExp(`${recipe.replace('.', '\\.') }\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
       expect(block).toContain('font-weight: var(--orbit-font-label-weight, 600)');
     }
   });
   it('uses a tokenized focus outline at least 2px wide', () => {
     expect(css).toContain(':is(a, button, input, select, textarea):focus-visible');
      expect(css).toContain('outline: max(2px, var(--orbit-border-width, 1px)) var(--orbit-border-style, solid) var(--orbit-border-focus, #b23f1d);');
   });
  it('lets reduced motion override every theme token source', () => {
   const reducedMotion = css.match(/@media \(prefers-reduced-motion: reduce\) \{\s*:root,([\s\S]*?)\n  \}/)?.[1] ?? '';
   for (const theme of themes.slice(1)) expect(reducedMotion).toContain(`[data-theme='${theme}']`);
   expect(reducedMotion).toContain('--orbit-motion-fast: 0.01ms');
   expect(reducedMotion).toContain('--orbit-motion-standard: 0.01ms');
   expect(reducedMotion).toContain('--orbit-motion-theme: 0.01ms');
  });
  it('uses the active display font for every page element', () => {
       expect(css).toMatch(/body\s*\{[\s\S]*?font-family: var\(--orbit-font-display\) !important;/);
       expect(css).toMatch(/body \*\s*\{[\s\S]*?font-family: var\(--orbit-font-display\) !important;/);
      });
      it('uses the Y2K Prompt fallback for Thai in Sakura, Midnight, and Mission', () => {
   for (const theme of ['y2k', 'sakura', 'midnight', 'mission'] as const) {
    expect(themeBlock(theme)).toMatch(/--orbit-font-display:[^;]*'Prompt'/);
    expect(themeBlock(theme)).toMatch(/--orbit-font-body:'Prompt'/);
   }
   expect(css).not.toMatch(/font-family:\s*'(?:Chivo Mono|IBM Plex Mono)',\s*monospace/);
  });
  it('marks midnight as the only dark color-scheme theme', () => {
   expect(themeBlock('midnight')).toContain('color-scheme: dark');
   for (const theme of ['y2k', 'sakura', 'ocean', 'candy', 'mission'] as const) {
    expect(themeBlock(theme)).not.toContain('color-scheme: dark');
   }
  });
});
