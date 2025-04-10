import requests
import os

# 1. Download SlimOrca dataset
def download_slimorca():
    url = "https://huggingface.co/datasets/Open-Orca/SlimOrca/resolve/main/chat.jsonl"
    print("Downloading SlimOrca dataset...")
    response = requests.get(url)
    with open("chat.jsonl", "wb") as f:
        f.write(response.content)
    print("Download complete!")

# 2. Extract first N examples
def extract_subset(n=500):
    print(f"Extracting first {n} examples...")
    with open("chat.jsonl", "r", encoding="utf-8") as infile, \
         open("slimorca_subset.jsonl", "w", encoding="utf-8") as outfile:
        for i, line in enumerate(infile):
            if i >= n:
                break
            outfile.write(line)
    print(f"Created slimorca_subset.jsonl with {n} examples")

# 3. Merge with existing dataset
def merge_datasets():
    existing_file = "lets_corrected_dawntasyAI-training.jsonl"
    output_file = "combined_training.jsonl"
    
    print(f"Merging with {existing_file}...")
    with open(output_file, "w", encoding="utf-8") as outfile:
        # Copy existing data
        if os.path.exists(existing_file):
            with open(existing_file, "r", encoding="utf-8") as infile:
                for line in infile:
                    outfile.write(line)
        
        # Add SlimOrca subset
        with open("slimorca_subset.jsonl", "r", encoding="utf-8") as infile:
            for line in infile:
                outfile.write(line)
    
    print(f"Created {output_file}")
    print(f"Total examples: {sum(1 for _ in open(output_file, encoding='utf-8'))}")

if __name__ == "__main__":
    download_slimorca()
    extract_subset(500)  # Change number if you want more examples
    merge_datasets()
    print("Done! Ready for fine-tuning.")