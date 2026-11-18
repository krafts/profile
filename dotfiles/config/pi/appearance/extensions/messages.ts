/**
 * Message colors that pi's theme format cannot express, from the active theme's palette roles
 * (../lib/palette.ts). With a theme that is not made from a palette, 1 and 2 are off.
 *
 * 1. Markdown (all messages):
 *      plain text      markdownText            (pi leaves assistant text uncolored)
 *      **bold**        markdownStrong
 *      *italic*        markdownEmph
 *      1. 2. numbers   markdownListEnumeration (bullets keep pi's mdListBullet)
 *    Bold/italic replace the surrounding text color (also inside quotes and lists) but keep its other
 *    styling; inline code and links inside them keep their own colors.
 *    Headings, links, code, quotes, rules and bullets come from the pi theme itself.
 *    Text that has its own color (your messages, thinking) keeps it.
 * 2. Your messages: a left bar in secondary on the backgroundPanel panel, like opencode.
 * 3. Text selection (fullscreen mode) covers only text, like opencode: the left gutter (padding, box
 *    padding, the `▎ ` bar) shared by the selected rows is skipped, so code keeps its indentation,
 *    and every row stops at its last character instead of the right edge. Applies to both the
 *    highlight and the copied text.
 *
 * How: pi's Markdown and UserMessageComponent prototypes are wrapped (extensions import the same
 * classes pi uses). Display only: sessions and model context are unchanged. The wrappers are
 * installed once per process and replaced cleanly on /reload. Written against pi 1.5.2.
 */

import { type ExtensionAPI, UserMessageComponent } from "@earendil-works/pi-coding-agent";
import { Markdown, TuiAltScreen, visibleWidth } from "@earendil-works/pi-tui";
import { bg as BG, fg as FG, roles, trackUi } from "../lib/palette.ts";

const FG_RESET = "\x1b[39m";

/** Does this SGR parameter list reset the foreground (0, 39, or an empty reset)? */
function resetsForeground(params: string): boolean {
	if (params === "") return true;
	const p = params.split(/[;:]/).map(Number);
	for (let i = 0; i < p.length; i++) {
		if (p[i] === 38 || p[i] === 48) i += p[i + 1] === 2 ? 4 : 2; // skip extended color arguments
		else if (p[i] === 0 || p[i] === 39) return true;
	}
	return false;
}

