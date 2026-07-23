// 将 SVG 文件转为 data URI，生成 CSS 自定义属性
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const SVG_DIR = './public/assets/ui';
const OUTPUT = './src/styles/ui-assets.css';

const files = readdirSync(SVG_DIR).filter(f => f.endsWith('.svg'));
let css = '/* ═══ 自动生成：SVG 素材 data URI ═══ */\n/* 由 scripts/inline-svg-css.ts 生成，勿手动编辑 */\n\n:root {\n';

for (const file of files) {
  const svg = readFileSync(join(SVG_DIR, file), 'utf-8');
  const b64 = Buffer.from(svg).toString('base64');
  const varName = file.replace('.svg', '').replace(/-/g, '-');
  css += `  --ui-${varName}: url('data:image/svg+xml;base64,${b64}');\n`;
}

css += '}\n';
writeFileSync(OUTPUT, css);
console.log(`✅ 生成 ${OUTPUT}（${files.length} 个 SVG → CSS 变量）`);
