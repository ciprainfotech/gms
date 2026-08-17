const fs = require('fs');
const transcriptPath = 'C:/Users/Tej Kothadiya/.gemini/antigravity/brain/ef414014-ebae-4149-a3e2-54e4946f2276/.system_generated/logs/transcript.jsonl';

const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
let out = '';

lines.forEach(line => {
    if (line.includes('2026-08-16T13:') || line.includes('2026-08-16T14:0')) {
        if (line.includes('replace_file_content') || line.includes('write_to_file')) {
            if (line.includes('AuthPage.css')) {
                // If it's a complete redesign write to file
                if (line.includes('Complete redesign of AuthPage.css')) {
                    try {
                        const obj = JSON.parse(line);
                        const t = obj.tool_calls.find(tc => tc.args && tc.args.Description && tc.args.Description.includes('Complete redesign'));
                        if (t && t.args.CodeContent) {
                            fs.writeFileSync('E:/Saman Motors/garage-new/frontend/src/AuthPage.css', t.args.CodeContent);
                            out += 'RESTORED CSS\n';
                        }
                    } catch (e) {
                        // try regex extraction
                        const match = line.match(/"CodeContent":"(.*?)","Description"/);
                        if (match) {
                            const unescaped = JSON.parse('"' + match[1] + '"');
                            fs.writeFileSync('E:/Saman Motors/garage-new/frontend/src/AuthPage.css', unescaped);
                            out += 'RESTORED CSS VIA REGEX\n';
                        }
                    }
                }
                
                // Other CSS fixes
                if (line.includes('Fix logo size, heading font') || line.includes('Connect the progress line') || line.includes('Reduce logo size') || line.includes('critical bug where line animation runs')) {
                    try {
                        const obj = JSON.parse(line);
                        const t = obj.tool_calls.find(tc => tc.args && tc.args.TargetFile && tc.args.TargetFile.includes('AuthPage.css'));
                        if (t) out += `CSS FIX: ${t.args.Description}\nREPLACE: ${t.args.ReplacementContent.substring(0, 100)}\n\n`;
                    } catch(e) {}
                }
            }
            if (line.includes('AuthPage.jsx')) {
                if (line.includes('Update AuthPage JSX to match new compact') || line.includes('Add full frontend validation') || line.includes('background rail track') || line.includes('Fix login timing')) {
                    try {
                        const obj = JSON.parse(line);
                        const t = obj.tool_calls.find(tc => tc.args && tc.args.TargetFile && tc.args.TargetFile.includes('AuthPage.jsx'));
                        if (t) {
                            out += `JSX FIX: ${t.args.Description}\n`;
                            const chunks = t.args.ReplacementChunks;
                            const parsedChunks = typeof chunks === 'string' ? JSON.parse(chunks) : chunks;
                            if (parsedChunks) {
                                parsedChunks.forEach(c => {
                                    out += `REPLACE: ${c.ReplacementContent}\n\n`;
                                });
                            }
                        }
                    } catch(e) {}
                }
            }
        }
    }
});

fs.writeFileSync('E:/Saman Motors/garage-new/extracted_edits.txt', out);
console.log('Done!');
