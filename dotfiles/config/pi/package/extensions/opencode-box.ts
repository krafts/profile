/**
 * opencode-style input box (design: ~/pi-design/DESIGN.md, mockup: final-v2.png).
 *
 * - The editor is drawn as an opencode panel: #1e1e1e background, a blue left bar, no top/bottom
 *   rules, a padding row above the text and a status row at the bottom.
 * - While the agent works, the status row shows the working indicator and the Esc hint:
 *     snake (default): 8 slots, a bright head with a fading 3-block tail sweeping back and forth
 *     pi:              pi's braille spinner and "Working..."
 *   followed by "esc interrupt", or "esc again to interrupt" (orange) after a first Esc
 *   (state published by double-esc-interrupt.ts).
 * - pi's own working row above the editor is hidden. The footer is unchanged (context-tokens.ts).
 * - `/working-style [snake|pi]` switches the indicator; the choice is saved to
 *   ~/.pi/agent/opencode-box.json.
 *
 * Colors are exact 24-bit values from opencode's own theme file, not theme keys
 * (they match the opencode theme in ../themes/opencode.json).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { CustomEditor, type ExtensionAPI, type KeybindingsManager } from "@earendil-works/pi-coding-agent";
import { type EditorTheme, type TUI, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

// ---- colors: opencode's theme file (packages/tui/src/theme/assets/opencode.json, dark) ----
const PANEL = "#1e1e1e"; // backgroundElement
const BLUE = "#5c9cf5"; // secondary
const TEXT = "#eeeeee"; // text
const MUTED = "#808080"; // textMuted
const SLOT = "#3c3c3c"; // borderSubtle
const ORANGE = "#f5a742"; // warning
const PEACH = "#fab283"; // primary
const CURSOR = "#6ef2b8"; // not in opencode's theme; sampled from the opencode screenshot

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const fg = (hex: string) => `\x1b[38;2;${rgb(hex).join(";")}m`;
const bg = (hex: string) => `\x1b[48;2;${rgb(hex).join(";")}m`;
const mix = (a: string, b: string, t: number) => {
	const [x, y] = [rgb(a), rgb(b)];
	return `#${x.map((v, i) => Math.round(v * t + y[i] * (1 - t)).toString(16).padStart(2, "0")).join("")}`;
};
const RESET = "\x1b[0m";
const BOX = bg(PANEL) + fg(TEXT); // base style inside the box

// ---- layout ----
const BAR = "\u258e"; // ▎ thin left bar
const LEFT = 2; // bar + one space
const RIGHT = 1;

// pi's fake-cursor markers (rendered later as reverse video): color the cursor block green.
const FAKE_CURSOR_START = "\x1b_pi:fc\x07";
const FAKE_CURSOR_END = "\x1b_pi:/fc\x07";

// ---- working indicators ----
const SLOTS = 8;
const FADE = [1, 0.62, 0.36, 0.18]; // head, then tail
const SNAKE_FRAMES: Array<[number, number]> = [
	...Array.from({ length: SLOTS }, (_, h) => [h, 1] as [number, number]),
	...Array.from({ length: SLOTS - 2 }, (_, i) => [SLOTS - 2 - i, -1] as [number, number]),
];
const SPINNER = ["\u280b", "\u2819", "\u2839", "\u2838", "\u283c", "\u2834", "\u2826", "\u2827", "\u2807", "\u280f"];
const FRAME_MS = 80;

const ESC_KEY = Symbol.for("krafts.escArmedUntil"); // set by double-esc-interrupt.ts

type Style = "snake" | "pi";
const CONFIG = join(process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent"), "opencode-box.json");
const loadStyle = (): Style => {
	try {
		return JSON.parse(readFileSync(CONFIG, "utf8")).working === "pi" ? "pi" : "snake";
	} catch {
		return "snake";
	}
};

function snake(frame: number): string {
	const [head, dir] = SNAKE_FRAMES[frame % SNAKE_FRAMES.length];
	let s = "";
	for (let i = 0; i < SLOTS; i++) {
		const k = (head - i) * dir; // distance behind the head
		s += k >= 0 && k < FADE.length ? fg(mix(BLUE, PANEL, FADE[k])) + "\u25a0" : fg(SLOT) + "\u2b1d";
	}
	return s;
}

export default function (pi: ExtensionAPI) {
	let style: Style = loadStyle();
	let working = false;
	let frame = 0;
	let timer: ReturnType<typeof setInterval> | undefined;
	let activeTui: TUI | undefined;

	const stop = () => {
		clearInterval(timer);
		timer = undefined;
	};

	pi.on("agent_start", async () => {
		working = true;
		frame = 0;
		stop();
		timer = setInterval(() => {
			frame++;
			activeTui?.requestRender();
		}, FRAME_MS);
		timer.unref?.();
		activeTui?.requestRender();
	});

	pi.on("agent_settled", async () => {
		working = false;
		stop();
		activeTui?.requestRender();
	});

	pi.on("session_shutdown", async () => {
		stop();
		activeTui = undefined;
	});

	const statusRow = (): string => {
		if (!working) return "";
		const armed = Date.now() < ((globalThis as any)[ESC_KEY] ?? 0);
		const hint = fg(TEXT) + "esc" + (armed ? fg(ORANGE) + " again to interrupt" : fg(MUTED) + " interrupt");
		const indicator =
			style === "snake"
				? snake(frame)
				: fg(PEACH) + SPINNER[frame % SPINNER.length] + " " + fg(MUTED) + "Working...";
		return indicator + "  " + hint;
	};

	class OpencodeBoxEditor extends CustomEditor {
		constructor(tui: TUI, theme: EditorTheme, keybindings: KeybindingsManager) {
			super(tui, theme, keybindings, { paddingX: 0 });
			activeTui = tui;
		}

		/** One full-width box row: bar, padding, content on the panel background. */
		private row(content: string, width: number): string {
			const inner = Math.max(1, width - LEFT - RIGHT);
			// Re-apply the panel background after any reset inside the content.
			let body = content.replace(/\x1b\[0?m|\x1b\[49m/g, (m) => m + BOX);
			// Green block cursor: reverse video turns this fg into the block color.
			body = body
				.replaceAll(FAKE_CURSOR_START, FAKE_CURSOR_START + bg(PANEL) + fg(CURSOR))
				.replaceAll(FAKE_CURSOR_END, BOX + FAKE_CURSOR_END);
			const w = visibleWidth(body);
			if (w > inner) body = truncateToWidth(body, inner, "");
			const pad = " ".repeat(Math.max(0, inner - visibleWidth(body)));
			return bg(PANEL) + fg(BLUE) + BAR + BOX + " " + body + BOX + pad + " " + RESET;
		}

		render(width: number): string[] {
			if (width < LEFT + RIGHT + 2) return super.render(width);
			const inner = width - LEFT - RIGHT;
			const lines = super.render(inner);
			// super.render: [top rule, ...visible text lines, bottom rule, ...autocomplete]
			const n = (this as any).renderedVisibleLineCount ?? Math.max(1, lines.length - 2);
			const text = lines.slice(1, 1 + n);
			const autocomplete = lines.slice(2 + n);
			// Row order keeps pi's mouse mapping: text at rows 1..n, autocomplete from row n+2.
			return [
				this.row("", width),
				...text.map((l) => this.row(l, width)),
				this.row("", width),
				...autocomplete.map((l) => this.row(l, width)),
				this.row(statusRow(), width),
			];
		}

		handleMouse(event: any) {
			// Text and autocomplete are shifted right by the bar and its padding.
			return super.handleMouse?.({ ...event, x: event.x - LEFT, width: Math.max(1, event.width - LEFT - RIGHT) });
		}
	}

	pi.on("session_start", async (_e, ctx) => {
		if (!ctx.hasUI) return;
		ctx.ui.setWorkingVisible(false); // the box's status row replaces pi's working row
		ctx.ui.setEditorComponent((tui, theme, keybindings) => new OpencodeBoxEditor(tui, theme, keybindings));
	});

	pi.registerCommand("working-style", {
		description: "Working indicator in the input box: snake (default) or pi",
		handler: async (args, ctx) => {
			const want = args.trim();
			style = want === "pi" || want === "snake" ? want : style === "snake" ? "pi" : "snake";
			try {
				writeFileSync(CONFIG, `${JSON.stringify({ working: style }, null, 2)}\n`);
			} catch {}
			ctx.ui.notify(`Working indicator: ${style}`, "info");
		},
	});
}
