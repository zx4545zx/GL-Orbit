import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const css = readFileSync('src/app.css', 'utf8');
const themes = ['orbit', 'space', 'sakura', 'love'] as const;
const tokens = ['--orbit-paper', '--orbit-paper-deep', '--orbit-surface', '--orbit-ink', '--orbit-muted', '--orbit-line', '--orbit-line-strong', '--orbit-coral', '--orbit-coral-dark', '--orbit-coral-soft', '--orbit-lavender', '--orbit-mint', '--orbit-shadow', '--orbit-shadow-raised', '--orbit-rail', '--orbit-link', '--orbit-focus', '--orbit-selection', '--orbit-success', '--orbit-warning', '--orbit-error', '--orbit-overlay'];
describe('theme CSS contract', () => {
 it.each(themes)('%s defines semantic tokens', (theme) => {
  const selector = theme === 'orbit' ? ':root' : `[data-theme='${theme}']`;
  const block = css.match(new RegExp(`${selector.replace('[', '\\[').replace(']', '\\]')}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
  for (const token of tokens) expect(`${block}\n${css}`).toContain(token);
 });
 it('has no dark or system branch', () => { expect(css).not.toMatch(/data-theme=['"]dark['"]|prefers-color-scheme/); });
});
