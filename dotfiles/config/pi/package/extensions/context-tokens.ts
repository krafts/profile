/**
 * Context Tokens footer.
 *
 * Replaces pi's built-in footer with a copy of it (pi 1.5.2 FooterComponent) whose only
 * change is the context segment: "7.1%/1.0M (auto)" becomes "7.1% 71k/1.0M (auto)".
 * Same position, colors (warning >70%, error >90%) and "(auto)" auto-compaction marker.
 *
 * Not reproduced: the "→ routed-model" suffix of virtual models (not exposed to extensions).
 *
 * Also draws the MCP segment from mcp-status.ts (mcp✓ / mcp⚠N / mcp✗N) just before
 * "(provider) model", only when it fits with room to spare; otherwise it is left out.
 */

import { homedir } from "node:os";
import { isAbsolute, relative, resolve, sep } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

function formatTokens(n: number): string {
	if (n < 1000) return n.toString();
	if (n < 1e4) return `${(n / 1000).toFixed(1)}k`;
	if (n < 1e6) return `${Math.round(n / 1000)}k`;
	if (n < 1e7) return `${(n / 1e6).toFixed(1)}M`;
	return `${Math.round(n / 1e6)}M`;
}

function formatCwd(cwd: string, home: string | undefined): string {
	if (!home) return cwd;
	const rel = relative(resolve(home), resolve(cwd));
	const inside = rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
	if (!inside) return cwd;
	return rel === "" ? "~" : `~${sep}${rel}`;
}

// Published by mcp-status.ts.
const MCP_KEY = Symbol.for("krafts.mcpStatus");
const MCP_EVENT = "krafts:mcp-status";

const sanitize = (t: string) => t.replace(/[\r\n\t]/g, " ").replace(/ +/g, " ").trim();

