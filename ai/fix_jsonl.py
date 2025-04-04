import json

def fix_jsonl(file_path, output_path):
    corrected_lines = []
    with open(file_path, 'r') as f:
        for line in f:
            try:
                # Attempt to parse each line
                obj = json.loads(line)
                corrected_lines.append(json.dumps(obj))
            except json.JSONDecodeError as e:
                # Handle errors (e.g., missing commas)
                print(f"Error parsing line: {line}\n{e}")
                # Attempt manual fixes (e.g., adding commas)
                fixed_line = line.replace('} {', '}, {')
                try:
                    obj = json.loads(fixed_line)
                    corrected_lines.append(json.dumps(obj))
                except json.JSONDecodeError as e2:
                    print(f"Failed to fix line: {line}\n{e2}")
    
    # Write corrected lines to output file
    with open(output_path, 'w') as out_f:
        out_f.write('\n'.join(corrected_lines))

# Usage
fix_jsonl('dawntasyAI-training.jsonl', 'corrected.jsonl')
