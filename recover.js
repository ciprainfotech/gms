const fs = require('fs');

const transcriptPath = 'C:/Users/Tej Kothadiya/.gemini/antigravity/brain/ef414014-ebae-4149-a3e2-54e4946f2276/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
const parsed = [];
lines.forEach(l => {
    try { if (l) parsed.push(JSON.parse(l)); } catch (e) {}
});

// We want to reconstruct AuthPage.jsx and AuthPage.css at 2026-08-16T14:10:00Z
// But wait, yesterday the user restored git BEFORE today's edits!
// So we want to replay everything up to 2026-08-16T14:10:00Z.

// Let's get the original contents as base.
// Actually, since I don't know the exact original base, I will just dump the ReplacementContent of the LAST `replace_file_content` chunks and manually fix it, or I can just let the script apply them!
// Better yet, I can just use a bash command to copy the files from the VSCode History!

function findInVSCodeHistory() {
    const historyPath = process.env.APPDATA + '\\Code\\User\\History';
    if (!fs.existsSync(historyPath)) return console.log('No VSCode history found');
    
    // search recursively for AuthPage
    const searchRecursive = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const path = dir + '\\' + file;
            if (fs.statSync(path).isDirectory()) {
                searchRecursive(path);
            } else {
                const content = fs.readFileSync(path, 'utf8');
                if (content.includes('CipraLogo') && content.includes('validateField') && content.includes('auth-page-wrapper-premium')) {
                    console.log('Found AuthPage.jsx in', path);
                    fs.writeFileSync('C:/Users/Tej Kothadiya/.gemini/antigravity/brain/ef414014-ebae-4149-a3e2-54e4946f2276/scratch/RestoredAuthPage.jsx', content);
                }
                if (content.includes('Complete redesign of AuthPage.css') || (content.includes('.console-product-sub') && content.includes('.btn-progress-track'))) {
                    console.log('Found AuthPage.css in', path);
                    fs.writeFileSync('C:/Users/Tej Kothadiya/.gemini/antigravity/brain/ef414014-ebae-4149-a3e2-54e4946f2276/scratch/RestoredAuthPage.css', content);
                }
            }
        }
    };
    searchRecursive(historyPath);
}
findInVSCodeHistory();
