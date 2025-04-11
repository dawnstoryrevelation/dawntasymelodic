# --- File: aeon_engine/core_executor/ace_executor.py ---

import logging
import time
import re # For basic template substitution
import os # For path joining if needed later
import json # For handling potential JSON inputs/outputs if atoms return them

# --- Import AEON Components ---
# Assumes this file is in core_executor/ and others are in sibling directories
# Adjust imports based on your exact project structure if it differs
# Use absolute imports relative to the aeon_engine root (assuming it's in sys.path)
try:
    from axiom_vault.av_manager import av_instance # Import the singleton AV instance
    from cognitive_atoms.atom_runtime.loader import atom_loader_instance # Import the singleton Loader instance
    from cognitive_blueprints.parser import load_and_compile_blueprint, CompiledBlueprint # Import loading function and class
except ImportError as e:
     # Log critical error if components can't be imported - paths might be wrong
     logging.getLogger(__name__).critical(f"CRITICAL ERROR: Failed to import AEON components: {e}. Check sys.path and file locations.", exc_info=True)
     # Set instances to None so checks later will fail gracefully
     av_instance = None
     atom_loader_instance = None
     load_and_compile_blueprint = None
     CompiledBlueprint = None # Need to handle this potentially being None too


# Configure logger for the ACE
logger = logging.getLogger(__name__)
# logger.setLevel(logging.DEBUG) # Set level for detailed execution tracing

# --- Basic Template Substitution ---
# A simple regex-based substitution. For complex logic, consider Jinja2.
TEMPLATE_PATTERN = re.compile(r"\{\{(.+?)\}\}")

def substitute_template(template_string: str, context: dict):
    """
    Substitutes placeholders like {{node_id.source.variable}} in a string
    using the provided execution context.

    Args:
        template_string (str): The string containing placeholders.
        context (dict): The execution context dictionary holding node outputs
                        and the initial blueprint input. Expected structure:
                        {
                            'start_input': { ... initial data ... },
                            'node_outputs': { 'node_id': output_value, ... }
                        }

    Returns:
        str: The string with placeholders replaced by values from the context.
             Returns the original string if no placeholders are found.
             Returns placeholder string itself if value not found (logs warning).
    """
    if not isinstance(template_string, str):
        return template_string # Return non-strings as-is

    def replace_match(match):
        placeholder = match.group(0) # The full {{...}}
        expression = match.group(1).strip() # The content inside {{...}}
        parts = expression.split('.')

        value = None
        found = False

        try:
            if len(parts) >= 2:
                source_id = parts[0]
                source_type = parts[1] # e.g., 'input', 'output_var'

                if source_id == 'start' and source_type == 'input' and 'start_input' in context:
                    # Access initial blueprint input: {{start.input.var_name}}
                    current_val = context['start_input']
                    for part in parts[2:]: # Access nested keys if any: a.b.c
                        if isinstance(current_val, dict):
                             current_val = current_val.get(part)
                        else:
                             current_val = None # Cannot access key on non-dict
                        if current_val is None: break
                    value = current_val
                    found = value is not None

                elif source_type == 'output_var' and 'node_outputs' in context and source_id in context['node_outputs']:
                    # Access output of a previous node: {{node_id.output_var}}
                    # Or nested output: {{node_id.output_var.key.index}}
                    current_val = context['node_outputs'][source_id]
                    for part in parts[2:]:
                        if isinstance(current_val, dict):
                            current_val = current_val.get(part)
                        elif isinstance(current_val, (list, tuple)) and part.isdigit():
                            try:
                                current_val = current_val[int(part)]
                            except IndexError:
                                current_val = None
                        else:
                            current_val = None
                        if current_val is None: break
                    value = current_val
                    found = True # We found the node output, even if nested value is None/missing

            if found:
                 # Convert non-string values for insertion into the string template
                 # Handle None explicitly
                 if value is None:
                      return "None" # Or "" or raise error? Consistent handling is key.
                 elif isinstance(value, (dict, list, tuple)):
                      # Represent complex types as JSON string in the template?
                      try:
                           return json.dumps(value)
                      except TypeError:
                           return str(value) # Fallback to string representation
                 else:
                      return str(value)
            else:
                logger.warning(f"Placeholder '{placeholder}' could not be resolved in context.")
                return placeholder # Return the placeholder itself if value not found

        except Exception as e:
             logger.error(f"Error resolving placeholder '{placeholder}': {e}", exc_info=True)
             return placeholder # Return placeholder on error


    return TEMPLATE_PATTERN.sub(replace_match, template_string)


