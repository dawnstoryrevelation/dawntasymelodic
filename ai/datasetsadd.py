from datasets import load_dataset
import json
import os

def convert_to_conversation(entry, dataset_name):
    """Converts to conversational format"""
    if dataset_name == "HuggingFaceH4/ultrachat_200k":
        return {"messages": entry["messages"]}
    elif dataset_name == "togethercomputer/RedPajama-Data-1T":
        return {
            "messages": [
                {"role": "user", "content": "Continue the text:"},
                {"role": "assistant", "content": entry["text"]}
            ]
        }

def extract_range(dataset_name, start_idx, end_idx, output_file, **load_kwargs):
    try:
        # Special handling for RedPajama config
        if dataset_name == "togethercomputer/RedPajama-Data-1T":
            dataset = load_dataset(
                dataset_name,
                name="default",  # Correct parameter name instead of 'config'
                split="train",
                trust_remote_code=True,
                streaming=True
            ).take(end_idx)  # Stream first N examples
        else:
            dataset = load_dataset(dataset_name, **load_kwargs)
            if isinstance(dataset, dict):
                split = load_kwargs.get('split', 'train')
                dataset = dataset[split] if split in dataset else next(iter(dataset.values()))

        with open(output_file, 'w', encoding='utf-8') as f:
            # For RedPajama (streaming)
            if dataset_name == "togethercomputer/RedPajama-Data-1T":
                for i, entry in enumerate(dataset):
                    if i >= start_idx and i < end_idx:
                        converted = convert_to_conversation(entry, dataset_name)
                        json.dump(converted, f, ensure_ascii=False)
                        f.write('\n')
                    elif i >= end_idx:
                        break
            # For UltraChat (in-memory)
            else:
                total_samples = len(dataset)
                if end_idx > total_samples:
                    print(f"⚠️ Dataset only has {total_samples} examples (requested up to {end_idx})")
                    end_idx = total_samples
                
                for i in range(start_idx, end_idx):
                    converted = convert_to_conversation(dataset[i], dataset_name)
                    json.dump(converted, f, ensure_ascii=False)
                    f.write('\n')
                    
        print(f"✅ Saved lines {start_idx}-{end_idx} to {os.path.abspath(output_file)}")

    except Exception as e:
        print(f"❌ Failed on {dataset_name}: {str(e)}")

# Configuration
datasets_to_process = {
    "HuggingFaceH4/ultrachat_200k": {
        "output_file": "ultrachat_1600_2000.jsonl",
        "split": "train_sft",
        "start_idx": 1600,
        "end_idx": 2000
    },
    "togethercomputer/RedPajama-Data-1T": {
        "output_file": "redpajama_0_800.jsonl",
        "start_idx": 0,
        "end_idx": 800
    }
}

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

for dataset_name, params in datasets_to_process.items():
    extract_range(
        dataset_name,
        output_file=params["output_file"],
        start_idx=params["start_idx"],
        end_idx=params["end_idx"],
        split=params.get("split")
    )
