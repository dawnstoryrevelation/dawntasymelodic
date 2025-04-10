import datasets
import random
import json

def create_conversation_jsonl(dataset_name, dataset_config_name, num_samples, output_filename):
    """
    Loads a dataset from Hugging Face, selects random samples, and saves them
    in OpenAI conversation-formatted JSONL file.

    Args:
        dataset_name (str): Name of the dataset on Hugging Face.
        dataset_config_name (str): Configuration name (if any). Use None if no config.
        num_samples (int): Number of random samples to select.
        output_filename (str): Name of the output JSONL file.
    """

    try:
        # Load dataset with proper parameters
        if dataset_name == "allenai/dolma":
            # Special handling for dolma which requires trust_remote_code
            dataset = datasets.load_dataset(
                dataset_name, 
                split="train",
                trust_remote_code=True
            )
        elif dataset_name == "HuggingFaceTB/finemath":
            # Special handling for finemath which requires a config
            if not dataset_config_name:
                raise ValueError("finemath requires a config name (e.g., 'finemath-3plus')")
            dataset = datasets.load_dataset(
                dataset_name, 
                dataset_config_name, 
                split="train"
            )
        else:
            raise ValueError(f"Unsupported dataset: {dataset_name}")

        if num_samples > len(dataset):
            print(f"Warning: Dataset only contains {len(dataset)} samples. Using all available.")
            indices = list(range(len(dataset)))
        else:
            indices = random.sample(range(len(dataset)), num_samples)

        with open(output_filename, 'w', encoding='utf-8') as f:
            for i in indices:
                example = dataset[i]
                
                # Format conversation based on dataset structure
                if dataset_name == "allenai/dolma":
                    # For plain text, create a single-turn conversation
                    messages = [
                        {"role": "user", "content": "Tell me something interesting."},
                        {"role": "assistant", "content": example.get('text', '')}
                    ]
                elif dataset_name == "HuggingFaceTB/finemath":
                    # Format as math problem-solving dialogue
                    messages = [
                        {"role": "user", "content": example.get('question', example.get('text', 'Solve this math problem'))},
                        {"role": "assistant", "content": example.get('answer', example.get('solution', ''))}
                    ]

                # Create the OpenAI format record
                openai_record = {"messages": messages}
                f.write(json.dumps(openai_record, ensure_ascii=False) + '\n')

        print(f"Successfully created {output_filename} with {len(indices)} conversation examples.")

    except Exception as e:
        print(f"Error processing {dataset_name}: {str(e)}")

# Dataset configurations
datasets_info = [
    {
        "name": "allenai/dolma", 
        "config": None, 
        "num_samples": 750, 
        "output_file": "dolma_conversations.jsonl"
    },
    {
        "name": "HuggingFaceTB/finemath", 
        "config": "finemath-3plus",  # You can choose any of: finemath-3plus, finemath-4plus, infiwebmath-3plus, infiwebmath-4plus
        "num_samples": 750, 
        "output_file": "finemath_conversations.jsonl"
    },
]

# Process each dataset
for dataset_info in datasets_info:
    create_conversation_jsonl(
        dataset_info["name"],
        dataset_info["config"],
        dataset_info["num_samples"],
        dataset_info["output_file"]
    )
