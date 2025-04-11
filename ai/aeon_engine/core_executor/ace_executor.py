# --- File: aeon_engine/core_executor/ace_executor.py ---

import logging
import time
import re # For basic template substitution
import os
import json
import sqlite3 # To catch specific DB errors if needed
import ast # For safely evaluating params list/tuple strings

# --- Import AEON Components ---
# Assumes standard project structure relative to aeon_engine root
try:
    from axiom_vault.av_manager import av_instance # Import the singleton AV instance
    from cognitive_atoms.atom_runtime.loader import atom_loader_instance # Import the singleton Loader instance
    from cognitive_blueprints.parser import load_and_compile_blueprint, CompiledBlueprint # Import loading function and class
except ImportError as e:
     # Basic logging config in case imports fail early
     logging.basicConfig(level=logging.CRITICAL)
     logging.getLogger(__name__).critical(f"CRITICAL ERROR: Failed to import AEON components: {e}. Check sys.path and file locations.", exc_info=True)
     # Set instances to None so checks later will fail gracefully
     av_instance = None
     atom_loader_instance = None
     load_and_compile_blueprint = None
     CompiledBlueprint = None
except Exception as e:
     logging.basicConfig(level=logging.CRITICAL)
     logging.getLogger(__name__).critical(f"CRITICAL ERROR: Unexpected error during AEON component import: {e}", exc_info=True)
     av_instance = None
     atom_loader_instance = None
     load_and_compile_blueprint = None
     CompiledBlueprint = None


# Configure logger for the ACE
logger = logging.getLogger(__name__)
# Set level via environment variable or config file later
# logger.setLevel(logging.DEBUG)

# --- Basic Template Substitution ---
TEMPLATE_PATTERN = re.compile(r"\{\{(.+?)\}\}")

def substitute_template(template_string: str, context: dict):
    """
    Substitutes placeholders like {{node_id.source.variable}} in a string
    using the provided execution context. Handles basic nesting.

    Args:
        template_string (str): The string containing placeholders.
        context (dict): The execution context dictionary. Structure:
                        { 'start_input': { ... }, 'node_outputs': { 'node_id': output, ... } }

    Returns:
        str: The string with placeholders replaced by values from the context.
    """
    if not isinstance(template_string, str):
        return template_string # Return non-strings as-is

    def replace_match(match):
        placeholder = match.group(0) # e.g., {{start.input.my_var}}
        expression = match.group(1).strip() # e.g., start.input.my_var
        parts = expression.split('.')

        value = None
        found = False
        current_val = None

        try:
            if len(parts) >= 2:
                source_id = parts[0]
                source_type = parts[1] # 'input' or 'output_var'

                if source_id == 'start' and source_type == 'input' and 'start_input' in context:
                    current_val = context['start_input']
                    # Navigate through potential nested keys starting from index 2
                    for part in parts[2:]:
                        if isinstance(current_val, dict):
                            current_val = current_val.get(part)
                        elif isinstance(current_val, (list, tuple)) and part.isdigit():
                             try: current_val = current_val[int(part)]
                             except IndexError: current_val = None
                        else: current_val = None
                        if current_val is None: break
                    value = current_val
                    # We consider 'found' true if the initial source exists,
                    # even if nested access yields None. Allows templating None values.
                    found = True

                elif source_type == 'output_var' and 'node_outputs' in context and source_id in context['node_outputs']:
                    current_val = context['node_outputs'][source_id]
                     # Navigate through potential nested keys starting from index 2
                    for part in parts[2:]:
                        if isinstance(current_val, dict):
                            current_val = current_val.get(part)
                        elif isinstance(current_val, (list, tuple)) and part.isdigit():
                             try: current_val = current_val[int(part)]
                             except IndexError: current_val = None
                        else: current_val = None
                        if current_val is None: break
                    value = current_val
                    found = True

            if found:
                 # Handle conversion to string for template insertion
                 if value is None: return "None"
                 # Safely convert dicts/lists to JSON strings for embedding in larger strings
                 elif isinstance(value, (dict, list, tuple)):
                      try: return json.dumps(value)
                      except TypeError: return str(value) # Fallback
                 else: return str(value)
            else:
                logger.warning(f"Placeholder '{placeholder}' could not be resolved in context.")
                return placeholder # Return placeholder itself if not found

        except Exception as e:
             logger.error(f"Error resolving placeholder '{placeholder}': {e}", exc_info=True)
             return placeholder # Return placeholder on error

    # Use re.sub with the replace_match function
    try:
         resolved_string = TEMPLATE_PATTERN.sub(replace_match, template_string)
         return resolved_string
    except Exception as e:
         logger.error(f"Error during template substitution for: {template_string}: {e}", exc_info=True)
         return template_string # Return original on substitution error


