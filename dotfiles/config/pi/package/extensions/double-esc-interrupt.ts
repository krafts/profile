/**
 * Double-Esc to interrupt.
 *
 * While the agent is busy (streaming, retrying, compacting), the first Esc does not interrupt:
 * it is swallowed and the working line shows "Press Esc again to interrupt". A second Esc within
 * WINDOW_MS goes through to pi's normal interrupt. When idle, Esc is untouched, so dialogs,
 * autocomplete, bash mode and pi's own double-Esc (tree / fork) work as before.
 *
 * Caveat: extension input listeners run before every component, so while the agent is busy a
 * dialog or autocomplete list also needs two Esc presses to close.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { isKeyRelease, matchesKey } from "@earendil-works/pi-tui";

const WINDOW_MS = 2000;
// Shared with opencode-box.ts, which shows "esc again to interrupt" while this is in the future.
const ARMED_KEY = Symbol.for("krafts.escArmedUntil");

export default function (pi: ExtensionAPI) {
	let armedUntil = 0;
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	const disarm = (ctx: ExtensionContext) => {
		armedUntil = 0;
		(globalThis as any)[ARMED_KEY] = 0;
		clearTimeout(resetTimer);
		resetTimer = undefined;
		ctx.ui.setWorkingMessage(); // restore pi's default working text
	};

	pi.on("session_start", async (_e, ctx) => {
		if (!ctx.hasUI) return;
		ctx.ui.onTerminalInput((data) => {
			if (isKeyRelease(data) || !matchesKey(data, "escape")) return undefined;
			if (ctx.isIdle()) return undefined; // idle: normal Esc behavior

			if (Date.now() < armedUntil) {
				disarm(ctx);
				return undefined; // second Esc: let pi interrupt
			}

			armedUntil = Date.now() + WINDOW_MS;
			(globalThis as any)[ARMED_KEY] = armedUntil;
			ctx.ui.setWorkingMessage("Press Esc again to interrupt");
			clearTimeout(resetTimer);
			resetTimer = setTimeout(() => disarm(ctx), WINDOW_MS);
			return { consume: true }; // first Esc: swallowed
		});
	});

	// Run fully finished (after retries / compaction): drop any pending first Esc.
	pi.on("agent_settled", async (_e, ctx) => {
		if (ctx.hasUI && armedUntil) disarm(ctx);
	});
}
