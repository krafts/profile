-- Rex config migrated from tmux, Herdr, Ghostty and Alacritty.
-- tmux-style keys: prefix ctrl+b. Keys are written unshifted (e.g. % is shift+5).

-- Herdr (~/.config/herdr/config.toml), prefix ctrl+b
rex.bind("ctrl+b>,", "client.tab.rename")                                -- :104 rename_tab = "prefix+,"
rex.bind("ctrl+b>shift+\\", "pane.split", { direction = "right" })        -- :122 split_vertical = "prefix+|"
rex.bind("ctrl+b>-", "pane.split", { direction = "down" })               -- split_horizontal = "prefix+-" (tmux)
rex.bind("ctrl+b>z", "pane.zoom")                                       -- tmux resize-pane -Z

-- Tabs (tmux windows)
rex.bind("ctrl+b>c", "client.tab.new")
rex.bind("ctrl+b>n", "client.tab.next")
rex.bind("ctrl+b>p", "client.tab.previous")
for i = 1, 9 do
  rex.bind("ctrl+b>" .. i, "client.tab.goto", { index = i })
end
rex.bind("ctrl+b>shift+7", "client.tab.close")                           -- &
rex.bind("ctrl+b>shift+,", "client.tab.move.backward")                   -- <  (pain-control)
rex.bind("ctrl+b>shift+.", "client.tab.move.forward")                    -- >  (pain-control)
rex.bind("ctrl+shift+left", "client.tab.move.backward")                  -- tmux.conf: C-S-Left swap-window -t -1
rex.bind("ctrl+shift+right", "client.tab.move.forward")                  -- tmux.conf: C-S-Right swap-window -t +1

-- Splits
rex.bind("ctrl+b>shift+5", "pane.split", { direction = "right" })        -- %
rex.bind("ctrl+b>shift+'", "pane.split", { direction = "down" })         -- "

-- Pane focus: arrows and h/j/k/l (pain-control)
rex.bind("ctrl+b>left", "pane.focus.left")
rex.bind("ctrl+b>right", "pane.focus.right")
rex.bind("ctrl+b>up", "pane.focus.up")
rex.bind("ctrl+b>down", "pane.focus.down")
rex.bind("ctrl+b>h", "pane.focus.left")
rex.bind("ctrl+b>j", "pane.focus.down")
rex.bind("ctrl+b>k", "pane.focus.up")
rex.bind("ctrl+b>l", "pane.focus.right")
rex.bind("ctrl+b>o", "pane.focus_next")
rex.bind("ctrl+b>;", "pane.focus_previous")

-- Pane resize: H/J/K/L by 5 (pain-control), ctrl+arrows by 1 (tmux default)
rex.bind("ctrl+b>shift+h", "pane.resize", { direction = "left", amount = 5 })
rex.bind("ctrl+b>shift+j", "pane.resize", { direction = "down", amount = 5 })
rex.bind("ctrl+b>shift+k", "pane.resize", { direction = "up", amount = 5 })
rex.bind("ctrl+b>shift+l", "pane.resize", { direction = "right", amount = 5 })
rex.bind("ctrl+b>ctrl+left", "pane.resize", { direction = "left", amount = 1 })
rex.bind("ctrl+b>ctrl+right", "pane.resize", { direction = "right", amount = 1 })
rex.bind("ctrl+b>ctrl+up", "pane.resize", { direction = "up", amount = 1 })
rex.bind("ctrl+b>ctrl+down", "pane.resize", { direction = "down", amount = 1 })

-- Pane management
rex.bind("ctrl+b>x", "pane.close")
rex.bind("ctrl+b>shift+1", "pane.move_to_new_tab")                       -- !  break-pane
rex.bind("ctrl+b>shift+[", "pane.move.left")                             -- {  swap-pane
rex.bind("ctrl+b>shift+]", "pane.move.right")                            -- }  swap-pane

-- Sessions
rex.bind("ctrl+b>shift+4", "session.rename")                             -- $
rex.bind("ctrl+b>shift+9", "session.previous")                           -- (
rex.bind("ctrl+b>shift+0", "session.next")                               -- )
rex.bind("ctrl+b>shift+n", "session.new")                                -- Herdr new_workspace
rex.bind("ctrl+b>s", "session.switch")
rex.bind("ctrl+b>w", "pane.go_to")                                       -- choose-tree

-- Misc
rex.bind("ctrl+b>shift+;", "client.palette.toggle")                      -- :
rex.bind("ctrl+b>[", "client.scroll.page_up")                            -- copy-mode (scroll only)
rex.bind("ctrl+b>pageup", "client.scroll.page_up")
rex.bind("ctrl+b>shift+r", "client.config.reload")                       -- R

-- ctrl+b now starts a sequence; press it twice to send it to the program.
rex.bind("ctrl+b>ctrl+b", "pane.send_key", { key = "ctrl+b" })
