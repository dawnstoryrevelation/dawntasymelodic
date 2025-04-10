import datasets
import json
from typing import Dict, List, Optional, Union
from collections import defaultdict
import traceback

def debug_dataset_structure(dataset_name: str, num_samples: int = 3) -> None:
    """Enhanced dataset structure debugger with better error reporting"""
    print(f"\n🔍 Debugging dataset structure for {dataset_name}")
    try:
        # Special loading parameters for specific datasets
        kwargs = {}
        if dataset_name == "OpenAssistant/oasst1":
            kwargs = {"data_dir": "2023-04-12"}
        elif dataset_name == "anon8231489123/ShareGPT_Vicuna_unfiltered":
            kwargs = {"data_files": "ShareGPT_V3_unfiltered_cleaned_split.json"}
        
        # Attempt to load dataset
        dataset = datasets.load_dataset(dataset_name, split="train", **kwargs)
        
        # Print critical structural information
        print(f"\n📊 Dataset Structure Overview:")
        print(f"- Dataset type: {type(dataset)}")
        print(f"- Number of examples: {len(dataset) if not isinstance(dataset, datasets.iterable_dataset.IterableDataset) else 'Streaming'}")
        print(f"- Features: {list(dataset.features.keys())}")
        
        # Print sample structure
        print(f"\n🔎 First {num_samples} samples:")
        for i in range(min(num_samples, len(dataset))):
            sample = dataset[i]
            print(f"\nSample {i} keys: {list(sample.keys())}")
            print(json.dumps({k: str(v)[:200] + '...' if isinstance(v, (str, list, dict)) and len(str(v)) > 200 else v for k, v in sample.items()}, indent=2, ensure_ascii=False))
            
    except Exception as e:
        print(f"\n❌ Critical loading error: {str(e)}")
        print(traceback.format_exc())
        
        # Try loading with streaming as a fallback
        try:
            print("\nAttempting fallback to streaming dataset...")
            dataset = datasets.load_dataset(dataset_name, split="train", streaming=True, **kwargs)
            print("- Successfully loaded as streaming dataset")
            sample = next(iter(dataset.take(1)))
            print(f"- Sample keys: {list(sample.keys())}")
        except Exception as fallback_err:
            print(f"- Fallback also failed: {str(fallback_err)}")

def extract_text_safely(obj, default=""):
    """Extract text content from various data structures safely"""
    if obj is None:
        return default
    
    if isinstance(obj, str):
        return obj
    elif isinstance(obj, (int, float, bool)):
        return str(obj)
    elif isinstance(obj, dict):
        # Try common field names for text content
        for key in ['content', 'text', 'value', 'instruction', 'response', 'answer', 'message']:
            if key in obj:
                return extract_text_safely(obj[key], default)
        # If no common key, just take the first value
        if obj:
            return extract_text_safely(next(iter(obj.values())), default)
    elif isinstance(obj, list):
        if not obj:
            return default
        if isinstance(obj[0], dict):
            return extract_text_safely(obj[0], default)
        else:
            return str(obj[0])
    
    return default

def format_conversation(example: Dict, dataset_name: str) -> Optional[Dict[str, List[Dict[str, str]]]]:
    """Robust conversation formatter with comprehensive field handling"""
    messages = []
    field_stats = defaultdict(int)
    error_info = {}
    
    try:
        # First, look for an existing messages structure
        if 'messages' in example and isinstance(example['messages'], list):
            valid_messages = []
            for msg in example['messages']:
                if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
                    role = msg['role']
                    # Standardize role names
                    if role in ['human', 'question', 'user', 'input', 'query']:
                        valid_messages.append({
                            "role": "user",
                            "content": extract_text_safely(msg['content'])
                        })
                    elif role in ['assistant', 'answer', 'bot', 'output', 'response']:
                        valid_messages.append({
                            "role": "assistant", 
                            "content": extract_text_safely(msg['content'])
                        })
            
            # Ensure we have at least a user-assistant pair
            if len(valid_messages) >= 2 and valid_messages[0]['role'] == 'user':
                return {"messages": valid_messages[:2]}  # Just take the first pair for simplicity
        
        # Next, try to handle various common dataset formats
        
        # 1. Look for prompt/chosen pattern (like in argilla/ultrafeedback)
        prompt = None
        chosen = None
        
        # Check for prompt in various field names
        for prompt_field in ['prompt', 'instruction', 'input', 'question', 'query', 'human', 'context']:
            if prompt_field in example:
                prompt = extract_text_safely(example[prompt_field])
                field_stats['prompt_field'] = prompt_field
                break
        
        # Check for response in various field names
        for response_field in ['chosen', 'response', 'output', 'answer', 'assistant', 'completion', 'target']:
            if response_field in example:
                chosen = extract_text_safely(example[response_field])
                field_stats['response_field'] = response_field
                break
        
        # If we still don't have a prompt, look for special patterns in keys
        if not prompt:
            print("⚠️ Aggressively searching for a prompt...")
            for key in example.keys():
                key_lower = key.lower()
                if any(term in key_lower for term in ['prompt', 'instruction', 'question', 'query', 'input', 'source']):
                    potential_prompt = extract_text_safely(example[key])
                    if potential_prompt:
                        prompt = potential_prompt
                        field_stats['prompt_found_in'] = key
                        field_stats['prompt_length'] = len(str(prompt))
                        print(f"✅ Found prompt in '{key}': '{str(prompt)[:100]}...'")
                        break

        # If we still don't have a response, look for special patterns in keys
        if not chosen:
            print("⚠️ Aggressively searching for a response...")
            for key in example.keys():
                key_lower = key.lower()
                if any(term in key_lower for term in ['response', 'answer', 'output', 'target', 'completion', 'chosen']):
                    potential_response = extract_text_safely(example[key])
                    if potential_response:
                        chosen = potential_response
                        field_stats['response_found_in'] = key
                        field_stats['response_length'] = len(str(chosen))
                        print(f"✅ Found response in '{key}': '{str(chosen)[:100]}...'")
                        break
        
        # Create messages if we have both prompt and chosen
        if prompt and chosen:
            messages = [
                {"role": "user", "content": str(prompt).strip()},
                {"role": "assistant", "content": str(chosen).strip()}
            ]
            return {"messages": messages}
        
        # Last resort: Check if the example has exactly two keys that might be input/output
        if len(example) == 2:
            keys = list(example.keys())
            if keys[0].lower() in ['input', 'question', 'prompt'] and keys[1].lower() in ['output', 'answer', 'response']:
                return {
                    "messages": [
                        {"role": "user", "content": extract_text_safely(example[keys[0]])},
                        {"role": "assistant", "content": extract_text_safely(example[keys[1]])}
                    ]
                }
            
        print(f"⚠️ Empty messages - Field stats: {dict(field_stats)}")
        print(f"⚠️ Example keys: {list(example.keys())}")
        return None

    except Exception as e:
        error_info = {
            "error": str(e),
            "example": {k: str(v)[:200] for k, v in example.items()},
            "dataset": dataset_name
        }
        print(f"⛔ Formatting error: {json.dumps(error_info, indent=2)}")
        return None

