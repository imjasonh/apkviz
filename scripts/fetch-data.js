const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function fetchAPKINDEX() {
    return new Promise((resolve, reject) => {
        https.get('https://packages.wolfi.dev/os/x86_64/APKINDEX.tar.gz', (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });
            res.on('error', reject);
        });
    });
}

function extractAPKINDEXFromTar(tarData) {
    let offset = 0;
    
    while (offset < tarData.length) {
        const header = tarData.slice(offset, offset + 512);
        offset += 512;

        if (header.every(byte => byte === 0)) break;

        const filename = header.slice(0, 100).toString().replace(/\0.*$/, '');
        const sizeString = header.slice(124, 135).toString().replace(/\0.*$/, '');
        const fileSize = parseInt(sizeString, 8) || 0;

        if (filename === 'APKINDEX' || filename.includes('APKINDEX')) {
            return tarData.slice(offset, offset + fileSize).toString('utf-8');
        }

        offset += Math.ceil(fileSize / 512) * 512;
    }

    throw new Error('APKINDEX not found in tar archive');
}

async function main() {
    console.log('Fetching APKINDEX.tar.gz...');
    const compressed = await fetchAPKINDEX();
    
    console.log('Decompressing...');
    const decompressed = zlib.gunzipSync(compressed);
    
    console.log('Extracting APKINDEX from tar...');
    const apkindex = extractAPKINDEXFromTar(decompressed);
    
    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const outputPath = path.join(publicDir, 'APKINDEX');
    fs.writeFileSync(outputPath, apkindex);
    console.log(`Saved to ${outputPath}`);
    console.log(`File size: ${(apkindex.length / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);