# --- UPDATED File: aeon_engine/cognitive_atoms/atom_definitions/mini_char_generator/train_generator.py ---

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
import os
import time
import logging
import json
from datasets import load_dataset # <<< Import datasets library

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
ATOM_DEF_DIR = os.path.dirname(os.path.abspath(__file__))
# We might not save the raw text, but define where model/aux data goes
SAVED_MODEL_PATH = os.path.join(ATOM_DEF_DIR, 'mini_chat_gen_model') # Renamed model
AUX_DATA_PATH = os.path.join(ATOM_DEF_DIR, 'model_chat_aux_data.json') # Renamed aux data
CHECKPOINT_DIR = os.path.join(ATOM_DEF_DIR, 'training_chat_checkpoints') # Renamed checkpoints

# Dataset parameters
DATASET_NAME = "HuggingFaceH4/ultrachat_200k"
# Use 'train_sft' or 'test_sft' splits typically used for fine-tuning/training
DATASET_SPLIT = "train_sft"
# !!! IMPORTANT: Adjust max_examples for feasibility !!!
# Start very small (e.g., 1000) to test the pipeline quickly.
# Increase carefully (e.g., 10000, 20000). Training time increases significantly.
MAX_EXAMPLES = 1000 # <<< START SMALL (e.g., 1000), INCREASE CAREFULLY LATER
# --- End Dataset parameters ---


# Training parameters (May need adjustment based on dataset size/complexity)
SEQ_LENGTH = 100      # Increased sequence length for conversational context
BATCH_SIZE = 64       # Might need smaller batch size depending on GPU memory
BUFFER_SIZE = 10000
EMBEDDING_DIM = 128   # Slightly larger embedding for richer data
RNN_UNITS = 256       # Slightly larger RNN for richer data
EPOCHS = 5            # Start with fewer epochs for larger data, increase if needed

# --- 1. Load and Prepare Data ---
logging.info(f"Loading dataset: {DATASET_NAME}, Split: {DATASET_SPLIT}")
text = ""
try:
    # Load only the specified number of examples using streaming to avoid downloading everything
    dataset_stream = load_dataset(DATASET_NAME, split=DATASET_SPLIT, streaming=True)
    processed_examples = 0
    combined_text_list = []

    # Iterate through the stream and take the first MAX_EXAMPLES
    for example in dataset_stream:
        if processed_examples >= MAX_EXAMPLES:
            break
        # Ultrachat messages are in 'messages', which is a list of dicts {'content': ..., 'role': ...}
        if 'messages' in example and isinstance(example['messages'], list):
            conversation = ""
            for message in example['messages']:
                 # Simple format: Role: Content\n
                 role = message.get('role', 'unknown').capitalize()
                 content = message.get('content', '')
                 # Add separators for clarity between turns
                 conversation += f"--- {role} ---\n{content}\n\n"
            combined_text_list.append(conversation.strip()) # Add processed conversation
            processed_examples += 1
            if processed_examples % 100 == 0:
                logging.info(f"Processed {processed_examples}/{MAX_EXAMPLES} examples...")

    if not combined_text_list:
        raise ValueError("No valid examples processed from the dataset stream.")

    # Combine all processed conversations into one large text block
    text = "\n\n=== END OF CONVERSATION ===\n\n".join(combined_text_list) # Separator between conversations
    logging.info(f"Finished processing {processed_examples} examples.")
    logging.info(f'Total length of combined text: {len(text)} characters')

    # Optional: Save the processed text slice for faster reloading next time
    # processed_text_path = os.path.join(ATOM_DEF_DIR, f'ultrachat_{MAX_EXAMPLES}_processed.txt')
    # with open(processed_text_path, 'w', encoding='utf-8') as f:
    #     f.write(text)
    # logging.info(f"Processed text slice saved to {processed_text_path}")

except Exception as e:
    logging.error(f"Failed to load or process dataset: {e}", exc_info=True)
    exit(1)


# --- Character Vocab and Mapping (Same as before) ---
vocab = sorted(list(set(text)))
vocab_size = len(vocab)
logging.info(f'{vocab_size} unique characters found.')
# logging.debug(f'Vocabulary: {"".join(vocab)}') # Can be very long now

char2idx = {u: i for i, u in enumerate(vocab)}
idx2char = np.array(vocab)
text_as_int = np.array([char2idx.get(c, 0) for c in text]) # Use get with default for safety

# --- Create tf.data.Dataset (Same as before) ---
char_dataset = tf.data.Dataset.from_tensor_slices(text_as_int)
sequences = char_dataset.batch(SEQ_LENGTH + 1, drop_remainder=True)

