import datasets
import json

def format_conversation(example, dataset_name):
    """Formats examples into OpenAI's conversational JSONL format."""
    messages = []
    
    if dataset_name == "argilla/ultrafeedback-binarized-preferences":
        chosen = example.get("chosen")
        if isinstance(chosen, list) and chosen:
            chosen_text = chosen[0]
        elif isinstance(chosen, str):
            chosen_text = chosen
        else:
            chosen_text = ""
        if example.get("prompt") and chosen_text:
             messages = [
                {"role": "user", "content": example.get("prompt", "")},
                {"role": "assistant", "content": chosen_text}
            ]
    elif dataset_name == "OpenAssistant/oasst1":
        role_mapping = {"prompter": "user", "assistant": "assistant"}
        role = role_mapping.get(example.get("role", ""), "user")
        text = example.get("text", "")
        if role and text:
            messages = [{"role": role, "content": text}]
    elif dataset_name == "teknium/OpenHermes-2.5":
        instruction = example.get("instruction", "")
        response = example.get("response", "")
        if instruction and response:
            messages = [
                {"role": "user", "content": instruction},
                {"role": "assistant", "content": response}
            ]
    elif dataset_name == "anon8231489123/ShareGPT_Vicuna_unfiltered":
        conversations = example.get("conversations", [])
        for turn in conversations:
            role = "user" if turn.get("from", "") == "human" else "assistant"
            content = turn.get("value", "")
            if role and content:
                messages.append({"role": role, "content": content})

    elif dataset_name == "open-thoughts/OpenThoughts-114k":
        input_text = example.get("input", "")
        output_text = example.get("output", "")
        if input_text and output_text:
            messages = [
                {"role": "user", "content": input_text},
                {"role": "assistant", "content": output_text}
            ]
    elif dataset_name == "Anthropic/hh-rlhf":
        question = example.get("question", "")
        chosen = example.get("chosen", "")
        if isinstance(chosen, list) and chosen:
            chosen_text = chosen[0]
        elif isinstance(chosen, str):
            chosen_text = chosen
        else:
            chosen_text = ""
        if question and chosen_text:
            messages = [
                {"role": "user", "content": question},
                {"role": "assistant", "content": chosen_text}
            ]
    return {"messages": messages} if messages else None

def process_dataset(dataset_name, output_file, num_lines=800):
    """Processes a dataset and saves formatted examples."""
    try:

        kwargs = {}
        if dataset_name == "OpenAssistant/oasst1":
            kwargs = {"data_dir": "2023-04-12"}
        if dataset_name == "anon8231489123/ShareGPT_Vicuna_unfiltered":
            kwargs = {"data_files": "ShareGPT_V3_unfiltered_cleaned_split.json"}

        dataset = datasets.load_dataset(dataset_name, split="train", streaming=False, **kwargs)

        with open(output_file, "w", encoding="utf-8") as f:
            count = 0
            for example in dataset:
                if count >= num_lines:
                    break
                formatted = format_conversation(example, dataset_name)
                if formatted:
                    json.dump(formatted, f, ensure_ascii=False)
                    f.write('\n')
                    count += 1

        print(f"✅ Successfully processed {count} examples from {dataset_name} to {output_file}")
        return True

    except Exception as e:
        print(f"❌ Failed to process {dataset_name}: {str(e)}")
        return False

if __name__ == "__main__":
    datasets_to_process = {
        "argilla/ultrafeedback-binarized-preferences": "ultrafeedback_chat.jsonl",
        "OpenAssistant/oasst1": "oasst1_chat.jsonl",
        "teknium/OpenHermes-2.5": "openhermes_chat.jsonl",
        "anon8231489123/ShareGPT_Vicuna_unfiltered": "sharegpt_chat.jsonl",
        "open-thoughts/OpenThoughts-114k": "openthoughts_chat.jsonl",
        "Anthropic/hh-rlhf": "anthropic_hh_chat.jsonl"
    }

    for name, out_file in datasets_to_process.items():
        process_dataset(name, out_file)
