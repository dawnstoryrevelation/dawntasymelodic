import logging

# It's good practice for Atoms to have logging too
# Configure logger named after the module (e.g., 'cognitive_atoms.atom_definitions.simple_python_atom.formatter')
# This allows for hierarchical logging control later if desired.
logger = logging.getLogger(__name__)
# Set default level if needed, but often rely on root config set elsewhere (like in ACE)
# logger.setLevel(logging.INFO)

def uppercase_text(input_data):
    """
    A simple Cognitive Atom implementation. Converts input text to uppercase.

    Handles direct string input or dictionaries containing common text keys.

    Args:
        input_data (any): The input data. Ideally a string or a dictionary
                          containing a string under keys like 'text' or 'content'.

    Returns:
        str: The uppercase version of the input text, or an error message string.
    """
    # Use logger.debug for verbose info, logger.info for standard execution flow notes
    logger.debug(f"Atom 'uppercase_text' received input type: {type(input_data)}")

    text_to_process = None

    # 1. Handle direct string input
    if isinstance(input_data, str):
        text_to_process = input_data
        logger.debug("Input is a direct string.")

    # 2. Handle dictionary input (common way Blueprints might pass data)
    elif isinstance(input_data, dict):
        logger.debug("Input is a dictionary. Searching for text field...")
        # Prioritize specific keys, making the Atom slightly more robust
        possible_keys = ['text', 'content', 'input_string', 'data']
        for key in possible_keys:
            if key in input_data and isinstance(input_data[key], str):
                text_to_process = input_data[key]
                logger.debug(f"Found text in dictionary key: '{key}'")
                break
        if text_to_process is None:
             # Log clearly if a dict was passed but no suitable key found
             logger.warning(f"Input dictionary received, but no recognized string field ({possible_keys}) found.")
             # Return a descriptive error that ACE/Blueprint might handle
             return "Error: Input dictionary did not contain a valid text field."

    # 3. Handle other types (attempt conversion, log warning)
    else:
        logger.warning(f"Input type {type(input_data)} is not optimal. Attempting string conversion.")
        try:
            text_to_process = str(input_data)
        except Exception as e:
            logger.error(f"Could not convert input type {type(input_data)} to string: {e}", exc_info=True) # Log full exception
            return f"Error: Cannot process input type {type(input_data)}."

    # 4. Check if text was successfully extracted
    if text_to_process is None:
         # This case might be redundant if handled above, but good safety check
         logger.error("No valid text could be extracted from the input.")
         return "Error: No valid text provided or extracted."

    # 5. Perform the core logic (the actual "Atom" function)
    try:
        result = text_to_process.upper()
        logger.info(f"Atom 'uppercase_text' processed successfully. Output length: {len(result)}")
        return result
    except Exception as e:
        # Catch potential errors during the core operation itself
        logger.error(f"Error during uppercase conversion for text: '{text_to_process[:50]}...': {e}", exc_info=True)
        return "Error: Failed during string processing."

# Example of direct test within the atom file (useful for isolated testing)
if __name__ == '__main__':
    # Configure basic logging JUST for this direct test run
    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    print("\n" + "="*20)
    print("Testing uppercase_text atom directly:")
    print("="*20)
    print(f"Input: 'hello world' -> Output: {uppercase_text('hello world')}")
    print(f"Input: {{'text': 'test input'}} -> Output: {uppercase_text({'text': 'test input'})}")
    print(f"Input: {{'content': 'from content'}} -> Output: {uppercase_text({'content': 'from content'})}")
    print(f"Input: 123 -> Output: {uppercase_text(123)}")
    print(f"Input: None -> Output: {uppercase_text(None)}")
    print(f"Input: {{'data': 123}} -> Output: {uppercase_text({'data': 123})}")
    print(f"Input: {{'other_key': 'value'}} -> Output: {uppercase_text({'other_key': 'value'})}")
    print("="*20)
    print("Direct test finished.")
    print("="*20 + "\n")