class ACE:
    """
    AEON Core Executor: Executes compiled Cognitive Blueprints.
    Orchestrates calls to the Axiom Vault and Cognitive Atoms.
    """

    def __init__(self):
        """Initializes the ACE, ensuring required components are available."""
        logger.info("Initializing AEON Core Executor (ACE)...")
        if not av_instance:
            logger.critical("ACE Init Failed: Axiom Vault (av_instance) unavailable.")
            raise RuntimeError("Axiom Vault instance is missing.")
        if not atom_loader_instance:
            logger.critical("ACE Init Failed: Atom Loader (atom_loader_instance) unavailable.")
            raise RuntimeError("Atom Loader instance is missing.")
        if not load_and_compile_blueprint or not CompiledBlueprint:
             logger.critical("ACE Init Failed: Blueprint components unavailable.")
             raise RuntimeError("Blueprint loading components missing.")

        self.av = av_instance
        self.atom_loader = atom_loader_instance
        self.load_blueprint = load_and_compile_blueprint
        logger.info("ACE Initialized successfully.")

    def _resolve_input(self, input_template, context):
        """Resolves input templates (str or dict) using context."""
        if isinstance(input_template, str):
            resolved_input_str = substitute_template(input_template, context)
            try:
                # Attempt to parse if it looks like JSON (handles lists/dicts passed as strings)
                return json.loads(resolved_input_str)
            except (json.JSONDecodeError, TypeError):
                return resolved_input_str # Return as plain string
        elif isinstance(input_template, dict):
            # Resolve templates within dictionary values
            resolved_dict = {}
            for key, template_val in input_template.items():
                 # Recursively resolve nested templates if template_val is complex? For now, just str conversion.
                 resolved_dict[key] = substitute_template(str(template_val), context)
                 # Attempt to parse sub-values if they look like JSON/numbers/bools etc.
                 try:
                      resolved_dict[key] = json.loads(resolved_dict[key])
                 except (json.JSONDecodeError, TypeError):
                      # Try converting to int/float if possible
                      try: resolved_dict[key] = int(resolved_dict[key])
                      except ValueError:
                           try: resolved_dict[key] = float(resolved_dict[key])
                           except ValueError: pass # Keep as string if conversions fail
            return resolved_dict
        elif input_template is not None:
            return input_template # Return static values as-is
        else:
            return None # No input defined

    def execute_blueprint(self, blueprint_name_or_path: str, initial_input: dict):
        """
        Loads, compiles (if needed), and executes a Cognitive Blueprint.

        Args:
            blueprint_name_or_path (str): Name or path of the blueprint YAML.
            initial_input (dict): Data for the blueprint's 'start' node.

        Returns:
            any: Final output from the blueprint's 'end' logic, or None on failure.
        """
        try:
            # 1. Load and Compile Blueprint
            blueprint = self.load_blueprint(blueprint_name_or_path) # Can raise FileNotFoundError, YAMLError, ValueError
            logger.info(f"Starting execution of Blueprint: {blueprint.name}")

            # 2. Initialize Execution Context
            execution_context = {
                'start_input': initial_input if initial_input else {},
                'node_outputs': {}
            }
            current_node_id = blueprint.start_node_id
            max_steps = 100 # Safety limit
            step_count = 0
            execution_log = [] # Optional detailed trace

            # 3. Execution Loop
            while current_node_id != blueprint.end_node_id and step_count < max_steps:
                step_count += 1
                node = blueprint.get_node(current_node_id) # Uses CompiledBlueprint method

                if not node:
                    log_msg = f"Execution Error: Node ID '{current_node_id}' referenced but not found in blueprint '{blueprint.name}'. Aborting."
                    logger.error(log_msg)
                    execution_log.append({"error": log_msg})
                    raise ValueError(log_msg)

                node_id = node.id
                action = node.action
                start_time = time.monotonic()
                logger.debug(f"Step {step_count}: Executing node '{node_id}' (Action: {action})")
                execution_log.append({"step": step_count, "node_id": node_id, "action": action})

                output = None
                next_node_id = node.next_node_id # Default next node

                # --- Action Dispatching ---
                try:
                    if action == 'Start':
                        logger.debug("Executing Start node.")
                        output = execution_context['start_input']

                    elif action == 'Activate_Atom':
                        atom_name = node.atom_name
                        if not atom_name:
                            raise ValueError(f"Node '{node_id}': 'atom_name' required for 'Activate_Atom'.")

                        atom_func = self.atom_loader.get_atom(atom_name) # Can raise errors
                        atom_input_template = node.input_template
                        atom_input = self._resolve_input(atom_input_template, execution_context)

                        logger.info(f"Calling Atom '{atom_name}'...")
                        logger.debug(f"Atom Input: {str(atom_input)[:100]}...") # Log resolved input preview
                        output = atom_func(atom_input) # Execute the atom
                        logger.info(f"Atom '{atom_name}' returned.")
                        logger.debug(f"Atom Output: {str(output)[:100]}...") # Log output preview

                        # Check convention for Atom errors
                        if isinstance(output, str) and output.startswith("Error:"):
                             log_msg = f"Atom '{atom_name}' returned an error: {output}"
                             logger.error(log_msg)
                             raise RuntimeError(log_msg) # Stop execution on Atom error

                    # --- <<< NEW AV QUERY LOGIC >>> ---
                    elif action == 'AV_Query':
                        query_type = node.definition.get('query_type')
                        if not query_type:
                            raise ValueError(f"Node '{node_id}': 'query_type' ('vector' or 'structured') required for 'AV_Query'.")

                        if query_type == 'vector':
                            query_text_template = node.definition.get('query_text')
                            k_template = node.definition.get('k', 5)
                            filter_template = node.definition.get('filter') # Optional filter dict template
                            if not query_text_template:
                                 raise ValueError(f"Node '{node_id}': 'query_text' required for AV vector query.")

                            # Resolve inputs using template engine
                            query_text = substitute_template(str(query_text_template), execution_context)
                            k = int(substitute_template(str(k_template), execution_context))
                            filter_criteria = self._resolve_input(filter_template, execution_context) if filter_template else None
                            if filter_criteria is not None and not isinstance(filter_criteria, dict):
                                 logger.warning(f"Node '{node_id}': Resolved 'filter' is not a dictionary, ignoring. Value: {filter_criteria}")
                                 filter_criteria = None

                            logger.info(f"Querying AV (Vector): '{query_text[:50]}...', k={k}, filter={filter_criteria}")
                            output = self.av.query_vector_index(query_text, k=k, filter_criteria=filter_criteria)

                        elif query_type == 'structured':
                            query_template = node.definition.get('query') # The SQL query string itself
                            params_template = node.definition.get('params', '[]') # Expects a string representation of a list/tuple
                            if not query_template:
                                 raise ValueError(f"Node '{node_id}': 'query' required for AV structured query.")

                            # Resolve SQL query string and parameters
                            query = substitute_template(query_template, execution_context)
                            params_str = substitute_template(str(params_template), execution_context)

                            # Safely evaluate the params string into a tuple
                            try:
                                 evaluated_params = ast.literal_eval(params_str)
                                 if not isinstance(evaluated_params, (list, tuple)):
                                     raise ValueError("Params template did not resolve to a list or tuple.")
                                 params = tuple(evaluated_params)
                            except (ValueError, SyntaxError, TypeError) as e:
                                 logger.error(f"Invalid 'params' format for AV structured query node {node_id}. Expected string representation of list/tuple. Got: '{params_str}'. Error: {e}")
                                 raise ValueError(f"Invalid params format for structured query node {node_id}.")

                            logger.info(f"Querying AV (Structured): '{query[:50]}...', params={params}")
                            output = self.av.query_structured(query, params)

                        else:
                            raise ValueError(f"Node '{node_id}': Unsupported AV 'query_type': {query_type}")
                    # --- <<< END AV QUERY LOGIC >>> ---

                    elif action == 'Logic_Gate':
                        # ... (Logic Gate implementation - same as before, ensure substitute_template is robust) ...
                        condition_template = node.definition.get('if')
                        then_node = node.definition.get('then')
                        else_node = node.definition.get('else', node.next_node_id)
                        if not condition_template or not then_node:
                            raise ValueError(f"Node '{node_id}': 'if' and 'then' required for 'Logic_Gate'.")

                        condition_str = substitute_template(condition_template, execution_context)
                        try:
                            # Limited eval context for safety
                            eval_context = {**execution_context.get('node_outputs', {}), **execution_context.get('start_input', {})}
                            # Add common safe builtins if needed: 'len', 'str', 'int', 'float', 'True', 'False', 'None'
                            safe_builtins = {'True': True, 'False': False, 'None': None, 'len': len, 'str': str, 'int': int, 'float': float}
                            condition_met = eval(condition_str, {"__builtins__": safe_builtins}, eval_context)
                            logger.debug(f"Evaluated condition '{condition_str}' -> {condition_met}")
                        except Exception as e:
                            logger.error(f"Error evaluating condition '{condition_str}' in node {node_id}: {e}")
                            raise RuntimeError(f"Error evaluating condition in node {node_id}")

                        next_node_id = then_node if condition_met else else_node
                        logger.debug(f"Condition {'TRUE' if condition_met else 'FALSE'}, branching to node '{next_node_id}'")


                    elif action == 'Execute_Sub_Blueprint':
                        # ... (Execute Sub-Blueprint implementation - same as before) ...
                         sub_blueprint_template = node.definition.get('blueprint_name')
                         sub_input_template = node.definition.get('input', {})
                         if not sub_blueprint_template: raise ValueError(f"Node '{node_id}': 'blueprint_name' required.")

                         sub_blueprint_name = substitute_template(sub_blueprint_template, execution_context)
                         sub_input = self._resolve_input(sub_input_template, execution_context)

                         logger.info(f"Executing Sub-Blueprint '{sub_blueprint_name}'...")
                         output = self.execute_blueprint(sub_blueprint_name, sub_input) # Recursive call
                         logger.info(f"Sub-Blueprint '{sub_blueprint_name}' finished.")


                    elif action == 'User_Query_Point':
                        # ... (User Query Point implementation - same as before) ...
                        prompt_template = node.definition.get('prompt', 'Input required.')
                        prompt = substitute_template(prompt_template, execution_context)
                        feedback_id = f"feedback_{blueprint.name}_{node_id}_{int(time.time()*1000)}"
                        log_msg = f"USER FEEDBACK REQUIRED (ID: {feedback_id}): {prompt}"
                        logger.info(log_msg)
                        execution_log.append({"feedback_request": log_msg})
                        output = {"status": "feedback_required", "feedback_id": feedback_id, "prompt": prompt}
                        # Execution typically pauses here in a real system


                    elif action == 'Combine_Outputs':
                        # ... (Combine Outputs implementation - same as before) ...
                         inputs_template = node.definition.get('inputs', [])
                         separator = substitute_template(node.definition.get('separator', '\n'), execution_context)
                         combined = []
                         if isinstance(inputs_template, list):
                              for item_template in inputs_template:
                                   resolved_item = self._resolve_input(item_template, execution_context) # Use resolve_input
                                   combined.append(str(resolved_item)) # Ensure string conversion
                              output = separator.join(combined)
                         else:
                              logger.warning(f"Node '{node_id}': 'inputs' for Combine_Outputs should be a list.")
                              output = ""


                    elif action == 'End':
                        logger.debug("Reached End node.")
                        # Break immediately, no further processing needed for this node
                        break

                    else:
                        logger.warning(f"Node '{node_id}': Unknown action type '{action}'. Skipping node.")
                        output = None # Ensure output is None for skipped nodes

                    # --- Store Node Output ---
                    output_var_name = node.output_variable
                    if output_var_name:
                        execution_context['node_outputs'][node_id] = output
                        logger.debug(f"Stored output for node '{node_id}' in var '{output_var_name}'. Preview: {str(output)[:100] if output else 'None'}")

                except Exception as node_error:
                     log_msg = f"Execution Error at node '{node_id}' (Action: {action}) in blueprint '{blueprint.name}': {node_error}"
                     logger.error(log_msg, exc_info=True)
                     execution_log.append({"error": log_msg, "traceback": traceback.format_exc()}) # Add traceback for debugging
                     raise RuntimeError(log_msg) from node_error

                # --- Log Node Duration ---
                end_time = time.monotonic()
                duration_ms = (end_time - start_time) * 1000
                log_entry = { "blueprint": blueprint.name, "step": step_count, "node_id": node_id, "action": action, "duration_ms": round(duration_ms, 2) }
                logger.info(f"Node '{node_id}' completed in {duration_ms:.2f} ms.")
                # Add structured logging here for OLI if using file handlers etc.

                # --- Advance to Next Node ---
                # next_node_id might have been changed by Logic_Gate
                current_node_id = next_node_id

            # 4. Handle Loop Exit
            if current_node_id == blueprint.end_node_id:
                logger.info(f"Blueprint '{blueprint.name}' finished successfully at node '{blueprint.end_node_id}'.")
                # Determine final output using convention (last node's output before 'end')
                final_output = None
                last_node_id_before_end = execution_log[-1]['node_id'] if execution_log and current_node_id == blueprint.end_node_id else None
                if last_node_id_before_end:
                     final_output = execution_context['node_outputs'].get(last_node_id_before_end)
                     logger.debug(f"Using output from last node '{last_node_id_before_end}' as final result.")
                else:
                     logger.warning("Could not determine final output node.")
                return final_output

            elif step_count >= max_steps:
                log_msg = f"Execution Error: Blueprint '{blueprint.name}' exceeded max steps ({max_steps}). Aborting."
                logger.error(log_msg)
                execution_log.append({"error": log_msg})
                raise RuntimeError(log_msg)
            else:
                 # This might happen if a node's 'next' points to a non-existent ID or validation failed
                 log_msg = f"Execution Error: Blueprint '{blueprint.name}' stopped unexpectedly at node '{current_node_id}' before reaching end."
                 logger.error(log_msg)
                 execution_log.append({"error": log_msg})
                 raise RuntimeError(log_msg)

        # Catch errors from blueprint loading/parsing
        except (FileNotFoundError, yaml.YAMLError, ValueError) as load_error:
             logger.error(f"Failed to load/validate blueprint '{blueprint_name_or_path}': {load_error}", exc_info=True)
             raise # Re-raise specific load errors
        # Catch errors deliberately raised during execution
        except RuntimeError as exec_error:
             logger.error(f"Runtime error during blueprint execution: {exec_error}", exc_info=False)
             raise # Re-raise runtime errors
        # Catch any other totally unexpected errors
        except Exception as e:
             logger.critical(f"Unexpected critical error during ACE execution: {e}", exc_info=True)
             raise RuntimeError(f"Unexpected ACE error: {e}") from e