/** Remove foreground colors from a style string, keeping everything else (italic, dim, ...). */
function stripForeground(s: string): string {
	return s.replace(/\x1b\[([0-9;:]*)m/g, (m, params: string) => {
		if (params === "") return m;
		const p = params.split(/[;:]/);
		const keep: string[] = [];
		for (let i = 0; i < p.length; i++) {
			const n = Number(p[i]);
			if (n === 38) i += p[i + 1] === "2" ? 4 : 2;
			else if (n === 48) {
				keep.push(...p.slice(i, i + (p[i + 1] === "2" ? 5 : 3)));
				i += p[i + 1] === "2" ? 4 : 2;
			} else if (n !== 39) keep.push(p[i]);
		}
		return keep.length ? `\x1b[${keep.join(";")}m` : "";
	});
}

/** Plain text of a rendered line: no SGR, OSC (links, markers) or APC (cursor) sequences. */
const plainText = (line: string) =>
	line.replace(/\x1b\[[0-9;:?]*[A-Za-z]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b_[^\x07]*\x07/g, "");

// Keys predate the move to appearance/: renaming ORIG would make /reload wrap old wrappers.
const ORIG = Symbol.for("krafts.opencodeMessages.orig");
const REAL = Symbol.for("krafts.opencodeMessages.realTheme");
const SEL = Symbol.for("krafts.opencodeMessages.selection");

function install() {
	const mdProto: any = Markdown.prototype;
	const umProto: any = UserMessageComponent.prototype;
	// Originals survive /reload: always wrap pi's own methods, never a previous wrapper.
	// Fill each key separately so a cache from an older version of this file gains new keys.
	const orig = ((globalThis as any)[ORIG] ??= {});
	orig.render ??= mdProto.render;
	orig.renderInlineTokens ??= mdProto.renderInlineTokens;
	orig.renderList ??= mdProto.renderList;
	orig.userRender ??= umProto.render;
	const altProto: any = TuiAltScreen.prototype;
	orig.selectionColumns ??= altProto.getSelectionColumns;
	orig.selectionText ??= altProto.getActiveSelectionText;
	orig.applySelection ??= altProto.applySelection;

	// ---- plain text color for markdown that has none (assistant replies, summaries) ----
	const processed = new WeakMap<string[], { on: string; out: string[] }>();
	mdProto.render = function (width: number) {
		const lines: string[] = orig.render.call(this, width);
		const r = roles();
		if (!r || this.defaultTextStyle !== undefined) return lines;
		const on = FG(r.markdownText);
		let out = processed.get(lines)?.on === on ? processed.get(lines)!.out : undefined;
		if (!out) {
			out = lines.map((line) =>
				line === ""
					? line
					: on + line.replace(/\x1b\[([0-9;:]*)m/g, (m, params) => (resetsForeground(params) ? m + on : m)) + FG_RESET,
			);
			processed.set(lines, { on, out }); // pi caches `lines` until the text or width changes
		}
		return out;
	};

	// ---- bold / italic: their own style context, so the color wins over the surrounding style ----
	mdProto.renderInlineTokens = function (tokens: any[], styleContext?: any) {
		const r = roles();
		if (!r || !tokens?.some((t) => t.type === "strong" || t.type === "em")) {
			return orig.renderInlineTokens.call(this, tokens, styleContext);
		}
		const ctx = styleContext ?? this.getDefaultInlineStyleContext();
		let result = "";
		let run: any[] = [];
		const flush = () => {
			if (run.length) result += orig.renderInlineTokens.call(this, run, ctx);
			run = [];
		};
		for (const token of tokens) {
			if (token.type !== "strong" && token.type !== "em") {
				run.push(token);
				continue;
			}
			flush();
			const hex = token.type === "strong" ? r.markdownStrong : r.markdownEmph;
			const prefix = stripForeground(ctx.stylePrefix ?? "") + FG(hex);
			const inner = {
				applyText: (text: string) => FG(hex) + stripForeground(ctx.applyText(text)) + FG_RESET,
				stylePrefix: prefix,
			};
			const content = this.renderInlineTokens(token.tokens || [], inner);
			const styled = token.type === "strong" ? this.theme.bold(content) : this.theme.italic(content);
			result += styled + (ctx.stylePrefix ?? "");
		}
		flush();
		const tail = ctx.stylePrefix;
		while (tail && result.endsWith(tail)) result = result.slice(0, -tail.length);
		return result;
	};

	// ---- ordered list numbers in markdownListEnumeration; bullets (also nested) keep the theme's ----
	mdProto.renderList = function (token: any, ...rest: any[]) {
		const r = roles();
		const current = this.theme;
		const real = current[REAL] ?? current; // pi's own markdown theme
		let theme = real;
		if (r && token?.ordered) {
			theme = Object.create(real);
			theme[REAL] = real;
			theme.listBullet = (s: string) => FG(r.markdownListEnumeration) + s + FG_RESET;
		}
		this.theme = theme;
		try {
			return orig.renderList.call(this, token, ...rest);
		} finally {
			this.theme = current;
		}
	};

	// ---- selection: only text. Skip the left gutter (padding, box padding, `▎ ` bar) and stop at
	// the last character. The gutter is the indent shared by all selected rows, so indentation inside
	// code blocks and tool output is kept. pi asks for each row's columns in one pass (highlight or
	// copy); we run that pass twice: first to collect the rows, then with the shared gutter applied.
	if ([orig.selectionColumns, orig.selectionText, orig.applySelection].every((f) => typeof f === "function")) {
		const gutterWidth = (plain: string) => visibleWidth(/^ *(?:\u258e *)?/.exec(plain)![0]);

		altProto.getSelectionColumns = function (line: string, ...rest: any[]) {
			const cols = orig.selectionColumns.call(this, line, ...rest);
			const state = this[SEL];
			if (!state) return cols;
			const plain = plainText(line);
			if (state.rows) {
				// Collect: blank rows and rows where the selection starts inside the text don't count.
				const gutter = gutterWidth(plain);
				if (plain.trim() !== "" && cols.start <= gutter) state.rows.push(gutter);
				return cols;
			}
			const start = Math.max(cols.start, state.gutter);
			return { start, end: Math.max(start, Math.min(cols.end, visibleWidth(plain.trimEnd()))) };
		};

		const twoPass = (fn: Function) =>
			function (this: any, ...args: any[]) {
				const rows: number[] = [];
				try {
					this[SEL] = { rows };
					fn.apply(this, args);
					this[SEL] = { gutter: rows.length ? Math.min(...rows) : 0 };
					return fn.apply(this, args);
				} finally {
					this[SEL] = undefined;
				}
			};
		altProto.getActiveSelectionText = twoPass(orig.selectionText);
		altProto.applySelection = twoPass(orig.applySelection);
	}

	// ---- your messages: blue bar on the left ----
	// Text starts at column TEXT_COL, like the input box (bar + one space). pi already pads the message
	// by outputPad, so the prefix only adds the bar and whatever padding is still missing.
	const TEXT_COL = 2;
	umProto.render = function (width: number) {
		const r = roles();
		if (!r || width < 4) return orig.userRender.call(this, width);
		const pad = Number.isFinite(this.outputPad) ? Math.max(0, this.outputPad) : 1;
		const gap = Math.max(0, TEXT_COL - 1 - pad);
		const prefix = BG(r.backgroundPanel) + FG(r.secondary) + "\u258e" + FG_RESET + " ".repeat(gap);
		// pi starts the first and last rows with OSC 133 prompt marks. Keep them at column 0, before
		// the bar: a terminal that sees `133;A` mid-line starts a fresh line, which broke the top row.
		return orig.userRender.call(this, width - 1 - gap).map((line: string) => {
			const marks = /^(?:\x1b\]133;[^\x07\x1b]*(?:\x07|\x1b\\))*/.exec(line)![0];
			return marks + prefix + line.slice(marks.length);
		});
	};
}

export default function (pi: ExtensionAPI) {
	install();
	pi.on("session_start", async (_event, ctx) => trackUi(ctx.ui));
}
