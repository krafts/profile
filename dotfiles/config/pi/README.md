# pi

Configuration for [pi](https://pi.dev), the coding agent. pi reads its user
configuration from `~/.pi/agent/`. `init.sh` connects that directory to the files here.

```
dotfiles/config/pi/
├── settings.json        ← public: merged into ~/.pi/agent/settings.json by init.sh
├── keybindings.json     ← symlinked to ~/.pi/agent/keybindings.json
├── appearance/          ← pi's look: palettes → themes, input box, messages, diffs
│                           (a pi package; see appearance/README.md)
└── package/             ← other extensions and themes (loaded as a pi package)
    ├── package.json
    ├── extensions/
    └── themes/
```

## settings.json

Holds only settings that are safe to publish, such as the theme, packages and spacing.

`~/.pi/agent/settings.json` is a regular file, not a symlink. `init.sh` (`merge_json`)
deep-merges this file into it:

- Keys from this file win.
- Keys only in the local file are kept. These include `defaultProvider`, `defaultModel`,
  `enabledModels` and `lastChangelogVersion`.
- The local file is backed up to `settings.json.bak` before each merge.

This keeps the model list and other private or machine-specific keys out of the repo.

pi also writes to the local file, for example through `/settings` and `pi install`.
These changes stay local. To share one, add it here. The next `init.sh` run replaces
local values for any key defined in this file. That includes the `packages` list, so
add any package installed with `pi install` here too.

## keybindings.json

Symlinked, so edits here apply directly. Run `/reload` in pi afterwards. Run `/hotkeys`
to list action names. pi only reads keybindings from `~/.pi/agent/`, so they can't go
in the package. See `docs/keybindings.md` in the pi installation for the format.

## appearance/

A second local pi package, listed before `package/` in `settings.json`. It holds the
color themes (generated from `palettes/`) and the extensions that draw the input box, messages
and diffs. See `appearance/README.md`.

## package/

A local pi package, listed in `settings.json` under `packages` with a path relative to
`~/.pi/agent/`:

```
../../workspace/krafts/profile/dotfiles/config/pi/package
```

The repo must therefore be cloned to `~/workspace/krafts/profile`.

`package.json` has no `pi` manifest, so pi loads everything in these folders:

| Folder        | Contents                                      |
|---------------|-----------------------------------------------|
| `extensions/` | `*.ts` / `*.js` extensions                    |
| `themes/`     | `*.json` themes                               |
| `skills/`     | skill directories containing `SKILL.md`       |
| `prompts/`    | `*.md` prompt templates                       |

To add a resource, drop the file into the matching folder and run `/reload`. Create
new resources here, not in `~/.pi/agent/extensions/` or `~/.pi/agent/themes/`: pi still
loads those, but they aren't in the repo. Run `pi list` to check that the package
resolves, and `pi config` to enable or disable individual resources.

## Not in the repo

These stay in `~/.pi/agent/` and are never committed:

| File                                   | Why                                             |
|----------------------------------------|-------------------------------------------------|
| `auth.json`, `mcp-auth.json`           | API keys and OAuth tokens. Sign in again on a new machine. |
| `mcp.json`                             | Internal MCP server URLs.                        |
| `trust.json`                           | Machine-specific project paths.                  |
| `sessions/`, `models-store.json`       | History and cached data.                         |
| `npm/`                                 | Reinstalled from `packages` on startup.          |

## New machine

1. Clone this repo to `~/workspace/krafts/profile` and run `init.sh`. `jq` is required;
   it's in the Brewfile.
2. Start pi and sign in. pi installs the npm packages on first start.
3. Pick models in pi. They are saved to the local `settings.json` only.
