import json

# Load JSON file with UTF-8 encoding
with open("alpaca_cleaned_repaired.json", "r", encoding="utf-8") as f:
    alpaca_data = json.load(f)

# Convert ALL examples to OpenAI format and save as JSONL
with open("alpaca_converted.jsonl", "w", encoding="utf-8") as f_out:
    for example in alpaca_data:  # Removed the [:800] limit to process all examples
        messages = [
            {"role": "user", "content": example["instruction"]},
            {"role": "assistant", "content": example["output"]}
        ]
        f_out.write(json.dumps({"messages": messages}, ensure_ascii=False) + "\n")

print("Conversion completed successfully! All examples converted to alpaca_converted.jsonl")