# --- Singleton Instance ---
try:
    # Ensure logging is configured before initializing ACE if imports failed above
    if ace_instance is None:
        logging.basicConfig(level=logging.CRITICAL) # Minimal logging
        logger = logging.getLogger(__name__)
    # Initialize ACE (will raise RuntimeError if components are missing)
    ace_instance = ACE()
except Exception as e:
    # Logger might not be fully configured if imports failed very early
    print(f"CRITICAL: Failed to initialize ACE singleton instance in core_executor: {e}")
    ace_instance = None


# --- Example Usage (for testing this module directly) ---
if __name__ == '__main__':
    # Configure basic logging for direct test run
    # Set level to INFO or DEBUG for more detail
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger = logging.getLogger(__name__) # Ensure logger is defined for this block

    logger.info("="*30)
    logger.info("Running ACE Standalone Test (With AV Query Capability)")
    logger.info("="*30)

    if not ace_instance:
        logger.error("ACE instance (ace_instance) failed to initialize. Cannot run tests.")
        exit(1)

    # --- Test Case 1: Execute the Simple Uppercase Blueprint (from Step 5 test) ---
    blueprint_to_test_1 = 'simple_uppercase_blueprint'
    test_input_data_1 = {'text_to_convert': 'testing uppercase via ace'}
    logger.info(f"\n--- Test Case 1: Execute Blueprint '{blueprint_to_test_1}' ---")
    logger.info(f"Input Data: {test_input_data_1}")

    try:
        final_result_1 = ace_instance.execute_blueprint(blueprint_to_test_1, test_input_data_1)
        logger.info(f"Blueprint 1 execution finished.")
        logger.info(f"Final Result 1: {repr(final_result_1)}")
        expected_result_1 = 'TESTING UPPERCASE VIA ACE'
        if final_result_1 == expected_result_1: logger.info("Test Case 1 PASSED.")
        else: logger.error(f"Test Case 1 FAILED. Expected: {repr(expected_result_1)}, Got: {repr(final_result_1)}")
    except Exception as e:
        logger.error(f"Test Case 1 FAILED with error: {e}", exc_info=True)


    # --- Test Case 2: Blueprint with AV Query (Needs a new blueprint defined) ---
    # We will define 'query_av_blueprint.yaml' in Step 9
    # For now, we just show how the test would look
    blueprint_to_test_2 = 'query_av_blueprint' # Assumes this file will exist later
    test_input_data_2 = {'search_term': 'python best practice'}
    logger.info(f"\n--- Test Case 2: Execute Blueprint '{blueprint_to_test_2}' (Requires Blueprint Definition) ---")
    logger.info(f"Input Data: {test_input_data_2}")

    # Check if the blueprint file exists before trying to run it in the test
    from cognitive_blueprints.parser import DEFINITIONS_DIR # Import from parser
    test_bp2_path = os.path.join(DEFINITIONS_DIR, f"{blueprint_to_test_2}.yaml")
    if os.path.exists(test_bp2_path):
        try:
            final_result_2 = ace_instance.execute_blueprint(blueprint_to_test_2, test_input_data_2)
            logger.info(f"Blueprint 2 execution finished.")
            logger.info(f"Final Result 2 (Structure depends on blueprint): {repr(final_result_2)}")
            # Add assertions here later based on expected output of query_av_blueprint
            logger.info("Test Case 2 PASSED (Executed).")
        except Exception as e:
            logger.error(f"Test Case 2 FAILED with error during execution: {e}", exc_info=True)
    else:
        logger.warning(f"Skipping Test Case 2: Blueprint definition '{test_bp2_path}' not found. Define it in Step 9.")


    # --- End of Tests ---
    logger.info("\n" + "="*30)
    logger.info("ACE standalone test finished.")
    logger.info("="*30)

    # Make sure AV connection is closed if running standalone
    if av_instance:
        av_instance.close()