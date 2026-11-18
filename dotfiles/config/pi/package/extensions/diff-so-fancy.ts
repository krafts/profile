/**
 * diff-so-fancy-style edit diffs (design: ~/pi-design/diffs-dsf.png, section "Alternative").
 *
 * Colors and highlighting follow diff-so-fancy's defaults (its DiffHighlight.pm), the same as
 * `git diff` through diff-so-fancy in the terminal:
 *   removed lines       bold red   (terminal palette, \e[1;31m)
 *   added lines         bold green (terminal palette, \e[1;32m)
 *   changed part        one span from the first to the last differing character, on #5f0000 /
 *                       #005f00 (xterm's colors 52 / 22, as 24-bit so the terminal theme can't
 *                       remap them); lines are paired when a hunk removes and adds the same
 *                       number of lines, and nothing is highlighted when the whole line changed
 *   unchanged lines     terminal default color
 *   empty +/- line      its first cell is a red / green block (diff-so-fancy markEmptyLines)
 * The -/+ markers and line numbers stay, in the line's color.
 *
 * The box background is the theme's tool panel (toolSuccessBg; #141414 in themes/opencode.json,
 * opencode's backgroundPanel); the changed-part spans and line ends return to it.
 *
 * How: the built-in edit tool is re-registered with its own definition (same execution, prompt
 * and renderers); after pi's renderers build the box, the diff body is swapped for this one.
 * Written against pi 1.5.2 (core/tools/renderers/edit.js).
 */

import { createEditToolDefinition, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Box, wrapTextWithAnsi } from "@earendil-works/pi-tui";

const OLD = { line: "\x1b[1;31m", color: "\x1b[31m", hl: "\x1b[48;2;95;0;0m" }; // red bold, #5f0000
const NEW = { line: "\x1b[1;32m", color: "\x1b[32m", hl: "\x1b[48;2;0;95;0m" }; // green bold, #005f00
const OFF = "\x1b[22;39m";

type Side = typeof OLD;
type Parsed = { marker: string; num: string; content: string };

/** pi's edit diff line: marker, padded line number, space, content (pi's parseDiffLine). */
function parse(line: string): Parsed | null {
	const m = line.match(/^([+-\s])(\s*\d*)\s(.*)$/);
	return m ? { marker: m[1], num: m[2], content: m[3].replace(/\t/g, "   ") } : null;
}

/** DiffHighlight.pm highlight_pair: common prefix and suffix; the middle is the changed part. */
function pair(a: string, b: string): [[number, number], [number, number]] | null {
	const A = [...a];
	const B = [...b];
	let p = 0;
	while (p < A.length && p < B.length && A[p] === B[p]) p++;
	if (p === A.length || p === B.length) return null; // one line is a prefix of the other
	let sa = A.length - 1;
	let sb = B.length - 1;
	while (sa >= p && sb >= p && A[sa] === B[sb]) {
		sa--;
		sb--;
	}
	// is_pair_interesting: only highlight a part of the line, never all of it.
	const some = (chars: string[]) => /\S/.test(chars.join(""));
	if (!some(A.slice(0, p)) && !some(A.slice(sa + 1)) && !some(B.slice(sb + 1))) return null;
	return [
		[p, sa],
		[p, sb],
	];
}

function changedLine(side: Side, l: Parsed, panel: string, span?: [number, number]): string {
	const head = side.line + l.marker + l.num;
	if (l.content === "") return `${head}${OFF} \x1b[7m${side.color} \x1b[27m${OFF}`; // markEmptyLines
	if (!span) return `${head} ${l.content}${OFF}`;
	const chars = [...l.content];
	const [start, end] = span;
	return (
		`${head} ${chars.slice(0, start).join("")}` +
		`${side.hl}${chars.slice(start, end + 1).join("")}${panel}` +
		`${chars.slice(end + 1).join("")}${OFF}`
	);
}

/** `panel` is the SGR code of the box background, restored after each changed-part span. */
export function renderFancyDiff(diff: string, panel: string): string {
	const lines = diff.split("\n");
	const out: string[] = [];
	for (let i = 0; i < lines.length; ) {
		const p = parse(lines[i]);
		if (!p || p.marker === " ") {
			out.push(lines[i].replace(/\t/g, "   "));
			i++;
			continue;
		}
		const removed: Parsed[] = [];
		const added: Parsed[] = [];
		while (i < lines.length && parse(lines[i])?.marker === "-") removed.push(parse(lines[i++])!);
		while (i < lines.length && parse(lines[i])?.marker === "+") added.push(parse(lines[i++])!);
		const spans = removed.length === added.length ? removed.map((r, k) => pair(r.content, added[k].content)) : [];
		removed.forEach((r, k) => out.push(changedLine(OLD, r, panel, spans[k]?.[0])));
		added.forEach((a, k) => out.push(changedLine(NEW, a, panel, spans[k]?.[1])));
	}
	return out.join("\n");
}

/** Wrapped diff text. Each row ends back on the panel color, so the padding after it is clean. */
class FancyDiff {
	private cache?: { width: number; lines: string[] };
	constructor(
		private readonly text: string,
		private readonly panel: string,
	) {}
	render(width: number): string[] {
		if (this.cache?.width !== width) {
			const lines = wrapTextWithAnsi(this.text, width).map((l) => `${l}\x1b[22;27;39m${this.panel}`);
			this.cache = { width, lines };
		}
		return this.cache.lines;
	}
	invalidate() {
		this.cache = undefined;
	}
}

const bodies = new WeakMap<object, { key: string; body: FancyDiff }>();

/** pi's edit box: [header, spacer, diff body] once a diff preview exists. Swap in our body. */
function restyleEditBox(box: any, theme: any) {
	const preview = box?.preview;
	if (!preview || "error" in preview || typeof preview.diff !== "string") return;
	if (!Array.isArray(box.children) || box.children.length !== 3) return;
	const panel = theme.getBgAnsi("toolSuccessBg"); // pi draws a diff box with toolSuccessBg
	const key = panel + preview.diff;
	let cached = bodies.get(box);
	if (cached?.key !== key) {
		cached = { key, body: new FancyDiff(renderFancyDiff(preview.diff, panel), panel) };
		bodies.set(box, cached);
	}
	box.children[2] = cached.body;
	box.invalidateCache();
}

export default function (pi: ExtensionAPI) {
	const base: any = createEditToolDefinition(process.cwd());
	if (typeof base.renderCall !== "function" || typeof base.renderResult !== "function") return;

	pi.registerTool({
		...base,
		renderCall(args: any, theme: any, context: any) {
			const box = base.renderCall(args, theme, context);
			restyleEditBox(box, theme);
			return box;
		},
		renderResult(result: any, options: any, theme: any, context: any) {
			const out = base.renderResult(result, options, theme, context);
			const box = context.state?.callComponent;
			if (box) {
				restyleEditBox(box, theme); // pi may have rebuilt it with the final diff
			} else if (!context.isError && typeof result.details?.diff === "string" && out?.children?.length === 2) {
				// No call box (e.g. a restored session row): pi put the diff in the result instead.
				const bg = theme.getBgAnsi("toolSuccessBg");
				const panel = new Box(context.outputPad ?? 1, 0, (text: string) => theme.bg("toolSuccessBg", text));
				panel.addChild(new FancyDiff(renderFancyDiff(result.details.diff, bg), bg) as any);
				out.children[1] = panel;
				out.invalidate?.();
			}
			return out;
		},
	});
}
