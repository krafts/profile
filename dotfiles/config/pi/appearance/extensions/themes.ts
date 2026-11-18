/**
 * Generates pi themes from palettes/ into themes/ (see lib/convert.ts).
 *
 * Runs when pi starts and on /reload. pi lists theme files before extensions run, so a palette
 * that was added or changed shows up after one more /reload; a notice says so.
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { trackUi } from "../lib/palette.ts";
import { type SyncResult, syncThemes } from "../lib/sync.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export default function (pi: ExtensionAPI) {
	let result: SyncResult;
	try {
		result = syncThemes(ROOT);
	} catch (error) {
		result = { written: [], removed: [], errors: [String(error)] };
	}

	pi.on("session_start", async (_event, ctx) => {
		trackUi(ctx.ui);
		if (!ctx.hasUI) return;
		for (const error of result.errors) ctx.ui.notify(`appearance: palettes/${error}`, "error");
		const changed = result.written.length + result.removed.length;
		if (changed > 0) {
			const parts = [
				result.written.length ? `${result.written.length} updated` : "",
				result.removed.length ? `${result.removed.length} removed` : "",
			].filter(Boolean);
			ctx.ui.notify(`appearance: themes ${parts.join(", ")}; run /reload to load them`, "info");
		}
		result = { written: [], removed: [], errors: [] }; // report once
	});
}
