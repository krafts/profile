/**
 * opencode-style input box.
 *
 * - The editor is drawn as an opencode panel: backgroundElement, a secondary-colored left bar, no top/bottom
 *   rules, and one padding row above and below the text (autocomplete goes between the text and the
 *   bottom padding).
 * - While the agent works, a status line right above the box, outside it and aligned with its
 *   text, shows the working indicator and the Esc hint (the line is not there while idle):
 *     snake (default): 8 slots, a bright head with a fading 3-block tail sweeping back and forth
 *     pi:              pi's braille spinner and "Working..."
 *   followed by "esc interrupt", or "esc again to interrupt" (warning color) after a first Esc
 *   (state published by double-esc-interrupt.ts).
 * - pi's own working row above the editor is hidden. The footer is drawn by footer.ts.
 * - `/working-style [snake|pi]` switches the indicator; the choice is saved to
 *   ~/.pi/agent/appearance.json.
 *
 * Colors are palette roles of the active theme (../lib/palette.ts): backgroundElement (panel),
 * secondary (bar, snake; its tail fades toward background), text, textMuted, borderSubtle (unlit
 * snake slots), warning, primary (spinner) and cursor (block cursor). With a theme that is not made from a palette, pi's own
 * editor and working row are used.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { CustomEditor, type ExtensionAPI, type KeybindingsManager } from "@earendil-works/pi-coding-agent";
import { type EditorTheme, type TUI, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { bg, fg, mix, type Roles, roles, trackUi } from "../lib/palette.ts";

const RESET = "\x1b[0m";
const boxStyle = (r: Roles) => bg(r.backgroundElement) + fg(r.text); // base style inside the box

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
const CONFIG = join(process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent"), "appearance.json");
const loadStyle = (): Style => {
	try {
		return JSON.parse(readFileSync(CONFIG, "utf8")).working === "pi" ? "pi" : "snake";
	} catch {
		return "snake";
	}
};

function snake(frame: number, r: Roles): string {
	const [head, dir] = SNAKE_FRAMES[frame % SNAKE_FRAMES.length];
	let s = "";
	for (let i = 0; i < SLOTS; i++) {
		const k = (head - i) * dir; // distance behind the head
		s +=
			k >= 0 && k < FADE.length
				? fg(mix(r.secondary, r.background, FADE[k])) + "\u25a0"
				: fg(r.borderSubtle) + "\u2b1d";
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

	const statusRow = (r: Roles): string => {
		if (!working) return "";
		const armed = Date.now() < ((globalThis as any)[ESC_KEY] ?? 0);
		const hint = fg(r.text) + "esc" + (armed ? fg(r.warning) + " again to interrupt" : fg(r.textMuted) + " interrupt");
		const indicator =
			style === "snake"
				? snake(frame, r)
				: fg(r.primary) + SPINNER[frame % SPINNER.length] + " " + fg(r.textMuted) + "Working...";
		return indicator + "  " + hint;
	};

	// pi's working row is hidden while the box shows its own status row (palette themes only).
	let ui: { setWorkingVisible(visible: boolean): void } | undefined;
	let boxed: boolean | undefined;
	const setBoxed = (on: boolean) => {
		if (on === boxed) return;
		boxed = on;
		ui?.setWorkingVisible(!on);
	};

	class OpencodeBoxEditor extends CustomEditor {
		private statusRows = 0; // rows above the box (the status line), for mouse mapping

		constructor(tui: TUI, theme: EditorTheme, keybindings: KeybindingsManager) {
			super(tui, theme, keybindings, { paddingX: 0 });
			activeTui = tui;
		}

		/** One full-width box row: bar, padding, content on the panel background. */
		private row(r: Roles, content: string, width: number): string {
			const BOX = boxStyle(r);
			const inner = Math.max(1, width - LEFT - RIGHT);
			// Re-apply the panel background after any reset inside the content.
			let body = content.replace(/\x1b\[0?m|\x1b\[49m/g, (m) => m + BOX);
			// Green block cursor: reverse video turns this fg into the block color.
			body = body
				.replaceAll(FAKE_CURSOR_START, FAKE_CURSOR_START + bg(r.backgroundElement) + fg(r.cursor))
				.replaceAll(FAKE_CURSOR_END, BOX + FAKE_CURSOR_END);
			const w = visibleWidth(body);
			if (w > inner) body = truncateToWidth(body, inner, "");
			const pad = " ".repeat(Math.max(0, inner - visibleWidth(body)));
			return bg(r.backgroundElement) + fg(r.secondary) + BAR + BOX + " " + body + BOX + pad + " " + RESET;
		}

		render(width: number): string[] {
			const r = roles();
			setBoxed(!!r);
			if (!r) return super.render(width); // pi's own editor look
			if (width < LEFT + RIGHT + 2) return super.render(width);
			const inner = width - LEFT - RIGHT;
			const lines = super.render(inner);
			// super.render: [top rule, ...visible text lines, bottom rule, ...autocomplete]
			const n = (this as any).renderedVisibleLineCount ?? Math.max(1, lines.length - 2);
			const text = lines.slice(1, 1 + n);
			const autocomplete = lines.slice(2 + n);
			// Box rows keep pi's mouse mapping: text at rows 1..n, autocomplete from row n+2. Rows 0
			// and n+1 (pi's top and bottom rules) are the padding; a list gets padding below it too.
			const box = [
				this.row(r, "", width),
				...text.map((l) => this.row(r, l, width)),
				this.row(r, "", width),
				...autocomplete.map((l) => this.row(r, l, width)),
				...(autocomplete.length ? [this.row(r, "", width)] : []),
			];
			// The status line sits outside the box, on the terminal background, aligned with the text.
			const status = working ? [truncateToWidth(" ".repeat(LEFT) + statusRow(r), width, "") + RESET] : [];
			this.statusRows = status.length;
			return [...status, ...box];
		}

		handleMouse(event: any) {
			if (!boxed) return super.handleMouse?.(event);
			// The status line is above the box; text and autocomplete are shifted right by the bar.
			const y = event.y - this.statusRows;
			if (y < 0) return undefined;
			return super.handleMouse?.({
				...event,
				y,
				x: event.x - LEFT,
				width: Math.max(1, event.width - LEFT - RIGHT),
			});
		}
	}

	pi.on("session_start", async (_e, ctx) => {
		trackUi(ctx.ui);
		if (!ctx.hasUI) return;
		ui = ctx.ui;
		boxed = undefined;
		setBoxed(!!roles());
		ctx.ui.setEditorComponent((tui, theme, keybindings) => new OpencodeBoxEditor(tui, theme, keybindings));
	});

	pi.registerCommand("working-style", {
		description: "Working indicator above the input box: snake (default) or pi",
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