class ACE:
    """
    AEON Core Executor: Executes compiled Cognitive Blueprints.
    Orchestrates calls to the Axiom Vault and Cognitive Atoms.
    """

    def __init__(self):
        """Initializes the ACE, ensuring required components are available."""
        logger.info("Initializing AEON Core Executor (ACE)...")
        # Check if singleton instances were loaded correctly
        if not av_instance:
            logger.critical("ACE Initialization Failed: Axiom Vault (av_instance) is not available.")
            raise RuntimeError("Axiom Vault instance is missing.")
        if not atom_loader_instance:
            logger.critical("ACE Initialization Failed: Atom Loader (atom_loader_instance) is not available.")
            raise RuntimeError("Atom Loader instance is missing.")
        if not load_and_compile_blueprint or not CompiledBlueprint:
             logger.critical("ACE Initialization Failed: Blueprint loading components are not available.")
             raise RuntimeError("Blueprint loading components are missing.")

        self.av = av_instance
        self.atom_loader = atom_loader_instance
        self.load_blueprint = load_and_compile_blueprint
        logger.info("ACE Initialized successfully.")

    def execute_blueprint(self, blueprint_name_or_path: str, initial_input: dict):
        """
        Loads, compiles (if needed), and executes a Cognitive Blueprint.

        Args:
            blueprint_name_or_path (str): The name or path of the blueprint YAML file.
            initial_input (dict): Data provided as input to the blueprint's 'start' node.
                                   Keys should match expected variables (e.g., defined in input_schema
                                   or used in templates like {{start.input.my_var}}).

        Returns:
            any: The final output determined by the blueprint's 'end' node logic,
                 or None if execution fails or doesn't complete.

        Raises:
            FileNotFoundError, yaml.YAMLError, ValueError: If blueprint loading/validation fails.
            RuntimeError: If execution encounters a critical error.
        """
        try:
            # 1. Load and Compile Blueprint
            blueprint = self.load_blueprint(blueprint_name_or_path)
            if not isinstance(blueprint, CompiledBlueprint):
                 # Should be caught by load_blueprint, but double-check
                 raise ValueError("Failed to load a valid CompiledBlueprint object.")

            logger.info(f"Starting execution of Blueprint: {blueprint.name}")

            # 2. Initialize Execution Context
            execution_context = {
                'start_input': initial_input if initial_input else {},
                'node_outputs': {} # Stores output of each node: {node_id: output_value}
            }
            current_node_id = blueprint.start_node_id
            max_steps = 100 # Safety limit to prevent infinite loops
            step_count = 0
            execution_log = [] # Optional: Keep track of execution path

            # 3. Execution Loop
            while current_node_id != blueprint.end_node_id and step_count < max_steps:
                step_count += 1
                node = blueprint.get_node(current_node_id)

                if not node:
                    log_msg = f"Execution Error: Node ID '{current_node_id}' referenced but not found in blueprint '{blueprint.name}'. Aborting."
                    logger.error(log_msg)
                    execution_log.append({"error": log_msg})
                    raise ValueError(log_msg)

                node_id = node.id
                action = node.action
                start_time = time.monotonic() # Use monotonic for duration measurement
                logger.debug(f"Step {step_count}: Executing node '{node_id}' (Action: {action})")
                execution_log.append({"step": step_count, "node_id": node_id, "action": action})


                output = None
                next_node_id = node.next_node_id # Default next node

                # --- Action Dispatching ---
                try:
                    if action == 'Start':
                        # Usually does nothing, input is already in context
                        logger.debug("Executing Start node.")
                        output = execution_context['start_input'] # Pass input through if needed

                    elif action == 'Activate_Atom':
                        atom_name = node.atom_name
                        if not atom_name:
                            raise ValueError(f"Node '{node_id}': 'atom_name' is required for 'Activate_Atom' action.")

                        atom_func = self.atom_loader.get_atom(atom_name) # Can raise ValueError

                        # Prepare input by substituting context into the template
                        input_template = node.input_template
                        atom_input = None
                        if isinstance(input_template, str):
                             # If input template is a string, resolve it
                             resolved_input_str = substitute_template(input_template, execution_context)
                             # Try to parse if it looks like JSON (e.g., from complex type substitution)
                             try:
                                  atom_input = json.loads(resolved_input_str)
                                  logger.debug(f"Resolved input template (parsed as JSON): {atom_input}")
                             except json.JSONDecodeError:
                                  atom_input = resolved_input_str # Use as plain string
                                  logger.debug(f"Resolved input template (as string): {atom_input}")
                        elif isinstance(input_template, dict):
                             # If input template is a dict, resolve templates within its values
                             atom_input = {}
                             for key, template_val in input_template.items():
                                 atom_input[key] = substitute_template(str(template_val), execution_context)
                             logger.debug(f"Resolved input template (as dict): {atom_input}")
                        elif input_template is not None:
                             # Handle other types if necessary, or treat as static value
                             atom_input = input_template
                             logger.debug(f"Using static input template: {atom_input}")

                        logger.info(f"Calling Atom '{atom_name}'...")
                        output = atom_func(atom_input) # Execute the atom
                        logger.info(f"Atom '{atom_name}' returned.")
                        # Basic error check based on Atom's convention
                        if isinstance(output, str) and output.startswith("Error:"):
                             log_msg = f"Atom '{atom_name}' returned an error: {output}"
                             logger.error(log_msg)
                             # Decide whether to raise error or just log and continue
                             # For now, let's raise to stop execution on atom error
                             raise RuntimeError(log_msg)

                    elif action == 'AV_Query':
                        query_type = node.definition.get('query_type')
                        if not query_type:
                            raise ValueError(f"Node '{node_id}': 'query_type' is required for 'AV_Query' action.")

                        if query_type == 'vector':
                            query_text_template = node.definition.get('query_text')
                            k_template = node.definition.get('k', 5) # Default k=5
                            if not query_text_template:
                                 raise ValueError(f"Node '{node_id}': 'query_text' required for AV vector query.")

                            query_text = substitute_template(query_text_template, execution_context)
                            k = int(substitute_template(str(k_template), execution_context))
                            # TODO: Add support for filters from blueprint definition
                            # filter_template = node.definition.get('filter')
                            # filter_criteria = resolve_template_dict(filter_template, context)
                            logger.info(f"Querying AV (Vector): '{query_text[:50]}...', k={k}")
                            output = self.av.query_vector_index(query_text, k=k) # Add filter criteria later

                        elif query_type == 'structured':
                            query_template = node.definition.get('query')
                            params_template = node.definition.get('params', '()') # Default empty tuple
                            if not query_template:
                                 raise ValueError(f"Node '{node_id}': 'query' required for AV structured query.")

                            query = substitute_template(query_template, execution_context)
                            params_str = substitute_template(str(params_template), execution_context)
                            # Safely evaluate params string (e.g., using ast.literal_eval if possible)
                            try:
                                 import ast
                                 params = tuple(ast.literal_eval(params_str))
                            except (ValueError, SyntaxError):
                                 logger.error(f"Invalid 'params' format for AV structured query node {node_id}: {params_str}")
                                 raise ValueError("Invalid params format for structured query.")

                            logger.info(f"Querying AV (Structured): '{query[:50]}...', params={params}")
                            output = self.av.query_structured(query, params)

                        else:
                            raise ValueError(f"Node '{node_id}': Unsupported AV 'query_type': {query_type}")

                    elif action == 'Logic_Gate':
                        condition_template = node.definition.get('if')
                        then_node = node.definition.get('then')
                        else_node = node.definition.get('else', node.next_node_id) # Default to 'next' if 'else' omitted

                        if not condition_template:
                            raise ValueError(f"Node '{node_id}': 'if' condition required for 'Logic_Gate'.")
                        if not then_node:
                             raise ValueError(f"Node '{node_id}': 'then' target node required for 'Logic_Gate'.")

                        condition_str = substitute_template(condition_template, execution_context)
                        # Basic Python evaluation - WARNING: SECURITY RISK if blueprints aren't trusted.
                        # Consider a safer expression evaluator (e.g., asteval, or custom simple parser) for production.
                        try:
                            # Create a limited context for eval
                            eval_context = {**execution_context.get('node_outputs', {}), **execution_context.get('start_input', {})}
                            condition_met = eval(condition_str, {"__builtins__": {}}, eval_context) # Limited builtins
                            logger.debug(f"Evaluated condition '{condition_str}' -> {condition_met}")
                        except Exception as e:
                             logger.error(f"Error evaluating condition '{condition_str}' in node {node_id}: {e}")
                             raise RuntimeError(f"Error evaluating condition in node {node_id}")

                        if condition_met:
                            next_node_id = then_node
                            logger.debug(f"Condition TRUE, branching to node '{next_node_id}'")
                        else:
                            next_node_id = else_node
                            logger.debug(f"Condition FALSE, branching to node '{next_node_id}'")

                    elif action == 'Execute_Sub_Blueprint':
                         sub_blueprint_template = node.definition.get('blueprint_name')
                         sub_input_template = node.definition.get('input', {})
                         if not sub_blueprint_template:
                              raise ValueError(f"Node '{node_id}': 'blueprint_name' required for 'Execute_Sub_Blueprint'.")

                         sub_blueprint_name = substitute_template(sub_blueprint_template, execution_context)
                         sub_input = {}
                         if isinstance(sub_input_template, dict):
                             for key, template_val in sub_input_template.items():
                                 sub_input[key] = substitute_template(str(template_val), execution_context)
                         elif sub_input_template: # Allow passing previous node output directly
                              sub_input = substitute_template(str(sub_input_template), execution_context)
                              # Maybe try parsing as JSON if string looks like it?

                         logger.info(f"Executing Sub-Blueprint '{sub_blueprint_name}'...")
                         # Recursive call - make sure to handle potential infinite loops via max_steps or depth limit
                         output = self.execute_blueprint(sub_blueprint_name, sub_input)
                         logger.info(f"Sub-Blueprint '{sub_blueprint_name}' finished.")


                    elif action == 'User_Query_Point':
                        # This is where interaction with an external system (UI, queue) would happen
                        prompt_template = node.definition.get('prompt', 'Input required.')
                        prompt = substitute_template(prompt_template, execution_context)
                        feedback_id = f"feedback_{blueprint.name}_{node_id}_{int(time.time()*1000)}"
                        log_msg = f"USER FEEDBACK REQUIRED (ID: {feedback_id}): {prompt}"
                        logger.info(log_msg)
                        execution_log.append({"feedback_request": log_msg})
                        # In a real system, ACE might pause here, publish the feedback_id/prompt,
                        # and wait for an external response before continuing.
                        # For this simple version, we'll just log and output the request ID.
                        output = {"status": "feedback_required", "feedback_id": feedback_id, "prompt": prompt}
                        # Typically, execution would pause or the blueprint would branch based on this.
                        # For now, we just proceed to 'next'.


                    elif action == 'Combine_Outputs':
                         # Example: Combine results from previous nodes into a single string or list
                         inputs_template = node.definition.get('inputs', [])
                         separator = substitute_template(node.definition.get('separator', '\n'), execution_context)
                         combined = []
                         if isinstance(inputs_template, list):
                              for item_template in inputs_template:
                                   resolved_item = substitute_template(str(item_template), execution_context)
                                   combined.append(str(resolved_item)) # Ensure string conversion
                              output = separator.join(combined)
                         else:
                              logger.warning(f"Node '{node_id}': 'inputs' for Combine_Outputs should be a list.")
                              output = "" # Default empty output

                    elif action == 'End':
                        # Should not be reached inside the loop if condition is correct
                        logger.debug("Reached End node.")
                        break

                    else:
                        # Handle unknown action types defined in blueprint
                        logger.warning(f"Node '{node_id}': Unknown action type '{action}'. Skipping node.")

                    # --- Store Node Output ---
                    output_var_name = node.output_variable
                    if output_var_name:
                        execution_context['node_outputs'][node_id] = output
                        logger.debug(f"Stored output for node '{node_id}' in var '{output_var_name}'. Preview: {str(output)[:100] if output else 'None'}")

                except Exception as node_error:
                     # Catch errors during action execution (e.g., Atom errors, AV errors, eval errors)
                     log_msg = f"Execution Error at node '{node_id}' (Action: {action}) in blueprint '{blueprint.name}': {node_error}"
                     logger.error(log_msg, exc_info=True)
                     execution_log.append({"error": log_msg})
                     # Re-raise as a RuntimeError to signal execution failure
                     raise RuntimeError(log_msg) from node_error

                # --- Log Node Duration ---
                end_time = time.monotonic()
                duration_ms = (end_time - start_time) * 1000
                log_entry = {
                    "blueprint": blueprint.name,
                    "step": step_count,
                    "node_id": node_id,
                    "action": action,
                    "duration_ms": round(duration_ms, 2),
                }
                # Use specific logger for structured logging if desired, or just info
                logger.info(f"Node '{node_id}' completed in {duration_ms:.2f} ms.")
                # Append detailed log entry to a structured log file for OLI
                # (Configure Python logging handlers for this)


                # --- Advance to Next Node ---
                # next_node_id was determined by action logic (esp. Logic_Gate) or default node.next
                current_node_id = next_node_id

            # 4. Handle Loop Exit
            if current_node_id == blueprint.end_node_id:
                logger.info(f"Blueprint '{blueprint.name}' finished successfully at node '{blueprint.end_node_id}'.")
                # Determine final output - convention needed.
                # Option 1: Output of the node just *before* end?
                # Option 2: Output stored in a specific variable name (e.g., 'final_result')?
                # Option 3: Output of a specific node designated as the output node?
                # Let's use Option 2: Look for 'final_result' in context, fallback to last node's output
                final_output = execution_context['node_outputs'].get('final_result')
                if final_output is None and execution_context['node_outputs']:
                    # Fallback: Get output of the last node that produced output
                    last_output_node_id = list(execution_context['node_outputs'].keys())[-1]
                    final_output = execution_context['node_outputs'].get(last_output_node_id)
                    logger.debug(f"Using output from last node '{last_output_node_id}' as final result.")
                return final_output

            elif step_count >= max_steps:
                log_msg = f"Execution Error: Blueprint '{blueprint.name}' exceeded maximum step limit ({max_steps}). Aborting."
                logger.error(log_msg)
                execution_log.append({"error": log_msg})
                raise RuntimeError(log_msg)
            else:
                 # Should not happen if validation ensures end node is reachable
                 log_msg = f"Execution Error: Blueprint '{blueprint.name}' stopped unexpectedly before reaching end node."
                 logger.error(log_msg)
                 execution_log.append({"error": log_msg})
                 raise RuntimeError(log_msg)


        except (FileNotFoundError, yaml.YAMLError, ValueError) as load_error:
             # Errors during blueprint loading/validation
             logger.error(f"Failed to load or validate blueprint '{blueprint_name_or_path}': {load_error}", exc_info=True)
             raise # Re-raise these specific errors
        except RuntimeError as exec_error:
             # Errors during execution (raised intentionally above)
             logger.error(f"Runtime error during blueprint execution: {exec_error}", exc_info=False) # Avoid duplicate traceback
             raise # Re-raise RuntimeError
        except Exception as e:
             # Catch any other unexpected errors during the whole process
             logger.error(f"Unexpected error during ACE execution: {e}", exc_info=True)
             raise RuntimeError(f"Unexpected ACE error: {e}") from e


