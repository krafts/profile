/**
 * Palette (opencode v1 theme JSON) -> pi theme JSON.
 *
 * Input format, as in opencode's packages/tui/src/theme/assets/*.json:
 *   { "defs": { name: color }, "theme": { role: color | { "dark": color, "light": color } } }
 * A color is "#rgb" / "#rrggbb" / "#rrggbbaa", a reference to a def or another role, an ANSI
 * palette index, or "none" / "transparent" (the terminal's default). This mirrors opencode's
 * resolveV1 (packages/theme/src/tui/v1-migrate.ts).
 *
 * pi-only addition: an optional "cursor" role, the color of the input box's block cursor
 * (default: success).
 *
 * Output: one pi theme per appearance the palette defines. A palette with { dark, light } values
 * gives `<name>` (dark) and `<name>-light`; a palette with plain values gives `<name>` only.
 * Every resolved role goes into the theme's `vars` under its palette name, so the extensions can
 * read roles pi has no color token for (see palette.ts); `colors` maps pi's tokens onto them.
 */

export type Mode = "dark" | "light";
export type Color = string | number; // "#rrggbb", "" (terminal default), or an ANSI index

/** Roles every palette must define (opencode's v1 Theme type). */
export const REQUIRED_ROLES = [
	"primary", "secondary", "accent", "error", "warning", "success", "info",
	"text", "textMuted", "background", "backgroundPanel", "backgroundElement",
	"border", "borderActive", "borderSubtle",
	"diffAdded", "diffRemoved", "diffContext", "diffHunkHeader", "diffHighlightAdded", "diffHighlightRemoved",
	"diffAddedBg", "diffRemovedBg", "diffContextBg", "diffLineNumber", "diffAddedLineNumberBg", "diffRemovedLineNumberBg",
	"markdownText", "markdownHeading", "markdownLink", "markdownLinkText", "markdownCode", "markdownBlockQuote",
	"markdownEmph", "markdownStrong", "markdownHorizontalRule", "markdownListItem", "markdownListEnumeration",
	"markdownImage", "markdownImageText", "markdownCodeBlock",
	"syntaxComment", "syntaxKeyword", "syntaxFunction", "syntaxVariable", "syntaxString", "syntaxNumber",
	"syntaxType", "syntaxOperator", "syntaxPunctuation",
] as const;

/** Optional roles and the role they fall back to. */
const OPTIONAL_ROLES: Record<string, string> = {
	selectedListItemText: "background",
	backgroundMenu: "backgroundElement",
	cursor: "success",
};

/** pi color token -> palette role. */
const PI_COLORS: Record<string, string | number> = {
	accent: "primary",
	border: "border",
	borderAccent: "borderActive",
	borderMuted: "border",
	success: "success",
	error: "error",
	warning: "warning",
	muted: "textMuted",
	dim: "textMuted",
	text: "text",
	thinkingText: "textMuted",
	selectedBg: "backgroundElement",
	userMessageBg: "backgroundPanel",
	userMessageText: "text",
	customMessageBg: "backgroundPanel",
	customMessageText: "text",
	customMessageLabel: "primary",
	// opencode draws every tool block on the panel, whatever its state; errors are red text.
	toolPendingBg: "backgroundPanel",
	toolSuccessBg: "backgroundPanel",
	toolErrorBg: "backgroundPanel",
	toolTitle: "text",
	toolOutput: "textMuted",
	mdHeading: "markdownHeading",
	mdLink: "markdownLinkText",
	mdLinkUrl: "markdownLink",
	mdCode: "markdownCode",
	mdCodeBlock: "markdownCodeBlock",
	mdCodeBlockBorder: "border",
	mdQuote: "markdownBlockQuote",
	mdQuoteBorder: "markdownBlockQuote",
	mdHr: "markdownHorizontalRule",
	mdListBullet: "markdownListItem",
	// Not palette roles: diff-so-fancy's colors, like the edit diffs (extensions/diff-so-fancy.ts).
	// pi also uses these for ```diff code blocks. 1 / 2 are the terminal's red / green.
	toolDiffAdded: 2,
	toolDiffRemoved: 1,
	toolDiffContext: "",
	syntaxComment: "syntaxComment",
	syntaxKeyword: "syntaxKeyword",
	syntaxFunction: "syntaxFunction",
	syntaxVariable: "syntaxVariable",
	syntaxString: "syntaxString",
	syntaxNumber: "syntaxNumber",
	syntaxType: "syntaxType",
	syntaxOperator: "syntaxOperator",
	syntaxPunctuation: "syntaxPunctuation",
	thinkingOff: "textMuted",
	thinkingMinimal: "primary",
	thinkingLow: "secondary",
	thinkingMedium: "info",
	thinkingHigh: "accent",
	thinkingXhigh: "error",
	bashMode: "warning",
	scrollbarThumb: "borderActive",
	scrollbarTrack: "background",
};

