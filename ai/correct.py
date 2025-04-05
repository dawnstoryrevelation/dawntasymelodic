import json

def check_and_correct_jsonl(input_file, output_file=None, report_file=None):
    """
    Checks a JSONL file for common issues relevant to OpenAI API fine-tuning.
    Ensures UTF-8 encoding and checks basic structure.
    Optionally saves valid data and generates a report.
    """
    corrected_data = []
    report = []
    line_number = 0

    try:
        with open(input_file, 'r', encoding='utf-8') as infile:
            for line in infile:
                line_number += 1
                try:
                    record = json.loads(line.strip())  # Load JSON, remove leading/trailing whitespace
                    is_valid = True

                    if not isinstance(record, dict) or "messages" not in record or not isinstance(record["messages"], list):
                        report.append(f"Line {line_number}: Invalid top-level structure. Expected a dictionary with a 'messages' key containing a list.")
                        is_valid = False
                        continue

                    messages = record["messages"]
                    if not messages:
                        report.append(f"Line {line_number}: 'messages' list is empty.")
                        is_valid = False

                    user_found = False
                    assistant_found = False
                    for i, message in enumerate(messages):
                        if not isinstance(message, dict) or "role" not in message or "content" not in message:
                            report.append(f"Line {line_number}, message {i+1}: Missing 'role' or 'content' key.")
                            is_valid = False
                            continue

                        role = message["role"]
                        content = message["content"]

                        if not isinstance(role, str) or not isinstance(content, str):
                            report.append(f"Line {line_number}, message {i+1}: 'role' and 'content' should be strings.")
                            is_valid = False

                        if role == "user":
                            user_found = True
                        elif role == "assistant":
                            assistant_found = True
                        elif role not in ["user", "assistant"]:
                            report.append(f"Line {line_number}, message {i+1}: Unexpected role: '{role}'. Should be 'user' or 'assistant'.")
                            is_valid = False

                    if not user_found:
                        report.append(f"Line {line_number}: No 'user' message found in the 'messages' list.")
                        is_valid = False
                    if not assistant_found:
                        report.append(f"Line {line_number}: No 'assistant' message found in the 'messages' list.")
                        is_valid = False

                    if is_valid:
                        corrected_data.append(record)

                except json.JSONDecodeError as e:
                    report.append(f"Line {line_number}: Error decoding JSON: {e}")

    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        return

    if output_file:
        with open(output_file, 'w', encoding='utf-8') as outfile:
            for record in corrected_data:
                outfile.write(json.dumps(record, ensure_ascii=False) + '\n')
        print(f"Processed {line_number} lines. Wrote {len(corrected_data)} valid lines to {output_file} (UTF-8 encoding).")
    else:
        print(f"Processed {line_number} lines. Found {len(corrected_data)} valid lines.")

    if report_file:
        with open(report_file, 'w', encoding='utf-8') as report_outfile:
            for entry in report:
                report_outfile.write(entry + '\n')
        print(f"Generated a report of issues in {report_file} (UTF-8 encoding).")
    else:
        print("Report of issues:")
        for entry in report:
            print(entry)

if __name__ == "__main__":
    input_file = "dawntasyAI-training.jsonl"
    output_file = "corrected_dawntasyAI-training.jsonl"
    report_file = "dawntasyAI-training_report.txt"

    check_and_correct_jsonl(input_file, output_file, report_file)