def process_dataset(dataset_name: str, output_file: str, num_lines: int = 800) -> bool:
    """Enhanced dataset processor with comprehensive error recovery"""
    print(f"\n🚀 Processing {dataset_name} → {output_file}")
    
    # Initial structure debugging
    debug_dataset_structure(dataset_name)
    
    try:
        # Configuration for different datasets
        kwargs = {}
        if dataset_name == "OpenAssistant/oasst1":
            kwargs = {"data_dir": "2023-04-12"}
        elif dataset_name == "anon8231489123/ShareGPT_Vicuna_unfiltered":
            kwargs = {"data_files": "ShareGPT_V3_unfiltered_cleaned_split.json"}

        # Load dataset with multiple fallback strategies
        dataset = None
        try:
            dataset = datasets.load_dataset(dataset_name, split="train", **kwargs)
            print(f"✅ Successfully loaded {len(dataset)} examples")
        except Exception as e:
            print(f"⚠️ Falling back to streaming mode: {str(e)}")
            dataset = datasets.load_dataset(dataset_name, split="train", streaming=True, **kwargs)
            dataset = dataset.take(num_lines * 2)  # Take extra to account for filtering
            print("✅ Loaded streaming dataset")

        if not dataset:
            print("❌ Failed to load dataset")
            return False

        # Process and save data
        success_count = 0
        error_count = 0
        with open(output_file, "w", encoding="utf-8") as f:
            for i, example in enumerate(dataset):
                if success_count >= num_lines:
                    break
                
                try:
                    formatted = format_conversation(example, dataset_name)
                    if formatted:
                        json.dump(formatted, f, ensure_ascii=False)
                        f.write('\n')
                        success_count += 1
                        
                        # Print first 3 examples for validation
                        if success_count <= 3:
                            print(f"\n📝 Valid example {success_count}:")
                            print(json.dumps(formatted, indent=2, ensure_ascii=False))
                    else:
                        error_count += 1
                except Exception as e:
                    error_count += 1
                    print(f"⚠️ Processing error at example {i}: {str(e)}")
                    continue
                
                # Progress report
                if (i+1) % 100 == 0:
                    print(f"Progress: {success_count} successful, {error_count} failed, {i+1} processed")

        # Final report
        print(f"\n📊 Processing complete for {dataset_name}")
        print(f"- Successfully converted: {success_count}/{num_lines} (target)")
        print(f"- Failed examples: {error_count}")
        print(f"- Output file: {output_file}")
        
        if success_count > 0:
            print(f"- First example: {json.dumps(formatted, indent=2)}")
            return True
        else:
            print("❌ No valid examples were generated")
            return False

    except Exception as e:
        print(f"\n❌ Critical processing failure: {str(e)}")
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    # Dataset configuration - only process these specific datasets
    datasets_to_process = {
        "argilla/ultrafeedback-binarized-preferences": "ultrafeedback_chat.jsonl",
        "OpenAssistant/oasst1": "oasst1_chat.jsonl", 
        "teknium/OpenHermes-2.5": "openhermes_chat.jsonl", 
        "anon8231489123/ShareGPT_Vicuna_unfiltered": "sharegpt_chat.jsonl", 
        "open-thoughts/OpenThoughts-114k": "openthoughts_chat.jsonl", 
        "Anthropic/hh-rlhf": "anthropic_hh_chat.jsonl"
    }

    # Process each dataset with 800 examples
    for dataset_name, output_file in datasets_to_process.items():
        print(f"\n{'='*80}\n🚀 STARTING DATASET: {dataset_name}\n{'='*80}")
        success = process_dataset(dataset_name, output_file, num_lines=800)
        print(f"\n{'✅ Success' if success else '❌ Failure'} processing {dataset_name}")
        print(f"{'='*80}")