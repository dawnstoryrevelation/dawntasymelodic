# --- UPDATED File: aeon_engine/cognitive_atoms/atom_definitions/mini_char_generator/generator_atom.py ---

import tensorflow as tf
import numpy as np
import os
import json
import logging
import time

logger = logging.getLogger(__name__)
# logger.setLevel(logging.DEBUG)

# --- Configuration ---
ATOM_DEF_DIR = os.path.dirname(os.path.abspath(__file__))
# *** Point to the NEW model and aux data ***
SAVED_MODEL_PATH = os.path.join(ATOM_DEF_DIR, 'mini_chat_gen_model')
AUX_DATA_PATH = os.path.join(ATOM_DEF_DIR, 'model_chat_aux_data.json')

# --- Load Model and Auxiliary Data ---
# Load these once when the module is first imported for efficiency
loaded_model = None
char2idx = {}
idx2char = np.array([])
MODEL_LOADED = False
load_error_message = ""

try:
    if not os.path.exists(SAVED_MODEL_PATH) or not os.path.exists(AUX_DATA_PATH):
        load_error_message = "Model or auxiliary data file not found. Run training script first."
        raise FileNotFoundError(load_error_message)

    # Load the SavedModel
    loaded_model = tf.saved_model.load(SAVED_MODEL_PATH)
    # Optionally get the concrete function for potential speedup
    # predictor = loaded_model.signatures['serving_default']
    logger.info(f"Loaded character generation model from {SAVED_MODEL_PATH}")

    # Load auxiliary data
    with open(AUX_DATA_PATH, 'r', encoding='utf-8') as f:
        aux_data = json.load(f)
    char2idx = aux_data['char2idx']
    idx2char = np.array(aux_data['idx2char']) # Convert list back to numpy array
    vocab_size = aux_data['vocab_size']
    logger.info(f"Loaded auxiliary data (vocab size: {vocab_size}).")

    MODEL_LOADED = True
except Exception as e:
    logger.error(f"CRITICAL ERROR: Failed to load generative model or aux data: {e}", exc_info=True)
    # Store error message to return from atom if loading failed
    load_error_message = f"Error loading model: {e}"
    MODEL_LOADED = False


# --- Atom Function ---
def generate_text_char_level(input_data):
    """
    Cognitive Atom: Generates conversational text using the trained mini-RNN.

    Args:
        input_data (dict): Expects a dictionary with keys:
            'start_string' (str): Seed string (e.g., "--- User ---\nHello\n\n--- Assistant ---\n").
            'num_generate' (int): Max number of characters to generate.
            'temperature' (float, optional): Controls randomness (0.1-1.5). Defaults to 0.7.
            'stop_sequences' (list, optional): List of strings to stop generation if encountered. Defaults to ["--- User ---"].

    Returns:
        str: The generated text string (start_string + generated chars) or an error message.
    """
    if not MODEL_LOADED or loaded_model is None:
        return f"Error: Generative Atom model failed to load. Reason: {load_error_message}"

    try:
        # --- Input Validation & Defaults ---
        if not isinstance(input_data, dict): return "Error: Input must be a dictionary."
        start_string = input_data.get('start_string')
        num_generate = input_data.get('num_generate')
        temperature = float(input_data.get('temperature', 0.7))
        stop_sequences = input_data.get('stop_sequences', ["--- User ---", "=== END OF CONVERSATION ==="]) # Stop at common separators

        if not isinstance(start_string, str): return "Error: 'start_string' (string) required."
        if not isinstance(num_generate, int) or num_generate <= 0: return "Error: 'num_generate' (positive integer) required."
        temperature = max(0.1, min(1.5, temperature)) # Clamp temperature

        logger.info(f"Generating {num_generate} characters starting with '{start_string[-50:]}...', Temp: {temperature}")
        start_time = time.time()

        # --- Text Generation Logic ---
        # Vectorize the start string
        input_eval = [char2idx.get(s, 0) for s in start_string] # Use 0 for unknown chars
        input_eval = tf.expand_dims(input_eval, 0)

        text_generated = []
        # Reset model state before generation
        loaded_model.reset_states() # Crucial for stateful RNNs

        for i in range(num_generate):
            # Predict logits for the next character
            predictions = loaded_model(input_eval) # Shape: (1, sequence_length, vocab_size)
            # Get logits for the last timestep
            predictions = tf.squeeze(predictions, 0)[-1, :]

            # Scale logits by temperature
            predictions = predictions / temperature

            # Sample the predicted character ID
            predicted_id = tf.random.categorical(tf.expand_dims(predictions, 0), num_samples=1)[-1, 0].numpy()

            # Prepare the predicted ID as the next input
            input_eval = tf.expand_dims([predicted_id], 0)

            # Convert ID back to character
            char = idx2char[predicted_id]
            text_generated.append(char)

            # Check for stop sequences
            current_output = start_string + ''.join(text_generated)
            for stop_seq in stop_sequences:
                 if current_output.endswith(stop_seq):
                      logger.info(f"Stop sequence '{stop_seq}' detected. Stopping generation.")
                      # Remove the stop sequence itself from the final output
                      result = current_output[:-len(stop_seq)]
                      generation_duration = time.time() - start_time
                      logger.info(f"Generation finished early in {generation_duration:.2f} sec.")
                      return result # Return text generated *before* stop sequence

        # If loop finishes without stop sequence
        result = start_string + ''.join(text_generated)
        generation_duration = time.time() - start_time
        logger.info(f"Generation finished (max length reached) in {generation_duration:.2f} sec.")
        return result

    except Exception as e:
        logger.error(f"Error during text generation: {e}", exc_info=True)
        return "Error: Failed during generation process."


# --- Example Usage (for testing this Atom directly) ---
if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    logger.info("\n" + "="*30)
    logger.info("Testing Mini Character Generator Atom (Chat Model) directly")
    logger.info("="*30)

    if not MODEL_LOADED:
        logger.error("Model not loaded. Cannot run direct test.")
    else:
        # Provide a more conversational start string, mimicking the training data format
        test_input = {
            "start_string": "\n\n=== END OF CONVERSATION ===\n\n--- User ---\nWhat is AEON?\n\n--- Assistant ---\n",
            "num_generate": 200, # Generate more characters
            "temperature": 0.8   # Slightly higher temperature for more variability
        }
        print(f"Input Seed:\n{test_input['start_string']}")
        print(f"Generating {test_input['num_generate']} characters with temp {test_input['temperature']}...")

        generated = generate_text_char_level(test_input)

        print("\n--- Generated Text ---")
        # Print only the newly generated part
        print(generated[len(test_input['start_string']):])
        print("--- End Generated Text ---")

    logger.info("\nDirect test finished.")
    logger.info("="*30)