# --- Singleton Instance ---
# Create a single instance of the ACE for the application to use.
try:
    ace_instance = ACE()
except Exception as e:
    # Log critical failure if ACE itself can't initialize (e.g., components missing)
    logging.getLogger(__name__).critical(f"CRITICAL: Failed to initialize ACE singleton instance: {e}", exc_info=True)
    ace_instance = None


# --- Example Usage (for testing this module directly) ---
if __name__ == '__main__':
    # Configure basic logging for this direct test run
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger.info("="*30)
    logger.info("Running ACE Standalone Test")
    logger.info("="*30)

    if not ace_instance:
        logger.error("ACE instance (ace_instance) failed to initialize during import. Cannot run tests.")
        exit(1)

    # --- Test Case 1: Execute the Simple Uppercase Blueprint ---
    blueprint_to_test = 'simple_uppercase_blueprint' # Use the name (looks for .yaml in definitions/)
    test_input_data = {'text_to_convert': 'hello from the ace executor test!'}
    logger.info(f"\n--- Test Case 1: Execute Blueprint '{blueprint_to_test}' ---")
    logger.info(f"Input Data: {test_input_data}")

    try:
        final_result = ace_instance.execute_blueprint(blueprint_to_test, test_input_data)
        logger.info(f"Blueprint execution finished.")
        logger.info(f"Final Result: {repr(final_result)}")

        # Verify the output
        expected_result = 'HELLO FROM THE ACE EXECUTOR TEST!'
        if final_result == expected_result:
            logger.info("Blueprint Execution Test PASSED.")
        else:
            logger.error(f"Blueprint Execution Test FAILED. Expected: {repr(expected_result)}, Got: {repr(final_result)}")

    except Exception as e:
        logger.error(f"Test Case 1 FAILED with error during execution: {e}", exc_info=True)


    # --- Add more test cases later ---
    # e.g., Test blueprint with AV query, logic gate, non-existent atom call error

    logger.info("\n" + "="*30)
    logger.info("ACE standalone test finished.")
    logger.info("="*30)