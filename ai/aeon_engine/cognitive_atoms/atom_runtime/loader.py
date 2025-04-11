# --- File: aeon_engine/cognitive_atoms/atom_runtime/loader.py ---

import json
import importlib.util
import os
import logging
import sys
# Import ML libraries later when needed for other Atom types
# import tensorflow as tf
# import tflite_runtime.interpreter as tflite
# import onnxruntime
# import joblib
# import pickle

# --- Configure Logger ---
# Get a logger specific to this module
logger = logging.getLogger(__name__)
# Set default level if needed, or rely on root config set elsewhere (like in ACE)
# logger.setLevel(logging.INFO) # Example: Set level here if desired

# --- Path Setup ---
# Calculate paths relative to this file to ensure correctness
try:
    # Get the absolute path to the directory containing this loader.py file
    RUNTIME_DIR = os.path.dirname(os.path.abspath(__file__))
    # Get the path to the parent 'cognitive_atoms' directory
    ATOM_ROOT = os.path.dirname(RUNTIME_DIR)
    # Get the path to the main project 'aeon_engine' directory
    AEON_ROOT = os.path.dirname(ATOM_ROOT)
    # Define the path to the registry file
    REGISTRY_PATH = os.path.join(ATOM_ROOT, 'registry.json')

    # --- Ensure Project Root is in Python Path ---
    # Allows dynamic imports relative to AEON_ROOT to work reliably.
    if AEON_ROOT not in sys.path:
        sys.path.insert(0, AEON_ROOT)
        logger.debug(f"Added AEON project root to sys.path: {AEON_ROOT}")

except Exception as e:
    # Log critical error if basic path setup fails
    logger.critical(f"CRITICAL ERROR DURING PATH SETUP: {e}", exc_info=True)
    # Depending on application structure, might want to raise or exit here.
    AEON_ROOT = None # Indicate failure


