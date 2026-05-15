#!/usr/bin/env node

if (process.env.PAPER_SEARCH_SKIP_POSTINSTALL === '1') {
  process.exit(0);
}

const lines = [
  '',
  'Paper Search CLI installed.',
  '',
  'Next steps:',
  '  paper-search setup',
  '  paper-search config doctor --pretty',
  '',
  'Recommended optional credentials:',
  '  SEMANTIC_SCHOLAR_API_KEY       enables search_semantic_snippets body-snippet search',
  '  PAPER_SEARCH_UNPAYWALL_EMAIL   enables polite Unpaywall DOI lookup',
  '  CROSSREF_MAILTO                identifies Crossref requests',
  '  PAPER_SEARCH_CORE_API_KEY      improves CORE rate limits',
  '',
  'The setup command writes to ~/.config/paper-search-cli/config.json with 0600 permissions.',
  ''
];

console.log(lines.join('\n'));
