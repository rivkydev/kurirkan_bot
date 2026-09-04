const fs = require('fs');
const readline = require('readline');
const path = require('path');

const LICENSE_FILE = path.join(__dirname, '..', '.license.key');
const SECRET_KEY = 'demo';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyLicense() {
    if (fs.existsSync(LICENSE_FILE)) {
        console.log('\x1b[32m[SYSTEM]\x1b[0m HWID Validated. Welcome back to SmartBot Premium!');
        return true;
    }

    console.log('\n==========================================');
    console.log(' 🛡️ SMARTBOT PREMIUM SECURITY MODULE ');
    console.log('==========================================');
    console.log('\x1b[31m[SYSTEM]\x1b[0m License not found on this machine.');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askKey = () => {
        return new Promise((resolve) => {
            rl.question('\x1b[33m[SYSTEM]\x1b[0m Please enter your Premium License Key: ', (answer) => {
                resolve(answer.trim());
            });
        });
    };

    let key = '';
    while (key !== SECRET_KEY) {
        key = await askKey();
        if (key !== SECRET_KEY) {
            console.log('\x1b[31m[ERROR]\x1b[0m Invalid License Key! Connection refused.\n');
        }
    }

    rl.close();

    console.log('\n\x1b[36m[SERVER]\x1b[0m Authenticating with SmartBot Licensing Server...');
    await sleep(1500);
    console.log('\x1b[32m[SERVER]\x1b[0m Validation Success!');
    await sleep(1000);
    console.log('\x1b[36m[SERVER]\x1b[0m Scanning Hardware for verification...');
    await sleep(2000);

    const fakeHwid = '9A4B-2C1F-88D3-' + Math.random().toString(16).substr(2, 4).toUpperCase();

    console.log(`\x1b[36m[SERVER]\x1b[0m Generating unique HWID: \x1b[33m${fakeHwid}\x1b[0m`);
    await sleep(1500);
    console.log('\x1b[36m[SERVER]\x1b[0m Binding license to this machine...');
    await sleep(2000);
    console.log('\x1b[32m[SUCCESS]\x1b[0m License permanently locked to this HWID!');
    console.log('\x1b[32m[SUCCESS]\x1b[0m Starting SmartBot Premium...\n');

    // Save a scary looking encoded file so they think it's legit
    const encodedData = Buffer.from(JSON.stringify({
        hwid: fakeHwid,
        key: SECRET_KEY,
        activatedAt: new Date().toISOString()
    })).toString('base64');

    fs.writeFileSync(LICENSE_FILE, encodedData);
    return true;
}

module.exports = {
    verify: verifyLicense
};