class AtomLoader:
    """
    Loads and executes Cognitive Atoms based on the registry.
    Manages caching of loaded atoms for efficiency.
    Designed as a singleton pattern via the module-level instance.
    """

    def __init__(self):
        """Initializes the loader by reading the atom registry."""
        self.registry = {}
        self.loaded_atoms_cache = {} # Cache: { atom_name: callable_function }
        self._load_registry()
        logger.info("AtomLoader initialized.")

    def _load_registry(self):
        """Loads the atom registry from the JSON file specified by REGISTRY_PATH."""
        if not AEON_ROOT or not os.path.exists(REGISTRY_PATH):
             logger.error(f"CRITICAL: Atom registry file not found at calculated path: {REGISTRY_PATH}. Ensure paths are correct and file exists.")
             self.registry = {} # Ensure registry is empty if file not found
             return # Stop loading if registry path is invalid

        try:
            with open(REGISTRY_PATH, 'r', encoding='utf-8') as f: # Specify encoding
                self.registry = json.load(f)
            logger.info(f"Atom registry loaded successfully from {REGISTRY_PATH}. Found {len(self.registry)} atoms.")
        except json.JSONDecodeError as e:
            logger.error(f"CRITICAL: Error decoding JSON from registry file {REGISTRY_PATH}: {e}")
            self.registry = {} # Reset registry on error
        except Exception as e:
            logger.error(f"CRITICAL: An unexpected error occurred loading the registry: {e}", exc_info=True)
            self.registry = {} # Reset registry on error

    def get_atom(self, atom_name: str):
        """
        Retrieves a callable function for the specified atom name.
        Loads the atom from its definition file if not already cached.

        Args:
            atom_name (str): The unique name of the atom (key in registry.json).

        Returns:
            callable: A function object corresponding to the atom's entry point.

        Raises:
            ValueError: If the atom name is invalid, not found, fails to load,
                        or configuration is missing/incorrect.
            FileNotFoundError: If the atom's implementation file cannot be found.
            ImportError: If the atom's module cannot be imported.
            AttributeError: If the specified entry_point function doesn't exist.
        """
        # 1. Check Cache first for performance
        if atom_name in self.loaded_atoms_cache:
            logger.debug(f"Returning cached atom: {atom_name}")
            return self.loaded_atoms_cache[atom_name]

        # 2. Validate Registry and Atom Existence
        if not self.registry:
             logger.error("Atom registry is empty or failed to load. Cannot get atom.")
             raise ValueError("Atom registry is not available.")
        if atom_name not in self.registry:
            logger.error(f"Atom '{atom_name}' not found in registry.")
            raise ValueError(f"Atom '{atom_name}' not found in registry.")

        # 3. Get Atom Configuration
        config = self.registry[atom_name]
        atom_type = config.get('type')
        relative_path = config.get('path')
        entry_point = config.get('entry_point') # Relevant for python_function

        # Validate configuration details
        if not atom_type:
             raise ValueError(f"Atom type missing for '{atom_name}' in registry.")
        if not relative_path:
             raise ValueError(f"Path missing for atom '{atom_name}' in registry.")
        if not AEON_ROOT: # Check if path setup failed earlier
             raise ValueError("AEON project root path could not be determined.")

        # Construct the absolute path to the atom's implementation file
        absolute_path = os.path.normpath(os.path.join(AEON_ROOT, relative_path))

        logger.info(f"Loading atom '{atom_name}' (Type: {atom_type}, Path: {absolute_path})")

        # 4. Load Atom based on its Type
        try:
            atom_callable = None

            # --- Python Function Loader ---
            if atom_type == 'python_function':
                if not entry_point:
                    raise ValueError(f"Entry point ('entry_point') required but not defined for python_function atom: {atom_name}")
                if not os.path.exists(absolute_path):
                     # Raise FileNotFoundError explicitly if the file is missing
                     raise FileNotFoundError(f"Python file for atom '{atom_name}' not found at expected path: {absolute_path}")

                # Dynamically import the module using importlib for safety and flexibility
                try:
                    # Create a reasonably unique module name based on path
                    module_identifier = relative_path.replace('/', '.').replace('\\', '.').replace('.py', '')
                    module_name = f"aeon_project.dynamic_atoms.{module_identifier}"

                    spec = importlib.util.spec_from_file_location(module_name, absolute_path)
                    if spec is None or spec.loader is None:
                        # Check if spec or loader is None
                        raise ImportError(f"Could not create module spec/loader for path: {absolute_path}")

                    module = importlib.util.module_from_spec(spec)
                    # Add module to sys.modules BEFORE execution for potential relative imports within atom
                    sys.modules[module_name] = module
                    spec.loader.exec_module(module) # Execute module's code
                    logger.debug(f"Successfully executed module: {absolute_path}")

                    # Get the function specified as the entry point
                    if not hasattr(module, entry_point):
                        raise AttributeError(f"Function '{entry_point}' not found in module {absolute_path}. Check registry and atom file.")

                    atom_callable = getattr(module, entry_point)
                    logger.debug(f"Successfully retrieved function '{entry_point}' from module.")

                except ImportError as e:
                     logger.error(f"Import error while loading module for atom '{atom_name}' from {absolute_path}: {e}", exc_info=True)
                     raise # Re-raise ImportError
                except AttributeError as e:
                     logger.error(f"Attribute error loading function '{entry_point}' for atom '{atom_name}' from {absolute_path}: {e}", exc_info=True)
                     raise # Re-raise AttributeError

            # --- Placeholder for ML Model Loaders ---
            # elif atom_type == 'tflite':
            #     if not os.path.exists(absolute_path):
            #          raise FileNotFoundError(f"TFLite model file for atom '{atom_name}' not found at: {absolute_path}")
            #     # ... (Implementation using tflite_runtime.Interpreter) ...
            #     # Example structure:
            #     # interpreter = tflite.Interpreter(model_path=absolute_path)
            #     # interpreter.allocate_tensors()
            #     # input_details = interpreter.get_input_details()
            #     # output_details = interpreter.get_output_details()
            #     # def tflite_caller(input_data):
            #     #     # Preprocess input_data -> model_input
            #     #     interpreter.set_tensor(input_details[0]['index'], model_input)
            #     #     interpreter.invoke()
            #     #     model_output = interpreter.get_tensor(output_details[0]['index'])
            #     #     # Postprocess model_output -> final_result
            #     #     return final_result
            #     # atom_callable = tflite_caller
            #     logger.warning(f"Loading for atom type '{atom_type}' not yet implemented.")
            #     pass # Replace with actual implementation

            # elif atom_type == 'onnx':
            #     if not os.path.exists(absolute_path):
            #          raise FileNotFoundError(f"ONNX model file for atom '{atom_name}' not found at: {absolute_path}")
            #     # ... (Implementation using onnxruntime.InferenceSession) ...
            #     logger.warning(f"Loading for atom type '{atom_type}' not yet implemented.")
            #     pass # Replace with actual implementation

            # elif atom_type == 'sklearn':
            #     if not os.path.exists(absolute_path):
            #          raise FileNotFoundError(f"Scikit-learn model file for atom '{atom_name}' not found at: {absolute_path}")
            #     # ... (Implementation using joblib.load or pickle.load) ...
            #     logger.warning(f"Loading for atom type '{atom_type}' not yet implemented.")
            #     pass # Replace with actual implementation
            # -----------------------------------------

            else:
                # Handle unsupported atom types defined in the registry
                logger.error(f"Unsupported atom type '{atom_type}' defined for atom: {atom_name}")
                raise ValueError(f"Unsupported atom type '{atom_type}' for atom: {atom_name}")

            # 5. Cache and Return successful load
            if atom_callable:
                self.loaded_atoms_cache[atom_name] = atom_callable
                logger.info(f"Atom '{atom_name}' loaded and cached successfully.")
                return atom_callable
            else:
                # Should ideally not be reached if specific loaders raise errors
                logger.error(f"Failed to create callable for atom '{atom_name}' - Unknown loader issue.")
                raise ValueError(f"Failed to create callable for atom: {atom_name}")

        # More Specific Error Handling during loading process
        except FileNotFoundError as e:
            # Log specific file not found errors clearly
            logger.error(f"File not found during loading of atom '{atom_name}': {e}", exc_info=False) # No need for full traceback here
            raise # Re-raise FileNotFoundError
        except (ImportError, AttributeError, ValueError) as e:
            # Catch specific configuration or loading errors and re-raise
            logger.error(f"Configuration or load error for atom '{atom_name}': {e}", exc_info=True)
            raise # Re-raise the specific error (ValueError, ImportError, AttributeError)
        except Exception as e:
            # Catch any other unexpected errors during the loading phase
            logger.error(f"An unexpected error occurred loading atom '{atom_name}': {e}", exc_info=True)
            # Wrap unexpected errors in a ValueError for consistent handling upstream
            raise ValueError(f"Failed to load atom {atom_name} due to unexpected error: {e}")


    def reload_registry(self):
        """Clears the atom cache and reloads the registry file. Useful during development."""
        logger.warning("Reloading atom registry and clearing atom cache...")
        self.loaded_atoms_cache = {} # Clear the cache
        self._load_registry() # Reload registry data
        logger.info("Registry reloaded. Cache cleared.")


