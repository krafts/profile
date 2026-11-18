/**
 * Palette roles of the active pi theme, for the extensions.
 *
 * Themes generated from palettes/ carry every palette role in their `vars` (see convert.ts), and
 * pi records each theme's file as `theme.sourcePath`. `roles()` reads the active theme's vars, so
 * the extensions follow theme switches. For any other theme it returns undefined and the
 * extensions fall back to pi's own look.
 */

import { readFileSync } from "node:fs";
import type { Color } from "./convert.ts";

const UI = Symbol.for("krafts.appearance.ui");
const CACHE = Symbol.for("krafts.appearance.roles");
const g = globalThis as any;

/** Call from session_start: `ctx.ui.theme` always returns the active theme. */
export function trackUi(ui: { theme: any }) {
	g[UI] = ui;
	g[CACHE] = new Map(); // /reload regenerates theme files
}

export type Roles = Record<string, Color>;

export function roles(): Roles | undefined {
	const path: string | undefined = g[UI]?.theme?.sourcePath;
	if (!path) return undefined;
	const cache: Map<string, Roles | null> = (g[CACHE] ??= new Map());
	if (!cache.has(path)) {
		let found: Roles | null = null;
		try {
			const vars = JSON.parse(readFileSync(path, "utf8")).vars;
			if (vars && "backgroundElement" in vars && "markdownStrong" in vars && "cursor" in vars) found = vars;
		} catch {}
		cache.set(path, found);
	}
	return cache.get(path) ?? undefined;
}

// ---- SGR helpers for palette colors: "#rrggbb", "" (terminal default) or an ANSI index ----

export const fg = (c: Color): string =>
	typeof c === "number" ? `\x1b[38;5;${c}m` : c ? `\x1b[38;2;${rgb(c).join(";")}m` : "\x1b[39m";

export const bg = (c: Color): string =>
	typeof c === "number" ? `\x1b[48;5;${c}m` : c ? `\x1b[48;2;${rgb(c).join(";")}m` : "\x1b[49m";

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** a * t + b * (1 - t). Needs two hex colors; otherwise returns `a`. */
export function mix(a: Color, b: Color, t: number): Color {
	if (typeof a !== "string" || typeof b !== "string" || !a || !b) return a;
	const [x, y] = [rgb(a), rgb(b)];
	return `#${x.map((v, i) => Math.round(v * t + y[i] * (1 - t)).toString(16).padStart(2, "0")).join("")}`;
}
