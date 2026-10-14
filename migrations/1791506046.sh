echo "Remove the retired Voxtype installation invitation"

# Only discard the exact hook Omarchy copied. Keep user-authored additions.
# Historical source (before the selectable-dictation rewrite in c24889096):
# https://github.com/omacom/omarchy/blob/1554a522ccd641a603d94aae28c495ce30afa428/install/user/first-run/install-voxtype.hook
hook="$HOME/.config/omarchy/hooks/post-update.d/install-voxtype.hook"
if [[ -f $hook && ! -L $hook ]] && cmp -s "$hook" <(cat <<'HOOK'
#!/bin/bash

set -e

if omarchy-done ensure voxtype-install-invitation; then
  omarchy-notification-send -u critical -g  "Install Dictation with Voxtype" \
    "Click to install voice dictation for Omarchy." \
    --exec omarchy-launch-floating-terminal-with-presentation omarchy-voxtype-install
fi
HOOK
); then
  rm "$hook"
fi