# --- Singleton Instance ---
# This code runs *once* when the loader module is first imported.
# It creates a single, shared instance of the AtomLoader.
try:
    # Create the instance immediately
    atom_loader_instance = AtomLoader()
except Exception as e:
    # Log critical failure if the loader itself cannot initialize (e.g., path errors)
    # Use the logger defined at the top of the file
    logger.critical(f"CRITICAL: Failed to initialize AtomLoader singleton instance: {e}", exc_info=True)
    atom_loader_instance = None # Set to None to indicate failure


# --- Example Usage Block (for testing loader.py directly) ---
if __name__ == '__main__':
    # Configure basic logging ONLY when running this file directly.
    # Set level to DEBUG to see all messages, including caching hits.
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger.info("="*30)
    logger.info("Running Atom Loader Standalone Test")
    logger.info("="*30)

    # Check if the singleton instance was created successfully
    if not atom_loader_instance:
        logger.error("Atom Loader instance (atom_loader_instance) failed to initialize during import. Cannot run tests.")
        exit(1) # Exit script with an error code

    # --- Test Case 1: Load and Execute Valid Atom ---
    atom_name_to_test = "example_string_upper"
    logger.info(f"\n--- Test Case 1: Load & Execute '{atom_name_to_test}' ---")
    try:
        logger.info(f"Attempting to load atom via get_atom...")
        uppercase_atom = atom_loader_instance.get_atom(atom_name_to_test)
        logger.info(f"Successfully loaded atom '{atom_name_to_test}'. Type: {type(uppercase_atom)}")

        # Test execution
        test_input_1 = "standalone loader test string"
        logger.info(f"Executing atom with input: {repr(test_input_1)}")
        output_1 = uppercase_atom(test_input_1) # Call the loaded function
        logger.info(f"Atom returned output: {repr(output_1)}")

        # Verify output
        expected_output_1 = "STANDALONE LOADER TEST STRING"
        if output_1 == expected_output_1:
             logger.info("Execution Test PASSED.")
        else:
             logger.error(f"Execution Test FAILED. Expected: {repr(expected_output_1)}, Got: {repr(output_1)}")

    except (ValueError, FileNotFoundError, ImportError, AttributeError) as e:
        logger.error(f"Error getting or executing atom '{atom_name_to_test}': {e}", exc_info=True)
    except Exception as e:
        logger.error(f"An unexpected error occurred during Test Case 1: {e}", exc_info=True)

    # --- Test Case 2: Test Caching ---
    logger.info(f"\n--- Test Case 2: Caching for '{atom_name_to_test}' ---")
    try:
        logger.info("Requesting atom again (should hit cache)...")
        # Call get_atom again for the same atom
        uppercase_atom_cached = atom_loader_instance.get_atom(atom_name_to_test)
        # Check if the returned object is the exact same object in memory
        if 'uppercase_atom' in locals() and uppercase_atom is uppercase_atom_cached:
             logger.info("Atom instance was retrieved from cache (same object returned). Caching Test PASSED.")
        else:
             logger.error("Atom instance was NOT cached or initial load failed. Caching Test FAILED.")
    except Exception as e:
        logger.error(f"An unexpected error occurred during Caching Test: {e}", exc_info=True)

    # --- Test Case 3: Test Non-existent Atom ---
    non_existent_atom = "this_atom_does_not_exist"
    logger.info(f"\n--- Test Case 3: Non-existent Atom '{non_existent_atom}' ---")
    try:
        logger.info("Attempting to load non-existent atom...")
        atom_loader_instance.get_atom(non_existent_atom)
        # If get_atom doesn't raise an error, it's a failure
        logger.error(f"Expected ValueError for non-existent atom '{non_existent_atom}', but no error was raised. Test FAILED.")
    except ValueError as e:
        # This is the expected outcome
        logger.info(f"Successfully caught expected ValueError for non-existent atom: {e}. Test PASSED.")
    except Exception as e:
        # Catch any other unexpected errors during this test
        logger.error(f"Caught unexpected error while testing non-existent atom: {e}", exc_info=True)
        logger.error("Test FAILED.")

    # --- End of Tests ---
    logger.info("\n" + "="*30)
    logger.info("Atom Loader standalone test finished.")
    logger.info("="*30)