const fs = require('fs');

const transcriptPath = 'C:/Users/Tej Kothadiya/.gemini/antigravity/brain/ef414014-ebae-4149-a3e2-54e4946f2276/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
const parsed = [];
lines.forEach(l => {
    try { if (l) parsed.push(JSON.parse(l)); } catch (e) {}
});

const edits = [];
parsed.forEach(l => {
    // Only process lines from yesterday 13:xx to 14:10
    if (l.created_at && (l.created_at.startsWith('2026-08-16T13:') || l.created_at.startsWith('2026-08-16T14:0'))) {
        if (l.tool_calls) {
            l.tool_calls.forEach(t => {
                if ((t.name === 'replace_file_content' || t.name === 'multi_replace_file_content' || t.name === 'write_to_file') &&
                    t.args.TargetFile && (t.args.TargetFile.includes('AuthPage.jsx') || t.args.TargetFile.includes('AuthPage.css'))) {
                    edits.push(t);
                }
            });
        }
    }
});

let authPageJsx = fs.readFileSync('E:/Saman Motors/garage-new/frontend/src/pages/AuthPage.jsx', 'utf8');
let authPageCss = fs.readFileSync('E:/Saman Motors/garage-new/frontend/src/AuthPage.css', 'utf8');

function applyEdit(content, targetContent, replacementContent) {
    if (typeof targetContent !== 'string') {
        console.error("TargetContent is not a string!", typeof targetContent);
        return content;
    }
    
    // Remove exact string matches. Note: transcript JSON dumps sometimes escape newlines, 
    // but JSON.parse of the transcript object already unescapes them.
    if (!content.includes(targetContent)) {
        console.error("COULD NOT FIND TARGET CONTENT:\n" + targetContent.substring(0, 80));
        return content;
    }
    return content.replace(targetContent, replacementContent);
}

for (const edit of edits) {
    let fileType = edit.args.TargetFile.includes('AuthPage.jsx') ? 'jsx' : 'css';
    let currentContent = fileType === 'jsx' ? authPageJsx : authPageCss;

    console.log(`Applying edit to ${fileType} with description: ${edit.args.Description || edit.name}`);

    if (edit.name === 'write_to_file') {
        currentContent = edit.args.CodeContent;
    } else if (edit.name === 'replace_file_content') {
        currentContent = applyEdit(currentContent, edit.args.TargetContent, edit.args.ReplacementContent);
    } else if (edit.name === 'multi_replace_file_content') {
        let chunks = edit.args.ReplacementChunks;
        if (typeof chunks === 'string') chunks = JSON.parse(chunks);
        for (const chunk of chunks) {
            currentContent = applyEdit(currentContent, chunk.TargetContent, chunk.ReplacementContent);
        }
    }

    if (fileType === 'jsx') authPageJsx = currentContent;
    if (fileType === 'css') authPageCss = currentContent;
}

fs.writeFileSync('E:/Saman Motors/garage-new/frontend/src/pages/AuthPage.jsx.restored', authPageJsx);
fs.writeFileSync('E:/Saman Motors/garage-new/frontend/src/AuthPage.css.restored', authPageCss);
console.log('Restored files saved as .restored');
