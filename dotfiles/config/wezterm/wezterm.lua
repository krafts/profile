local wezterm = require 'wezterm'

-- The filled in variant of the < symbol
local SOLID_LEFT_ARROW = utf8.char(0xe0b2)

-- The filled in variant of the > symbol
local SOLID_RIGHT_ARROW = utf8.char(0xe0b0)

-- https://stackoverflow.com/a/2705804
-- function tablelength(T)
--   local count = 0
--   for _ in pairs(T) do count = count + 1 end
--   return count
-- end

-- https://github.com/wez/wezterm/issues/1598#issuecomment-1167851819
-- Sets the title of the active tab in the current window.
-- This method is intended to be called from the debug overlay repl
function tt(title)
  -- The debug overlay defines a global `window` variable that is a Gui Window object; let's
  -- access it via the special `_G` lua table that always references the global variables
  local gui_window = _G.window
  -- "Convert" the gui window into a mux window
  local window = wezterm.mux.get_window(gui_window:window_id())
  -- Locate the active tab
  for _, tab_info in ipairs(window:tabs_with_info()) do
    if tab_info.is_active then
      -- Set the title and log something to indicate the changes that we made
      tab_info.tab:set_title(title)
      wezterm.log_info("Changed title for tab " .. tostring(tab_info.tab:tab_id()) .. " to " .. tab_info.tab:get_title())
      break
    end
  end
end

wezterm.on(
  'format-tab-title',
  function(tab, tabs, panes, config, hover, max_width)
    local edge_background = '#0b0022'
    local background = '#1b1032'
    local foreground = '#808080'

    -- preferred blue #211b85
    -- purpleish #23126a
    -- preferred purple #1e0c64
    if tab.is_active then
      background = '#edad13'
      foreground = '#1e0c64'
    elseif not tab.is_active then
      background = '#1e0c64'
      foreground = '#edad13'
    -- elseif hover then
    --   background = '#3b3052'
    --   foreground = '#909090'
    end

    local edge_foreground = background

    -- ensure that the titles fit in the available space,
    -- and that we have room for the edges.
    local tab_title = tab.tab_title
    --local tab_id = tab.tab_id
    local tab_pos = tab.tab_index + 1
    local pane_zoomed = ''
    --local pane_count = tablelength(panes)

    if tab.active_pane.is_zoomed then --and pane_count > 1 then
      pane_zoomed = 'Z'
    end

    return {
      { Background = { Color = edge_background } },
      { Foreground = { Color = edge_foreground } },
      { Text = SOLID_LEFT_ARROW },
      { Background = { Color = background } },
      { Foreground = { Color = foreground } },
      { Text = '   '.. pane_zoomed .. ' '.. tab_pos .. ': ' .. tab_title .. '   '},
      { Background = { Color = edge_background } },
      { Foreground = { Color = edge_foreground } },
      { Text = SOLID_RIGHT_ARROW },
    }
  end
)

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
    selection_fg = '#1e0c64',
    -- the background color of selected text
    selection_bg = '#edad13',

    -- The color of the scrollbar "thumb"; the portion that represents the current viewport
    scrollbar_thumb = '#222222',

    -- The color of the split lines between panes
    split = '#cccccc',

    ansi = {
      '#000000', -- black
      '#ef565d', -- red
      '#4fd149', -- green
      '#ffd478', -- yellow
      '#77aad5', -- blue
      '#d6acd5', -- magenta
      '#75d4d5', -- cyan
      '#fefefe', -- white
    },
    brights = {
      '#000000', -- black
      '#f68d8c', -- red
      '#a7d3a9', -- green
      '#ffd478', -- yellow
      '#77aad5', -- blue
      '#d6acd5', -- magenta
      '#75d4d5', -- cyan
      '#fefefe', -- white
    },
    -- dims = {
    --   '#333333',
    --   '#f2777a',
    --   '#99cc99',
    --   '#ffcc66',
    --   '#6699cc',
    --   '#cc99cc',
    --   '#66cccc',
    --   '#dddddd',
    -- },
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

    tab_bar = {
      -- The color of the strip that goes along the top of the window
      -- (does not apply when fancy tab bar is in use)
      background = '#0b0022',

  --     -- The active tab is the one that has focus in the window
  --     active_tab = {
  --       -- The color of the background area for the tab
  --       bg_color = '#edad13',
  --       -- The color of the text for the tab
  --       fg_color = '#1353ed',

  --       -- Specify whether you want "Half", "Normal" or "Bold" intensity for the
  --       -- label shown for this tab.
  --       -- The default is "Normal"
  --       intensity = 'Bold',

  --       -- Specify whether you want "None", "Single" or "Double" underline for
  --       -- label shown for this tab.
  --       -- The default is "None"
  --       underline = 'None',

  --       -- Specify whether you want the text to be italic (true) or not (false)
  --       -- for this tab.  The default is false.
  --       italic = false,

  --       -- Specify whether you want the text to be rendered with strikethrough (true)
  --       -- or not for this tab.  The default is false.
  --       strikethrough = false,
  --     },

  --     -- Inactive tabs are the tabs that do not have focus
  --     inactive_tab = {
  --       bg_color = '#1353ed',
  --       fg_color = '#edad13',

  --       -- The same options that were listed under the `active_tab` section above
  --       -- can also be used for `inactive_tab`.
  --     },

  --     -- You can configure some alternate styling when the mouse pointer
  --     -- moves over inactive tabs
  --     inactive_tab_hover = {
  --       bg_color = '#3b3052',
  --       fg_color = '#909090',
  --       italic = true,

  --       -- The same options that were listed under the `active_tab` section above
  --       -- can also be used for `inactive_tab_hover`.
  --     },

  --     -- The new tab button that let you create new tabs
  --     new_tab = {
  --       bg_color = '#1b1032',
  --       fg_color = '#808080',

  --       -- The same options that were listed under the `active_tab` section above
  --       -- can also be used for `new_tab`.
  --     },

  --     -- You can configure some alternate styling when the mouse pointer
  --     -- moves over the new tab button
  --     new_tab_hover = {
  --       bg_color = '#3b3052',
  --       fg_color = '#909090',
  --       italic = true,

  --       -- The same options that were listed under the `active_tab` section above
  --       -- can also be used for `new_tab_hover`.
  --     },
    },

    visual_bell = '#ffffff',
  },

  tab_bar_at_bottom = true,
  use_fancy_tab_bar = false,
  tab_max_width = 100,

  window_padding = {
    left = 5,
    right = 5,
    top = 2,
    bottom = 2,
  },

  visual_bell = {
    fade_in_function = 'Constant',
    fade_in_duration_ms = 10,
    fade_out_function = 'EaseOut',
    fade_out_duration_ms = 75,
  },
}