def split_input_target(chunk):
    input_text = chunk[:-1]
    target_text = chunk[1:]
    return input_text, target_text

dataset = sequences.map(split_input_target)
dataset = (
    dataset
    .shuffle(BUFFER_SIZE)
    .batch(BATCH_SIZE, drop_remainder=True)
    .prefetch(tf.data.experimental.AUTOTUNE)
)
logging.info("Dataset prepared successfully.")
logging.info(f"Dataset element spec (input, target): {dataset.element_spec}")


# --- 2. Build the Model (Same minimal architecture) ---
# Note: This architecture is likely TOO SMALL for meaningful learning on Ultrachat,
# but keeps training feasible locally 'from scratch'. Expect limited quality.
def build_model(vocab_size, embedding_dim, rnn_units, batch_size):
    model = keras.Sequential([
        layers.Embedding(vocab_size, embedding_dim, batch_input_shape=[batch_size, None]),
        # Consider LSTM or multiple GRU layers if performance is very poor and you have time/GPU
        layers.GRU(rnn_units,
                   return_sequences=True,
                   stateful=True,
                   recurrent_initializer='glorot_uniform'),
        # Optional: Add another GRU layer
        # layers.GRU(rnn_units, return_sequences=True, stateful=True, recurrent_initializer='glorot_uniform'),
        layers.Dense(vocab_size)
    ])
    return model

model = build_model(
    vocab_size=vocab_size,
    embedding_dim=EMBEDDING_DIM,
    rnn_units=RNN_UNITS,
    batch_size=BATCH_SIZE)

model.summary()


# --- 3. Define Loss and Optimizer (Same as before) ---
loss = tf.losses.SparseCategoricalCrossentropy(from_logits=True)
optimizer = tf.optimizers.Adam()
model.compile(optimizer=optimizer, loss=loss)


# --- 4. Configure Checkpoints (Same as before, adjusted path) ---
checkpoint_prefix = os.path.join(CHECKPOINT_DIR, "ckpt_{epoch}")
checkpoint_callback = tf.keras.callbacks.ModelCheckpoint(
    filepath=checkpoint_prefix,
    save_weights_only=True)


# --- 5. Train the Model ---
logging.info(f"Starting training for {EPOCHS} epochs... This may take a while!")
start_train_time = time.time()

# Ensure checkpoint directory exists
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

history = model.fit(
    dataset,
    epochs=EPOCHS,
    callbacks=[checkpoint_callback]
    )

training_duration = time.time() - start_train_time
logging.info(f"Training finished in {training_duration / 60:.2f} minutes.")


# --- 6. Save the Trained Model & Aux Data ---
# Rebuild model with batch_size=1 for saving/inference
model_for_saving = build_model(vocab_size, EMBEDDING_DIM, RNN_UNITS, batch_size=1)
latest_checkpoint = tf.train.latest_checkpoint(CHECKPOINT_DIR)
if latest_checkpoint:
    logging.info(f"Loading weights from {latest_checkpoint}")
    # Use expect_partial to avoid issues if optimizer state isn't saved/needed
    model_for_saving.load_weights(latest_checkpoint).expect_partial()
    model_for_saving.build(tf.TensorShape([1, None])) # Build graph after loading weights
    logging.info("Rebuilt model with batch_size=1 for saving.")
    model_for_saving.summary()

    try:
        logging.info(f"Saving full model to: {SAVED_MODEL_PATH}")
        # Save in TensorFlow SavedModel format
        tf.saved_model.save(model_for_saving, SAVED_MODEL_PATH)
        logging.info("Model saved successfully in SavedModel format.")

        # Save auxiliary data needed for the Atom
        aux_data = {
            'char2idx': char2idx,
            'idx2char': idx2char.tolist(), # Convert numpy array for JSON
            'seq_length': SEQ_LENGTH, # Note: Might not be strictly needed by generator atom
            'embedding_dim': EMBEDDING_DIM,
            'rnn_units': RNN_UNITS,
            'vocab_size': vocab_size
        }
        with open(AUX_DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(aux_data, f, indent=2) # Added indent for readability
        logging.info(f"Auxiliary data saved to: {AUX_DATA_PATH}")

    except Exception as e:
        logging.error(f"Error saving model or auxiliary data: {e}", exc_info=True)
else:
     logging.error(f"Could not find checkpoint in {CHECKPOINT_DIR}. Model not saved.")


logging.info("Training script finished.")