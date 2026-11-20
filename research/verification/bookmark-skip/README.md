# Bookmark-style skipping — 2026-10-26

Supersedes the intermediate settling described in ordered-book evidence.
Adjacent turns retain 1.6 seconds. Longer jumps fold the source once (350ms),
rifle each intervening leaf (220ms), and unfold only the final scene (450ms).
The camera stays pulled back throughout the riffling phase. Intermediate
chapter scenes are not opened or fetched; leaf count/direction still follow
the shared physical chapter order. Destination loading finishes before motion
starts. Keyboard and reduced motion remain direct.

Actual Chromium journeys: Start→Contact, five forward leaves; Contact→Services,
four reverse leaves. Neither reports an intermediate settled chapter.
`browser.json` includes timing, state observations, leaf counts and rendering
metrics; elapsed wall time also includes model loading, screenshots and route
arrival. Physical-device performance remains unverified.

Reproduce with `tool/assets/verify_bookmark_skip.js`. Earlier ordered navigation
edge scripts describe the prior step-by-step loading behavior; intermediate
asset failure is no longer relevant because only the destination is loaded.
