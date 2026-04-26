// Mainsail Tools - shared frontend configuration
// AFTER YOU DEPLOY THE WORKER: replace these placeholder values with your real values.

window.MAINSAIL_CONFIG = {
  // The URL Wrangler printed when you ran `wrangler deploy` for claude-proxy.
  // Example: 'https://claude-proxy.mainsail.workers.dev'
  WORKER_URL: 'https://claude-proxy.YOUR-SUBDOMAIN.workers.dev',

  // The hex string you generated with `openssl rand -hex 32` and set as the
  // SHARED_SECRET worker secret.  This must match exactly.
  SHARED_SECRET: 'PASTE_YOUR_HEX_STRING_HERE',

  // Optional: for the permit-watch URL link on the landing page
  PERMIT_WATCH_URL: 'https://permit-watch.YOUR-SUBDOMAIN.workers.dev',
};
