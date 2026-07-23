// Markdown 渲染工具
// marked (v18) + highlight.js + DOMPurify

import { marked, Renderer, type Tokens } from 'marked';
import hljs from 'highlight.js/lib/core';
import DOMPurify from 'dompurify';

// 按需注册常用语言
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import markdown from 'highlight.js/lib/languages/markdown';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import cpp from 'highlight.js/lib/languages/cpp';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import plaintext from 'highlight.js/lib/languages/plaintext';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('java', java);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', cpp);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('text', plaintext);

import 'highlight.js/styles/atom-one-dark.min.css';

// ============ 自定义 marked 渲染器 ============

const renderer = new Renderer();

renderer.link = function ({ href, title, tokens }: Tokens.Link) {
  const text = this.parser.parseInline(tokens);
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
  return `<a href="${escapeHtml(href || '')}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
};

renderer.code = function ({ text, lang }: Tokens.Code) {
  const language = lang && hljs.getLanguage(lang) ? lang : null;
  let highlighted: string;
  try {
    highlighted = language
      ? hljs.highlight(text, { language }).value
      : hljs.highlightAuto(text).value;
  } catch {
    highlighted = escapeHtml(text);
  }
  const langLabel = language || 'code';
  return `<div class="code-block-wrapper">
    <div class="code-block-header">
      <span class="code-lang">${escapeHtml(langLabel)}</span>
      <button class="code-copy-btn" data-action="copy-code">复制</button>
    </div>
    <pre><code class="hljs${language ? ' language-' + escapeHtml(language) : ''}">${highlighted}</code></pre>
  </div>`;
};

renderer.codespan = function ({ text }: Tokens.Codespan) {
  return `<code class="inline-code">${escapeHtml(text)}</code>`;
};

renderer.image = function ({ href, title, text }: Tokens.Image) {
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
  return `<img src="${escapeHtml(href || '')}" alt="${escapeHtml(text || '')}"${titleAttr} loading="lazy" />`;
};

renderer.blockquote = function ({ tokens }: Tokens.Blockquote) {
  const body = this.parser.parse(tokens);
  return `<blockquote class="md-blockquote">${body}</blockquote>`;
};

renderer.table = function (token: Tokens.Table) {
  let header = '<tr>';
  for (const cell of token.header) {
    const cellContent = this.parser.parseInline(cell.tokens);
    const align = cell.align ? ` style="text-align:${cell.align}"` : '';
    header += `<th${align}>${cellContent}</th>`;
  }
  header += '</tr>';

  let body = '';
  for (const row of token.rows) {
    body += '<tr>';
    for (const cell of row) {
      const cellContent = this.parser.parseInline(cell.tokens);
      const align = cell.align ? ` style="text-align:${cell.align}"` : '';
      body += `<td${align}>${cellContent}</td>`;
    }
    body += '</tr>';
  }
  return `<div class="table-wrapper"><table class="md-table"><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
};

// ============ DOMPurify 配置 ============

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'hr', 'b', 'i', 'em', 'strong', 'u', 's', 'del', 'ins',
    'sub', 'sup', 'mark', 'small', 'abbr', 'cite', 'q',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'a', 'img',
    'pre', 'code', 'kbd', 'samp', 'var',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    'div', 'span', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'main',
    'figure', 'figcaption', 'details', 'summary', 'blockquote',
    'button', 'font', 'center',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'title', 'alt', 'src', 'loading',
    'class', 'id', 'lang', 'dir',
    'colspan', 'rowspan', 'scope', 'headers',
    'open', 'name',
    'data-action', 'data-highlighted',
    'data-option-text', 'data-prompt',
    'data-avatar', 'data-name', 'data-npcid', 'data-title', 'data-text', 'data-action',
    'data-talent', 'data-attr', 'data-dc',
    'color', 'face', 'size',
    'align', 'width', 'height',
    'style',
  ],
  ALLOW_DATA_ATTR: true,
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'object', 'embed', 'applet'],
  FORBID_ATTR: ['onload', 'onmouseover', 'onfocus', 'onblur'],
};

// ============ 流式内容预处理 ============

export function preprocessStreamingContent(text: string): string {
  if (!text) return text;
  // 补全未闭合的代码块
  if ((text.match(/```/g) || []).length % 2 !== 0) text += '\n```';
  // 补全未闭合的行内代码
  if ((text.match(/(?<!`)(`(?!`))/g) || []).length % 2 !== 0) text += '`';
  // 补全未闭合的粗体
  if ((text.match(/\*\*/g) || []).length % 2 !== 0) text += '**';
  // 补全未闭合的斜体
  if ((text.match(/(?<!\*)\*(?!\*)/g) || []).length % 2 !== 0) text += '*';
  return text;
}

// ============ 内联选项处理 ============

function processInlineOptions(html: string): string {
  const parts = html.split(/(<[^>]+>)/);
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) continue;
    if (!parts[i].trim()) continue;
    parts[i] = parts[i]
      .replace(
        /(?<!!)\[(?!\])([^\[\]]{1,100})\](?!\()/g,
        (match, optionText) => {
          const trimmed = optionText.trim();
          if (!trimmed || /^\d+$/.test(trimmed)) return match;
          return `<span class="inline-option" data-option-text="${escapeHtml(trimmed)}">${escapeHtml(trimmed)}</span>`;
        },
      )
      .replace(
        /【([^【】]{1,100})】/g,
        (match, optionText) => {
          const trimmed = optionText.trim();
          if (!trimmed) return match;
          return `<span class="inline-option" data-option-text="${escapeHtml(trimmed)}">${escapeHtml(trimmed)}</span>`;
        },
      );
  }
  return parts.join('');
}

// ============ 主解析函数 ============

export interface ParseContentOptions {
  isStreaming?: boolean;
}

export interface ParsedContentResult {
  type: 'html' | 'iframe';
  content: string;
}

export function parseContent(text: string, options: ParseContentOptions = {}): ParsedContentResult {
  if (!text) return { type: 'html', content: '' };
  const { isStreaming = false } = options;

  // 检测完整 HTML 页面
  const trimmed = text.trim();
  if (
    trimmed.includes('<!DOCTYPE') ||
    trimmed.includes('<!doctype') ||
    trimmed.includes('<html') ||
    (trimmed.includes('<head>') && trimmed.includes('<body'))
  ) {
    return { type: 'iframe', content: DOMPurify.sanitize(text) };
  }

  let processedText = text;
  if (isStreaming) {
    processedText = preprocessStreamingContent(processedText);
  }

  try {
    let html = marked(processedText, { renderer, breaks: false, gfm: true }) as string;
    html = DOMPurify.sanitize(html, PURIFY_CONFIG);
    html = processInlineOptions(html);
    return { type: 'html', content: html };
  } catch (e) {
    console.error('Markdown parsing error:', e);
    return { type: 'html', content: `<p>${escapeHtml(text)}</p>` };
  }
}

export function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function createIframeSrcDoc(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  background: transparent;
  color: #e0d6c8;
  font-family: var(--font-family, serif);
}
</style>
</head>
<body>
${content}
<script>
function adjustHeight() {
  var h = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.scrollHeight);
  window.parent.postMessage({ type: 'iframe-resize', height: h }, window.location.origin);
}
window.addEventListener('load', adjustHeight);
new MutationObserver(adjustHeight).observe(document.body, { childList: true, subtree: true, attributes: true });
setTimeout(adjustHeight, 100);
setTimeout(adjustHeight, 500);
<\/script>
</body>
</html>`;
}
