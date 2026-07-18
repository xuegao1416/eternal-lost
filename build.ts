// 生产构建脚本
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const DIST = './dist';

console.log('🔨 开始生产构建...');

if (!existsSync(DIST)) {
  mkdirSync(DIST, { recursive: true });
}

// 1. 打包 JS
console.log('📦 打包 JavaScript...');
const jsResult = await Bun.build({
  entrypoints: ['./src/main.tsx'],
  target: 'browser',
  format: 'esm',
  splitting: false,
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
});

if (!jsResult.success) {
  console.error('❌ JS 打包失败:');
  for (const log of jsResult.logs) console.error(log);
  process.exit(1);
}

let jsContent = '';
const jsExtractedCssChunks: string[] = [];
for (const output of jsResult.outputs) {
  const text = await output.text();
  if (output.kind === 'asset' && output.path.endsWith('.css')) {
    jsExtractedCssChunks.push(text);
  } else if (output.kind === 'entry-point') {
    jsContent = text;
  } else {
    const baseName = output.path.split(/[\\/]/).pop() || 'chunk.js';
    writeFileSync(join(DIST, baseName), text);
  }
}
writeFileSync(join(DIST, 'main.js'), jsContent);
console.log(`   ✅ main.js (${(jsContent.length / 1024 / 1024).toFixed(2)} MB)`);

// 2. 打包 CSS
console.log('🎨 打包 CSS...');
const cssResult = await Bun.build({
  entrypoints: ['./src/index.css'],
  target: 'browser',
  minify: true,
});

if (!cssResult.success) {
  console.error('❌ CSS 打包失败:');
  for (const log of cssResult.logs) console.error(log);
  process.exit(1);
}

const globalCss = await cssResult.outputs[0].text();
const componentCss = jsExtractedCssChunks.join('\n');
const cssContent = globalCss + (componentCss ? '\n' + componentCss : '');
writeFileSync(join(DIST, 'main.css'), cssContent);
console.log(`   ✅ main.css (${(cssContent.length / 1024).toFixed(1)} KB)`);

// 3. 生成 index.html
console.log('📝 生成 index.html...');
const htmlTemplate = readFileSync('./index.html', 'utf-8');
const prodHtml = htmlTemplate
  .replace('/src/index.css', '/main.css')
  .replace('/src/main.tsx', '/main.js');
writeFileSync(join(DIST, 'index.html'), prodHtml);
console.log('   ✅ index.html');

// 4. 复制静态资源
console.log('📱 复制静态资源...');
if (existsSync('./manifest.json')) {
  copyFileSync('./manifest.json', join(DIST, 'manifest.json'));
  console.log('   ✅ manifest.json');
}
if (existsSync('./sw.js')) {
  copyFileSync('./sw.js', join(DIST, 'sw.js'));
  console.log('   ✅ sw.js');
}
if (existsSync('./icon.png')) {
  copyFileSync('./icon.png', join(DIST, 'icon.png'));
  console.log('   ✅ icon.png');
}
if (existsSync('./room-bg.png')) {
  copyFileSync('./room-bg.png', join(DIST, 'room-bg.png'));
  console.log('   ✅ room-bg.png');
}

console.log('\n✨ 构建完成！');
