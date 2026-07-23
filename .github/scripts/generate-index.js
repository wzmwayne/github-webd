const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WEBD_DIR = 'webd';
const CHUNK_SIZE = 20 * 1024 * 1024;
const TOLERANCE = 5 * 1024 * 1024;
const CHUNK_PATTERN = /^(.*)\.(\d{4})$/;

const mimeMap = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.bmp': 'image/bmp',
    '.mp4': 'video/mp4', '.avi': 'video/x-msvideo', '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime', '.webm': 'video/webm',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip', '.rar': 'application/vnd.rar',
    '.7z': 'application/x-7z-compressed', '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain', '.html': 'text/html', '.css': 'text/css',
    '.js': 'application/javascript', '.json': 'application/json',
    '.xml': 'application/xml', '.md': 'text/markdown', '.csv': 'text/csv',
    '.exe': 'application/x-msdownload', '.apk': 'application/vnd.android.package-archive',
    '.iso': 'application/x-iso9660-image', '.bin': 'application/octet-stream'
};

function getSize(fp) {
    return fs.statSync(fp).size;
}

function getMtime(fp) {
    return fs.statSync(fp).mtime.toISOString();
}

function getMime(fp) {
    const ext = path.extname(fp).toLowerCase();
    return mimeMap[ext] || 'application/octet-stream';
}

function sha256(fp) {
    return crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex');
}

function walk(dir) {
    const entries = [];
    for (const name of fs.readdirSync(dir)) {
        const fp = path.join(dir, name);
        if (fs.statSync(fp).isDirectory()) {
            entries.push(...walk(fp));
        } else {
            entries.push(fp);
        }
    }
    return entries;
}

function detectChunkGroups(files) {
    const groups = {};
    const standalone = [];

    for (const fp of files) {
        const rel = path.relative(WEBD_DIR, fp);
        const m = rel.match(CHUNK_PATTERN);
        if (m) {
            const base = m[1];
            const seq = parseInt(m[2], 10);
            if (!groups[base]) groups[base] = [];
            groups[base].push({ fp, rel, seq });
        } else {
            standalone.push({ fp, rel });
        }
    }

    const result = [];
    const processedGroups = new Set();

    for (const [baseName, chunks] of Object.entries(groups)) {
        chunks.sort((a, b) => a.seq - b.seq);
        const totalExpected = chunks.length;
        const seqs = chunks.map(c => c.seq);
        const isContinuous = seqs.every((s, i) => s === i + 1);

        if (!isContinuous) {
            for (const c of chunks) {
                result.push({ type: 'error', rel: c.rel, fp: c.fp, msg: '\u5206\u5757\u5E8F\u5217\u4E0D\u8FDE\u7EED' });
            }
            continue;
        }

        let validSizes = true;
        for (let i = 0; i < chunks.length; i++) {
            const sz = getSize(chunks[i].fp);
            const expectedMin = CHUNK_SIZE - TOLERANCE;
            const expectedMax = CHUNK_SIZE + TOLERANCE;
            if (i < chunks.length - 1) {
                if (sz < expectedMin || sz > expectedMax) { validSizes = false; break; }
            } else {
                if (sz > CHUNK_SIZE + TOLERANCE) { validSizes = false; break; }
            }
        }

        if (!validSizes) {
            for (const c of chunks) {
                result.push({ type: 'error', rel: c.rel, fp: c.fp, msg: '\u5206\u5757\u5927\u5C0F\u4E0D\u5408\u89C4' });
            }
            continue;
        }

        const totalSize = chunks.reduce((sum, c) => sum + getSize(c.fp), 0);
        const relMerged = baseName;
        const mtime = getMtime(chunks[0].fp);

        let conflict = false;
        for (const s of standalone) {
            if (s.rel === relMerged) {
                conflict = true;
                break;
            }
        }

        let virtualName, virtualRel, chunkList;
        if (conflict) {
            const ext = path.extname(baseName);
            const nameNoExt = path.basename(baseName, ext);
            const parentDir = path.dirname(baseName);
            const bugName = parentDir === '.' ? nameNoExt + '.bug' + ext : parentDir + '/' + nameNoExt + '.bug' + ext;
            virtualName = bugName;
            virtualRel = bugName;
            chunkList = chunks.map(c => ({ ...c, parentBase: bugName }));
            const mergedEntry = {
                path: virtualRel,
                size: totalSize,
                sha256: null,
                mtime: mtime,
                mime: getMime(baseName),
                type: 'merged',
                chunks: chunks.map(c => c.rel),
                chunkSize: CHUNK_SIZE,
                flag: 'suspicious',
                msg: '\u57FA\u6587\u4EF6\u4E0E\u5206\u5757\u5171\u5B58'
            };
            result.push(mergedEntry);

            for (const c of chunks) {
                result.push({
                    path: c.rel,
                    size: getSize(c.fp),
                    sha256: sha256(c.fp),
                    mtime: getMtime(c.fp),
                    type: 'chunk',
                    parent: bugName
                });
            }
            processedGroups.add(baseName);
        } else {
            const allData = Buffer.concat(chunks.map(c => fs.readFileSync(c.fp)));
            const mergedSha = crypto.createHash('sha256').update(allData).digest('hex');

            const mergedEntry = {
                path: relMerged,
                size: totalSize,
                sha256: mergedSha,
                mtime: mtime,
                mime: getMime(baseName),
                type: 'merged',
                chunks: chunks.map(c => c.rel),
                chunkSize: CHUNK_SIZE
            };
            result.push(mergedEntry);

            for (const c of chunks) {
                result.push({
                    path: c.rel,
                    size: getSize(c.fp),
                    sha256: sha256(c.fp),
                    mtime: getMtime(c.fp),
                    type: 'chunk',
                    parent: relMerged
                });
            }
            processedGroups.add(baseName);
        }
    }

    for (const s of standalone) {
        if (processedGroups.has(s.rel)) continue;
        result.push({
            path: s.rel,
            size: getSize(s.fp),
            sha256: sha256(s.fp),
            mtime: getMtime(s.fp),
            mime: getMime(s.rel),
            type: 'file'
        });
    }

    return result;
}

function main() {
    if (!fs.existsSync(WEBD_DIR)) {
        fs.writeFileSync('index.json', '[]');
        console.log('webd/ \u76EE\u5F55\u4E0D\u5B58\u5728\uFF0C\u5DF2\u751F\u6210\u7A7A\u7D22\u5F15');
        return;
    }

    const allFiles = walk(WEBD_DIR);
    const index = detectChunkGroups(allFiles);

    index.sort((a, b) => a.path.localeCompare(b.path));

    fs.writeFileSync('index.json', JSON.stringify(index, null, 2));
    console.log('index.json \u751F\u6210\u5B8C\u6210\uFF0C\u5171 ' + index.length + ' \u6761\u8BB0\u5F55');
}

main();
