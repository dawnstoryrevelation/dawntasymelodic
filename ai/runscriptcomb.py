# Read your existing data
with open("lets_corrected_dawntasyAI-training.jsonl", "r") as f_original:
    original_lines = f_original.readlines()

# Read converted Alpaca data
with open("alpaca_converted.jsonl", "r") as f_alpaca:
    alpaca_lines = f_alpaca.readlines()

# Combine (original data comes first)
with open("final_dataset.jsonl", "w") as f_final:
    f_final.writelines(original_lines + alpaca_lines)
