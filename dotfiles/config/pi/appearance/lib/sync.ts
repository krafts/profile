/**
 * Keep themes/ in step with palettes/: one generated pi theme file per theme a palette defines.
 * themes/ holds generated files only; files without a palette are removed (unless a palette
 * failed to convert, so a typo never deletes a working theme).
 */

import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { convertPalette, themeName } from "./convert.ts";

export type SyncResult = { written: string[]; removed: string[]; errors: string[] };

const jsonFiles = (dir: string) => {
	try {
		return readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".json")).sort();
	} catch {
		return [];
	}
};

export function syncThemes(root: string): SyncResult {
	const palettes = join(root, "palettes");
	const themes = join(root, "themes");
	const result: SyncResult = { written: [], removed: [], errors: [] };
	const wanted = new Map<string, { content: string; from: string }>();

	for (const file of jsonFiles(palettes)) {
		try {
			const palette = JSON.parse(readFileSync(join(palettes, file), "utf8"));
			for (const theme of convertPalette(palette, themeName(file))) {
				const target = `${theme.name}.json`;
				const clash = wanted.get(target);
				if (clash) throw new Error(`theme "${theme.name}" is also made by ${clash.from}`);
				wanted.set(target, { content: `${JSON.stringify(theme, null, "\t")}\n`, from: file });
			}
		} catch (error) {
			result.errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	for (const [target, { content }] of wanted) {
		let current: string | undefined;
		try {
			current = readFileSync(join(themes, target), "utf8");
		} catch {}
		if (current !== content) {
			writeFileSync(join(themes, target), content);
			result.written.push(target);
		}
	}

	if (result.errors.length === 0) {
		for (const file of jsonFiles(themes)) {
			if (!wanted.has(file)) {
				rmSync(join(themes, file));
				result.removed.push(file);
			}
		}
	}
	return result;
}
