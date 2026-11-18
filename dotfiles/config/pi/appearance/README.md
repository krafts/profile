# appearance

pi's look, as a pi package: color themes generated from opencode-format palettes, an
opencode-style input box and messages, and diff-so-fancy edit diffs.

```
appearance/
├── palettes/     input: one JSON per palette (opencode v1 theme format)
├── themes/       output: generated pi themes (do not edit; committed so a fresh clone works)
├── lib/          converter (convert.ts), palettes -> themes sync (sync.ts),
│                 active palette lookup for the extensions (palette.ts)
└── extensions/
    ├── themes.ts         regenerates themes/ from palettes/ on startup and /reload
    ├── input-box.ts      opencode-style input box with the working indicator
    ├── messages.ts       markdown colors, the bar on your messages, text-only selection
    └── diff-so-fancy.ts  edit diffs in diff-so-fancy's colors
```

## Change the look

Pick a theme in `/settings`, or set `"theme"` in `settings.json`. Each palette gives a dark
theme named after the file and, if it defines both appearances, a `-light` one:
`palettes/tokyonight.json` gives `tokyonight` and `tokyonight-light`. For automatic light and
dark, use `"theme": "tokyonight-light/tokyonight"`.

## Add or change a palette

1. Put the JSON in `palettes/`, for example a file from opencode's
   [theme assets](https://github.com/anomalyco/opencode/tree/dev/packages/tui/src/theme/assets).
   The file name becomes the theme name (`dark`, `light` and `system` are pi's own).
2. Run `/reload`. pi regenerates `themes/` and says how many themes changed.
3. Run `/reload` again to load them: pi lists theme files before extensions run.

Conversion errors are reported at startup; a failing palette never removes existing themes.

### Palette format

```json
{
  "defs": { "blue": "#5c9cf5" },
  "theme": {
    "secondary": { "dark": "blue", "light": "#3b7dd8" },
    "text": "#eeeeee",
    ...
  }
}
```

A color is `#rgb` / `#rrggbb` / `#rrggbbaa`, the name of a def or another role, an ANSI
palette index, or `"none"` (the terminal's default). Every role in opencode's v1 format is
required (see `REQUIRED_ROLES` in `lib/convert.ts`); `selectedListItemText` and
`backgroundMenu` are optional. opencode's newer v2 format is not supported.

pi-only role: `cursor`, the input box's block cursor (default: `success`).

## How palette roles are used

- **pi theme colors**: `lib/convert.ts` (`PI_COLORS`) maps pi's tokens onto roles. Like
  opencode, every tool panel and your messages use `backgroundPanel`, and tool output is
  `textMuted`.
- **Extensions**: the generated theme keeps every role in `vars`; the extensions read them from
  the active theme, so they follow theme switches. With a theme that does not come from a
  palette, the input box and message colors fall back to pi's own look.
- **Diffs** use diff-so-fancy's colors in every theme, not the palette's `diff*` roles: bold
  terminal red and green, changed parts on `#5f0000` / `#005f00`, unchanged lines in the
  terminal's default color. The theme's `toolDiff*` colors match, for ```diff code blocks.

## Credits

The palettes in `palettes/` are opencode's built-in themes (v2.3.2), MIT licensed; see
`palettes/LICENSE-opencode`. `opencode.json` adds a `cursor` role.
