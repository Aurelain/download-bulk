import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';

// =====================================================================================================================
//  D E C L A R A T I O N S
// =====================================================================================================================
const INPUT_FILE = 'input.txt';
const OUTPUT_DIR = 'output';
const WAIT = 100; // milliseconds

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 * @returns {Promise<void>}
 */
async function download() {
    !fs.existsSync(OUTPUT_DIR) && fs.mkdirSync(OUTPUT_DIR);

    const content = fs.readFileSync(INPUT_FILE, 'utf-8');
    const urls = content.split(/\r?\n/).filter(line => line.trim().startsWith('http'));
    console.log(`Processing ${urls.length} downloads...\n`);
    const {length} = urls;
    for (let i = 0; i < length; i++) {
        await downloadFile(urls[i], i+1, length);
        await sleep(WAIT);
    }
    console.log('Done.');
}

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
async function downloadFile(url, index, total) {
    process.stdout.write(`${index}/${total}: ${url}... `);
    try {
        await attemptDownload(url);
        process.stdout.write(`ok\n`);
    } catch (error) {
        process.stdout.write(`failed!\n`);
        console.error(`    ${error.message}`);
        throw new Error('Stopped!');
    }
}

/**
 *
 */
async function attemptDownload(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Status ${response.status}`);
    }

    // Extract filename or fallback to a timestamp
    const fileName = path.basename(new URL(url).pathname) || `file_${Date.now()}`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    if (fs.existsSync(filePath)) {
        throw new Error(`Overwrite!`);
    }
    const fileStream = fs.createWriteStream(filePath);
    await finished(Readable.fromWeb(response.body).pipe(fileStream));
}

/**
 *
 */
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

// =====================================================================================================================
//  R U N
// =====================================================================================================================
await download();
