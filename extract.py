import json
import os
import re

transcript_path = 'C:/Users/Tej Kothadiya/.gemini/antigravity/brain/ef414014-ebae-4149-a3e2-54e4946f2276/.system_generated/logs/transcript.jsonl'

parsed = []
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            parsed.append(json.loads(line))
        except:
            pass

edits = []
for l in parsed:
    if 'created_at' in l and ('2026-08-16T13:' in l['created_at'] or '2026-08-16T14:0' in l['created_at']):
        if 'tool_calls' in l:
            for t in l['tool_calls']:
                if t.get('name') in ['replace_file_content', 'multi_replace_file_content', 'write_to_file']:
                    args = t.get('args', {})
                    if isinstance(args, str):
                        try:
                            args = json.loads(args)
                        except:
                            pass
                    target = args.get('TargetFile', '')
                    if 'AuthPage.jsx' in target or 'AuthPage.css' in target:
                        edits.append((t.get('name'), args))

# Now we need the base files. Since the user doesn't want git checkout, we'll start with the current files 
# but ONLY apply the edits from 13:40Z to 14:07Z! 
# Because the current files ALREADY HAVE the edits up to 13:36Z applied by me just now!
# Wait! If I apply the 13:40Z 'write_to_file' for CSS, it will just overwrite the whole CSS file perfectly!
# Let's extract that CSS!

for name, args in edits:
    if name == 'write_to_file' and 'AuthPage.css' in args.get('TargetFile', ''):
        with open('E:/Saman Motors/garage-new/frontend/src/AuthPage.css', 'w', encoding='utf-8') as f:
            f.write(args['CodeContent'])
        print("Restored AuthPage.css from write_to_file!")

# What about AuthPage.jsx? 
# The best way is to print the ReplacementChunks of the 14:07Z validation update and the 13:41Z layout update 
# so I can just manually apply them!

print("JSX Edits:")
for name, args in edits:
    if 'AuthPage.jsx' in args.get('TargetFile', ''):
        desc = args.get('Description', '')
        if 'validation' in desc.lower() or 'layout' in desc.lower() or 'timing' in desc.lower() or 'track' in desc.lower():
            print("\n--- DESC:", desc)
            if name == 'replace_file_content':
                print("TARGET:\n", args.get('TargetContent', '')[:100])
                print("REPLACE:\n", args.get('ReplacementContent', '')[:100])
            elif name == 'multi_replace_file_content':
                chunks = args.get('ReplacementChunks', [])
                if isinstance(chunks, str):
                    chunks = json.loads(chunks)
                for i, c in enumerate(chunks):
                    print(f"Chunk {i} TARGET:\n", c.get('TargetContent', '')[:100])
                    print(f"Chunk {i} REPLACE:\n", c.get('ReplacementContent', '')[:100])
