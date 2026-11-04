# Project notes

## Verifying in a headless browser

Chromium is **not** installed here (only `/etc/apparmor.d/chromium` exists). Use the
installed **Firefox 158 (snap)** via **geckodriver** — do not launch `firefox --profile`
directly, the snap wrapper forwards to the user's running Firefox and fails with
"Firefox is already running".

Working recipe:

1. Start geckodriver: `geckodriver --port 4444 --log debug` (background).
2. Create a WebDriver session over HTTP (`POST /session`) with:
   ```json
   { "capabilities": { "alwaysMatch": { "browserName": "firefox",
     "moz:firefoxOptions": { "args": ["-headless"],
       "prefs": { "devtools.console.stdout.content": true,
                  "browser.dom.window.dump.enabled": true } } } } }
   ```
   The `devtools.console.stdout.content` pref routes the page's `console.log`/`warn`/`error`
   to geckodriver's stdout — this is how to read console output.
3. `POST /session/{id}/url` with the target URL.
4. `GET /session/{id}/screenshot` (base64 PNG), or
   `POST /session/{id}/execute/sync` to evaluate JS in the page.
5. `DELETE /session/{id}` to quit.

Gotchas:
- Snap Firefox cannot read `/tmp`; put profiles/screenshots under `$HOME` (e.g. `~/.cache`).
- `--headless --no-remote --new-instance` on the CLI still hits the snap singleton — use geckodriver.
- To trace which files the browser requested, run a logging static server (the one used lives in
  `/tmp/opencode/logserver.py`) and point the browser at it.

Current dev server: `http://localhost:8080/` serves this directory.
