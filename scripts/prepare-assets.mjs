/**
 * 构建前准备：
 *   1. src/data/version.json        —— 版本号 / 提交 / 构建日期
 *   2. public/downloads/*.md        —— 全书合并 Markdown
 *   3. public/downloads/*.zip       —— 全书 Markdown 打包（zip，存储式，无外部依赖）
 *
 * 由 package.json 的 prebuild / predev 自动调用。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { mergeBook } from './lib/merge-book.mjs';

const ROOT = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

/* ---------- 1. 版本信息 ---------- */
function gitShortSha() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

function gitLastCommitDate() {
  if (process.env.GITHUB_SHA) return new Date().toISOString();
  try {
    return new Date(
      execSync('git log -1 --format=%cI', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    ).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

const versionInfo = {
  version: pkg.version,
  commit: gitShortSha(),
  updatedAt: gitLastCommitDate(),
  builtAt: new Date().toISOString(),
};
const dataDir = path.join(ROOT, 'src', 'data');
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'version.json'), JSON.stringify(versionInfo, null, 2) + '\n', 'utf8');
console.log(`[assets] version.json -> v${versionInfo.version} (${versionInfo.commit})`);

/* ---------- 2. 合并 Markdown ---------- */
const { text, chapters } = mergeBook();
const outDir = path.join(ROOT, 'public', 'downloads');
fs.mkdirSync(outDir, { recursive: true });

const MD_NAME = 'deepseek-harness-in-practice.md';
fs.writeFileSync(path.join(outDir, MD_NAME), text, 'utf8');
console.log(`[assets] ${MD_NAME} (${chapters.length} 章, ${(text.length / 1024).toFixed(1)} KB)`);

/* ---------- 3. 最小 ZIP（存储式，无压缩依赖） ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function dosDateTime(d) {
  const time = ((d.getHours() & 0x1f) << 11) | ((d.getMinutes() & 0x3f) << 5) | ((d.getSeconds() / 2) & 0x1f);
  const date = (((d.getFullYear() - 1980) & 0x7f) << 9) | (((d.getMonth() + 1) & 0x0f) << 5) | (d.getDate() & 0x1f);
  return { time, date };
}

/** entries: [{ name, data: Buffer }] */
export function makeZip(entries) {
  const { time, date } = dosDateTime(new Date());
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, 'utf8');
    const crc = crc32(e.data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 filename
    local.writeUInt16LE(0, 8); // method: store
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(e.data.length, 18);
    local.writeUInt32LE(e.data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(e.data.length, 20);
    central.writeUInt32LE(e.data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offset, 42);

    locals.push(local, nameBuf, e.data);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + e.data.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralBuf, eocd]);
}

const readme = [
  '# 《DeepSeek Harness 应用开发实践》全书 Markdown',
  '',
  `版本：${versionInfo.version}　提交：${versionInfo.commit}`,
  `导出时间：${versionInfo.builtAt}`,
  '',
  '本压缩包包含：',
  '- `deepseek-harness-in-practice.md` —— 全书合并 Markdown（含 YAML frontmatter 已剥离）',
  '- `README.md` —— 本说明',
  '',
  '在线阅读：https://guotao0628.github.io/shutongbuddy/',
  '问题反馈：https://github.com/guotao0628/shutongbuddy/issues',
  '',
  '文档采用 CC BY 4.0 许可，代码采用 MIT 许可。',
  '',
].join('\n');

const zipBuf = makeZip([
  { name: 'deepseek-harness-in-practice.md', data: Buffer.from(text, 'utf8') },
  { name: 'README.md', data: Buffer.from(readme, 'utf8') },
]);
fs.writeFileSync(path.join(outDir, 'shutongbuddy-book.zip'), zipBuf);
console.log(`[assets] shutongbuddy-book.zip (${(zipBuf.length / 1024).toFixed(1)} KB)`);
