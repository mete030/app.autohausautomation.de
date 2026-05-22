// Konvertiert den AVV-Markdown in druckfertiges HTML (A4) für Chrome --print-to-pdf
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const src = process.argv[2];
const out = process.argv[3];
const md = fs.readFileSync(src, 'utf8');
const body = marked.parse(md);

const css = `
  @page { size: A4; margin: 20mm 18mm 22mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1a1a1a; }
  h1 { font-size: 19pt; color: #16304f; border-bottom: 2px solid #16304f; padding-bottom: 6px; margin-top: 28px; }
  h2 { font-size: 13pt; color: #16304f; margin-top: 22px; }
  h3 { font-size: 11.5pt; color: #1f4060; margin-top: 16px; }
  p, li { text-align: justify; }
  hr { border: none; border-top: 1px solid #ccc; margin: 18px 0; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 9pt; }
  th, td { border: 1px solid #bbb; padding: 5px 7px; text-align: left; vertical-align: top; }
  th { background: #eef2f7; }
  blockquote { background: #fff8e1; border-left: 4px solid #e0a800; margin: 12px 0; padding: 8px 14px; font-size: 9.5pt; }
  code { background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-size: 9pt; }
  strong { color: #16304f; }
  h1, h2, h3 { page-break-after: avoid; }
  table, blockquote { page-break-inside: avoid; }
`;

const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>AVV Wackenhut</title><style>${css}</style></head><body>${body}</body></html>`;
fs.writeFileSync(out, html);
console.log('HTML written:', out, '(' + html.length + ' bytes)');
