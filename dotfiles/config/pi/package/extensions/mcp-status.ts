/**
 * MCP status for the footer.
 *
 * Runs `pi mcp list --json` in the background at session start and every 10 minutes, and
 * publishes a compact segment that context-tokens.ts draws in the footer gap:
 *   mcp✓    all enabled servers connected
 *   mcp⚠N   N servers need sign-in (fix: /mcp login <name>)
 *   mcp✗N   N servers failed, disconnected, or misconfigured (details: /mcp)
 * Nothing is shown until the first check finishes or when the check itself fails.
 * `/mcp-check` re-checks now, for example after signing in.
 */

import { basename } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

export type McpStatus = { auth: number; failed: number } | undefined;
export const MCP_STATUS_EVENT = "krafts:mcp-status";
const KEY = Symbol.for("krafts.mcpStatus");

/** Latest published status, read by the footer. */
export function getMcpStatus(): McpStatus {
	return (globalThis as any)[KEY];
}

const INTERVAL_MS = 10 * 60 * 1000;

export default function (pi: ExtensionAPI) {
	let timer: ReturnType<typeof setInterval> | undefined;
	let running = false;
	// The running pi binary, so the check uses the same version and config.
	const bin = basename(process.execPath).startsWith("pi") ? process.execPath : "pi";

	const publish = (s: McpStatus) => {
		(globalThis as any)[KEY] = s;
		pi.events.emit(MCP_STATUS_EVENT, s);
	};

	const check = async (ctx: ExtensionContext) => {
		if (running) return;
		running = true;
		try {
			const r = await pi.exec(bin, ["mcp", "list", "--json"], { cwd: ctx.cwd, timeout: 120_000 });
			const d = JSON.parse(r.stdout);
			let auth = 0;
			let failed = (d.errors ?? []).length;
			for (const s of d.servers ?? []) {
				if (s.enabled === false || s.state === "connected") continue;
				if (s.state === "needs-auth") auth++;
				else failed++;
			}
			publish({ auth, failed });
		} catch {
			publish(undefined); // check itself failed or printed no JSON: show nothing
		} finally {
			running = false;
		}
	};

	pi.on("session_start", async (_e, ctx) => {
		if (!ctx.hasUI) return;
		void check(ctx);
		clearInterval(timer);
		timer = setInterval(() => void check(ctx), INTERVAL_MS);
		timer.unref?.();
	});

	pi.on("session_shutdown", async () => {
		clearInterval(timer);
		timer = undefined;
	});

	pi.registerCommand("mcp-check", {
		description: "Re-check MCP server status for the footer",
		handler: async (_args, ctx) => {
			await check(ctx);
			const s = getMcpStatus();
			ctx.ui.notify(
				s ? (s.auth || s.failed ? `MCP: ${s.auth} need sign-in, ${s.failed} failed. See /mcp` : "MCP: all connected") : "MCP check failed",
				s && !s.auth && !s.failed ? "info" : "warning",
			);
		},
	});
}
