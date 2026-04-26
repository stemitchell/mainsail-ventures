// Mainsail Tools - shared frontend helpers

// Call the Claude proxy worker.  Returns the markdown output string.
async function callMainsailWorker(endpoint, payload) {
  if (!window.MAINSAIL_CONFIG) {
    throw new Error('Config not loaded.  Make sure config.js is included before this script.');
  }
  const { WORKER_URL, SHARED_SECRET } = window.MAINSAIL_CONFIG;
  if (!WORKER_URL || WORKER_URL.includes('YOUR-SUBDOMAIN')) {
    throw new Error('Worker URL not configured.  Edit shared/config.js with your deployed Worker URL.');
  }
  if (!SHARED_SECRET || SHARED_SECRET.includes('PASTE_YOUR')) {
    throw new Error('Shared secret not configured.  Edit shared/config.js with your generated secret.');
  }

  const response = await fetch(`${WORKER_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Mainsail-Secret': SHARED_SECRET,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Worker returned ${response.status}: ${errBody}`);
  }
  const data = await response.json();
  return data.output;
}

// Lightweight markdown to HTML renderer.
// Handles: headers (# ## ###), bold (**), italic (*), bullet lists (- and *),
// numbered lists (1.), paragraphs, line breaks.  Not full markdown but covers
// our prompt outputs cleanly.
function renderMarkdown(md) {
  if (!md) return '';
  let html = md;

  // Escape HTML characters first
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (preserve before other replacements)
  html = html.replace(/```([\s\S]*?)```/g, (m, code) => `<pre><code>${code}</code></pre>`);

  // Headers (process longest prefixes first)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');

  // Process lists - find runs of consecutive list items and wrap
  // Bullet lists
  html = html.replace(/(^|\n)((?:[-*] .+(?:\n|$))+)/g, (m, lead, block) => {
    const items = block
      .trim()
      .split('\n')
      .map((l) => l.replace(/^[-*] /, ''))
      .map((l) => `<li>${l}</li>`)
      .join('');
    return `${lead}<ul>${items}</ul>`;
  });

  // Numbered lists
  html = html.replace(/(^|\n)((?:\d+\. .+(?:\n|$))+)/g, (m, lead, block) => {
    const items = block
      .trim()
      .split('\n')
      .map((l) => l.replace(/^\d+\. /, ''))
      .map((l) => `<li>${l}</li>`)
      .join('');
    return `${lead}<ol>${items}</ol>`;
  });

  // Paragraphs - wrap remaining text blocks separated by blank lines
  html = html
    .split(/\n\n+/)
    .map((block) => {
      block = block.trim();
      if (!block) return '';
      // If block already starts with a tag, leave it
      if (block.startsWith('<')) return block;
      // Otherwise wrap in a paragraph, converting single newlines to <br>
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  return html;
}

// Common UI handler: toggles loading state, calls worker, renders markdown result
async function handleAIToolSubmit({
  buttonEl,
  loadingEl,
  errorEl,
  resultEl,
  resultBodyEl,
  endpoint,
  payload,
}) {
  errorEl.classList.remove('visible');
  resultEl.classList.remove('visible');
  loadingEl.classList.add('visible');
  buttonEl.disabled = true;

  try {
    const output = await callMainsailWorker(endpoint, payload);
    resultBodyEl.innerHTML = renderMarkdown(output);
    resultEl.classList.add('visible');
    // Smooth scroll to result
    setTimeout(() => {
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  } catch (err) {
    errorEl.textContent = `Could not generate output: ${err.message}`;
    errorEl.classList.add('visible');
    console.error(err);
  } finally {
    loadingEl.classList.remove('visible');
    buttonEl.disabled = false;
  }
}

// Copy text to clipboard helper for "copy result" buttons
function copyResultToClipboard(resultBodyEl, buttonEl) {
  // Convert HTML back to a clean text version
  const text = resultBodyEl.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const orig = buttonEl.textContent;
    buttonEl.textContent = 'Copied';
    setTimeout(() => { buttonEl.textContent = orig; }, 1500);
  });
}

// Print helper
function printResult() {
  window.print();
}