export default function (pi: ExtensionAPI) {
	const install = (ctx: ExtensionContext) => {
		if (!ctx.hasUI) return;
		ctx.ui.setFooter((tui, theme, footerData) => {
			const unsub = footerData.onBranchChange(() => tui.requestRender());
			const unsubMcp = pi.events.on(MCP_EVENT, () => tui.requestRender());
			return {
				dispose() {
					unsub();
					(unsubMcp as any)?.();
				},
				invalidate() {},
				render(width: number): string[] {
					const sm = ctx.sessionManager;
					const model = ctx.model;

					// Usage totals, as the built-in footer computes them.
					const t = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0 };
					const add = (u: any) => {
						if (!u) return;
						t.input += u.input ?? 0;
						t.output += u.output ?? 0;
						t.cacheRead += u.cacheRead ?? 0;
						t.cacheWrite += u.cacheWrite ?? 0;
						t.cost += u.cost?.total ?? 0;
					};
					let cacheHit: number | undefined;
					for (const e of sm.getEntries() as any[]) {
						if (e.type === "usage") add(e.usage);
						else if (e.type === "message" && e.message.role === "assistant") {
							const u = e.message.usage;
							add(u);
							const prompt = u.input + u.cacheRead + u.cacheWrite;
							cacheHit = prompt > 0 ? (u.cacheRead / prompt) * 100 : undefined;
						} else if (e.type === "message" && e.message.role === "toolResult" && e.message.usage) add(e.message.usage);
						else if ((e.type === "branch_summary" || e.type === "compaction") && e.usage) add(e.usage);
					}

					// Line 1: cwd (branch) • session name
					let pwd = formatCwd(sm.getCwd(), process.env.HOME || process.env.USERPROFILE || homedir());
					const branch = footerData.getGitBranch();
					if (branch) pwd = `${pwd} (${branch})`;
					const name = sm.getSessionName();
					if (name) pwd = `${pwd} \u2022 ${name}`;

					// Line 2 left: stats
					const parts: string[] = [];
					if (t.input) parts.push(`\u2191${formatTokens(t.input)}`);
					if (t.output) parts.push(`\u2193${formatTokens(t.output)}`);
					if (t.cacheRead) parts.push(`R${formatTokens(t.cacheRead)}`);
					if (t.cacheWrite) parts.push(`W${formatTokens(t.cacheWrite)}`);
					if ((t.cacheRead > 0 || t.cacheWrite > 0) && cacheHit !== undefined) parts.push(`CH${cacheHit.toFixed(1)}%`);
					const reg = ctx.modelRegistry as any;
					let sub = false;
					try {
						sub = model
							? model.provider === "kimi-coding" ||
								(reg.isUsingSubscription?.(model.provider) ??
									(reg.isUsingOAuth?.(model.provider) && reg.getProvider?.(model.provider)?.auth?.oauth?.isSubscription === true)) === true
							: false;
					} catch {}
					if (t.cost || sub) parts.push(`$${t.cost.toFixed(3)}${sub ? " (sub)" : ""}`);

					// Context segment: the one change from the built-in footer.
					const cu = ctx.getContextUsage();
					const window = cu?.contextWindow ?? model?.contextWindow ?? 0;
					const pctVal = cu?.percent ?? 0;
					const pct = cu?.percent != null ? `${pctVal.toFixed(1)}%` : "?";
					const used = cu?.tokens != null ? formatTokens(cu.tokens) : "?";
					const auto = pi.getSettings()?.compaction?.enabled === false ? "" : " (auto)";
					const ctxText = `${pct} ${used}/${formatTokens(window)}${auto}`;
					parts.push(pctVal > 90 ? theme.fg("error", ctxText) : pctVal > 70 ? theme.fg("warning", ctxText) : ctxText);
					if (process.env.PI_EXPERIMENTAL === "1") parts.push(`${theme.fg("dim", "\u2022")} ${theme.bold(theme.fg("warning", "xp"))}`);

					let left = parts.join(" ");
					let leftW = visibleWidth(left);
					if (leftW > width) {
						left = truncateToWidth(left, width, "...");
						leftW = visibleWidth(left);
					}

					// Line 2 right: (provider) model • thinking
					const modelName = model?.id || "no-model";
					let rightBase = modelName;
					if (model?.reasoning) {
						const lvl = pi.getThinkingLevel() || "off";
						rightBase = lvl === "off" ? `${modelName} \u2022 thinking off` : `${modelName} \u2022 ${lvl}`;
					}
					const minPad = 2;
					let right = rightBase;
					let providerDropped = false;
					if (footerData.getAvailableProviderCount?.() > 1 && model) {
						right = `(${model.provider}) ${rightBase}`;
						if (leftW + minPad + visibleWidth(right) > width) {
							right = rightBase;
							providerDropped = true;
						}
					}
					const rightW = visibleWidth(right);

					// MCP segment: mcp✓ / mcp⚠N / mcp✗N.
					const mcp = (globalThis as any)[MCP_KEY] as { auth: number; failed: number } | undefined;
					let seg = "";
					if (mcp) {
						const bad = (mcp.auth ? theme.fg("warning", `\u26a0${mcp.auth}`) : "") + (mcp.failed ? theme.fg("error", `\u2717${mcp.failed}`) : "");
						seg = theme.fg("dim", "mcp") + (bad || theme.fg("success", "\u2713"));
					}
					const segW = seg ? visibleWidth(seg) : 0;

					let line: string;
					// Lowest priority: only when everything else fits in full, including the provider.
					if (seg && !providerDropped && leftW + minPad + segW + minPad + rightW <= width) {
						const gap = width - leftW - segW - minPad - rightW;
						const lines = [
							truncateToWidth(theme.fg("dim", pwd), width, theme.fg("dim", "...")),
							theme.fg("dim", left) + theme.fg("dim", " ".repeat(gap)) + seg + theme.fg("dim", " ".repeat(minPad) + right),
						];
						return withStatuses(lines, width);
					}
					if (leftW + minPad + rightW <= width) line = left + " ".repeat(width - leftW - rightW) + right;
					else {
						const avail = width - leftW - minPad;
						if (avail > 0) {
							const tr = truncateToWidth(right, avail, "");
							line = left + " ".repeat(Math.max(0, width - leftW - visibleWidth(tr))) + tr;
						} else line = left;
					}

					return withStatuses([
						truncateToWidth(theme.fg("dim", pwd), width, theme.fg("dim", "...")),
						theme.fg("dim", left) + theme.fg("dim", line.slice(left.length)),
					], width);
				},
			};

			// Extension statuses from ctx.ui.setStatus() on a third line, as built in.
			function withStatuses(lines: string[], width: number): string[] {
				const statuses = footerData.getExtensionStatuses();
				if (statuses.size > 0) {
					const s = Array.from(statuses.entries())
						.sort(([a], [b]) => a.localeCompare(b))
						.map(([, text]) => sanitize(text))
						.join(" ");
					lines.push(truncateToWidth(s, width, theme.fg("dim", "...")));
				}
				return lines;
			}
		});
	};

	pi.on("session_start", async (_e, ctx) => install(ctx));
}
