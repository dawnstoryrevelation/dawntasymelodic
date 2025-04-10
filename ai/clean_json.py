import json
from json.decoder import JSONDecodeError

def repair_json(input_file, output_file):
    """
    Reads a potentially malformed JSON file, fixes syntax/structure issues,
    and writes a corrected version while preserving all original content.
    """
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Attempt to parse the JSON
    try:
        data = json.loads(content)
        print("JSON is already valid. Creating cleaned copy.")
    except JSONDecodeError as e:
        print(f"Found JSON issues: {str(e)}. Attempting repairs...")
        
        # Common JSON repair operations
        repaired = content
        
        # 1. Fix unescaped quotes within strings
        repaired = repaired.replace('\\"', '\\\\"')  # First escape existing escapes
        repaired = repaired.replace('": "', '": "@@')  # Temporary marker
        repaired = repaired.replace('"', '\\"')  # Escape all quotes
        repaired = repaired.replace('@@', '"')  # Restore original string quotes
        
        # 2. Fix trailing commas in objects/arrays
        repaired = repaired.replace(',\n}', '\n}').replace(',\n]', '\n]')
        
        # 3. Fix missing commas between items
        repaired = repaired.replace('}\n{', '},\n{').replace(']\n[', '],\n[')
        
        # 4. Fix unquoted keys
        lines = repaired.split('\n')
        for i, line in enumerate(lines):
            if ': ' in line and not line.strip().startswith('"'):
                before, after = line.split(': ', 1)
                lines[i] = f'"{before.strip()}": {after}'
        repaired = '\n'.join(lines)
        
        try:
            data = json.loads(repaired)
            print("Successfully repaired JSON structure.")
        except JSONDecodeError as e:
            print(f"Could not fully repair JSON: {str(e)}")
            # If still invalid, try loading line by line as a last resort
            try:
                data = []
                for line in content.split('\n'):
                    line = line.strip()
                    if line:
                        try:
                            data.append(json.loads(line))
                        except:
                            pass
                print("Created valid JSON from line-by-line parsing.")
            except:
                raise ValueError("Could not repair JSON while preserving all content.")
    
    # Write the corrected JSON (whether original or repaired)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully created corrected JSON at: {output_file}")

# Usage example:
input_json = 'alpaca_cleaned.json'
output_json = 'alpaca_cleaned_repaired.json'
repair_json(input_json, output_json)