export type PiTheme = {
	$schema: string;
	name: string;
	appearance: Mode;
	vars: Record<string, Color>;
	colors: Record<string, string | number>;
};

/** Normalize a hex color to #rrggbb; fully transparent becomes the terminal default. */
function hex(value: string): string {
	let h = value.slice(1).toLowerCase();
	if (!/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(h)) throw new Error(`invalid color "${value}"`);
	if (h.length === 3) h = [...h].map((c) => c + c).join("");
	if (h.length === 8) {
		if (h.endsWith("00")) return "";
		h = h.slice(0, 6); // pi has no alpha; opaque enough for terminal colors
	}
	return `#${h}`;
}

function resolver(palette: any, mode: Mode) {
	const defs: Record<string, unknown> = palette.defs ?? {};
	const roles: Record<string, unknown> = palette.theme;
	const resolve = (value: unknown, chain: string[]): Color => {
		if (typeof value === "number") return value;
		if (typeof value === "string") {
			if (value === "none" || value === "transparent") return "";
			if (value.startsWith("#")) return hex(value);
			if (chain.includes(value)) throw new Error(`circular reference: ${[...chain, value].join(" -> ")}`);
			const next = defs[value] ?? roles[value];
			if (next === undefined) throw new Error(`"${value}" is not a def or role`);
			return resolve(next, [...chain, value]);
		}
		if (value && typeof value === "object" && mode in value) return resolve((value as any)[mode], chain);
		throw new Error(`invalid color ${JSON.stringify(value)}`);
	};
	// Like opencode, start with an empty chain: a role may name a def of the same name.
	return (role: string) => resolve(roles[role], []);
}

/** Which appearances a palette defines: both if any role has { dark, light }. */
function modes(palette: any): Mode[] {
	const values = Object.values(palette.theme ?? {});
	if (values.some((v) => v && typeof v === "object")) return ["dark", "light"];
	return [luminance(resolver(palette, "dark")("background")) > 0.5 ? "light" : "dark"];
}

function luminance(color: Color): number {
	if (typeof color !== "string" || !color.startsWith("#")) return 0;
	const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255);
	return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Convert one palette. `name` is the base theme name (the dark one, or the only one). */
export function convertPalette(palette: any, name: string): PiTheme[] {
	if (!palette || typeof palette !== "object" || !palette.theme || typeof palette.theme !== "object") {
		throw new Error('not an opencode v1 theme (no "theme" object)');
	}
	const missing = REQUIRED_ROLES.filter((r) => !(r in palette.theme));
	if (missing.length) throw new Error(`missing roles: ${missing.join(", ")}`);
	const all = modes(palette);
	return all.map((mode) => {
		const role = resolver(palette, mode);
		const vars: Record<string, Color> = {};
		for (const r of REQUIRED_ROLES) vars[r] = role(r);
		for (const [r, fallback] of Object.entries(OPTIONAL_ROLES)) {
			vars[r] = r in palette.theme ? role(r) : vars[fallback];
		}
		return {
			$schema: "https://pi.dev/schemas/theme.schema.json",
			name: all.length > 1 && mode === "light" ? `${name}-light` : name,
			appearance: mode,
			vars,
			colors: { ...PI_COLORS },
		};
	});
}

/** Base theme name for a palette file: its file name. pi's own theme names are not allowed. */
export function themeName(file: string): string {
	const base = file.replace(/\.json$/i, "");
	if (["system", "dark", "light"].includes(base) || base.includes("/")) {
		throw new Error(`"${base}" is a pi theme name; rename the palette file`);
	}
	return base;
}
