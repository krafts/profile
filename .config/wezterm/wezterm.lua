local wezterm = require 'wezterm'

-- The filled in variant of the < symbol
local SOLID_LEFT_ARROW = utf8.char(0xe0b2)

-- The filled in variant of the > symbol
local SOLID_RIGHT_ARROW = utf8.char(0xe0b0)

return {
  font = wezterm.font ('FiraCode Nerd Font Mono', {weight='Bold', stretch='Normal', style=Normal}),
  font_size = 15.0,
  --color_scheme = "Muse (terminal.sexy)",
  window_background_opacity = 0.85,
  unix_domains = {
    {
      name = 'unix',
    },
  },

  -- This causes `wezterm` to act as though it was started as
  -- `wezterm connect unix` by default, connecting to the unix
  -- domain on startup.
  -- If you prefer to connect manually, leave out this line.
  default_gui_startup_args = { 'connect', 'unix' },
  scrollback_lines = 100000,

  colors = {
    -- The default text color
    foreground = 'silver',
    -- The default background color
    background = 'black',

    -- Overrides the cell background color when the current cell is occupied by the
    -- cursor and the cursor style is set to Block
    cursor_bg = '#52ad70',
    -- Overrides the text color when the current cell is occupied by the cursor
    cursor_fg = 'black',
    -- Specifies the border color of the cursor when the cursor style is set to Block,
    -- or the color of the vertical or horizontal bar when the cursor style is set to
    -- Bar or Underline.
    cursor_border = '#52ad70',

    -- the foreground color of selected text
    selection_fg = 'black',
    -- the background color of selected text
    selection_bg = '#fffacd',

    -- The color of the scrollbar "thumb"; the portion that represents the current viewport
    scrollbar_thumb = '#222222',

    -- The color of the split lines between panes
    split = '#cccccc',

    ansi = {
      '#000000',
      '#ef565d',
      '#4fd149',
      '#ffd478',
      '#77aad5',
      '#d6acd5',
      '#75d4d5',
      '#fefefe',
    },
    brights = {
      '#000000',
      '#f68d8c',
      '#a7d3a9',
      '#ffd478',
      '#77aad5',
      '#d6acd5',
      '#75d4d5',
      '#fefefe',
    },
    dims = {
      '#333333',
      '#f2777a',
      '#99cc99',
      '#ffcc66',
      '#6699cc',
      '#cc99cc',
      '#66cccc',
      '#dddddd',
    },
    -- Arbitrary colors of the palette in the range from 16 to 255
    indexed = { [136] = '#af8700' },

    -- Since: 20220319-142410-0fcdea07
    -- When the IME, a dead key or a leader key are being processed and are effectively
    -- holding input pending the result of input composition, change the cursor
    -- to this color to give a visual cue about the compose state.
    compose_cursor = 'orange',

    -- Colors for copy_mode and quick_select
    -- available since: 20220807-113146-c2fee766
    -- In copy_mode, the color of the active text is:
    -- 1. copy_mode_active_highlight_* if additional text was selected using the mouse
    -- 2. selection_* otherwise
    copy_mode_active_highlight_bg = { Color = '#000000' },
    -- use `AnsiColor` to specify one of the ansi color palette values
    -- (index 0-15) using one of the names "Black", "Maroon", "Green",
    --  "Olive", "Navy", "Purple", "Teal", "Silver", "Grey", "Red", "Lime",
    -- "Yellow", "Blue", "Fuchsia", "Aqua" or "White".
    copy_mode_active_highlight_fg = { AnsiColor = 'Black' },
    copy_mode_inactive_highlight_bg = { Color = '#52ad70' },
    copy_mode_inactive_highlight_fg = { AnsiColor = 'White' },

    quick_select_label_bg = { Color = 'peru' },
    quick_select_label_fg = { Color = '#ffffff' },
    quick_select_match_bg = { AnsiColor = 'Navy' },
    quick_select_match_fg = { Color = '#ffffff' },
  },

  tab_bar_at_bottom = true,
  -- tab_bar_style = {
  --   active_tab_left = wezterm.format {
  --     { Background = { Color = '#0b0022' } },
  --     { Foreground = { Color = '#2b2042' } },
  --     { Text = SOLID_LEFT_ARROW },
  --   },
  --   active_tab_right = wezterm.format {
  --     { Background = { Color = '#0b0022' } },
  --     { Foreground = { Color = '#2b2042' } },
  --     { Text = SOLID_RIGHT_ARROW },
  --   },
  --   inactive_tab_left = wezterm.format {
  --     { Background = { Color = '#0b0022' } },
  --     { Foreground = { Color = '#1b1032' } },
  --     { Text = SOLID_LEFT_ARROW },
  --   },
  --   inactive_tab_right = wezterm.format {
  --     { Background = { Color = '#0b0022' } },
  --     { Foreground = { Color = '#1b1032' } },
  --     { Text = SOLID_RIGHT_ARROW },
  --   },
  -- },
}
