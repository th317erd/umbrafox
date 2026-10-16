# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# This string is used to display the option to open blocked popup(s) in site permission management panels.
# Variables:
#   $count (String) - Number of blocked pop-ups
site-permissions-open-blocked-popups =
  { $count ->
     [one] Open { $count } blocked pop-up…
    *[other] Open { $count } blocked pop-ups…
  }

# This string is used to display the option to unblock a third-party redirect.
site-permissions-unblock-redirect = Unblock third-party redirect…

umbrafox-clipboard-copy-prompt = This site canceled the browser's standard copy. Copy using the browser instead? This override may change how the site works.
umbrafox-clipboard-paste-prompt = This site canceled the browser's standard paste. Paste using the browser instead? This override may change how the site works.
umbrafox-clipboard-no =
    .label = No
    .accesskey = N
umbrafox-clipboard-yes =
    .label = Yes
    .accesskey = Y
umbrafox-clipboard-always =
    .label = Always
    .accesskey = A

# Variables:
#   $origin (String) - The requesting site's origin, including scheme and port.
umbrafox-clipboard-copy-permission = Override canceled copy ({ $origin })
umbrafox-clipboard-paste-permission = Override canceled paste ({ $origin })
