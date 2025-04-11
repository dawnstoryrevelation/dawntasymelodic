# --- File: aeon_engine/cognitive_blueprints/parser.py ---

import yaml
import os
import logging
from collections import deque # Useful for validating node connections

# Configure logger for the parser
logger = logging.getLogger(__name__)
# logger.setLevel(logging.DEBUG) # Set level if needed

# --- Path Setup ---
# Assumes this parser.py is in cognitive_blueprints/
BLUEPRINT_ROOT = os.path.dirname(os.path.abspath(__file__))
AEON_ROOT = os.path.dirname(BLUEPRINT_ROOT)
DEFINITIONS_DIR = os.path.join(BLUEPRINT_ROOT, 'definitions')

class BlueprintNode:
    """Represents a single node (step) within a Cognitive Blueprint."""
    def __init__(self, node_id, definition):
        self.id = node_id
        self.definition = definition # Store the raw dict for flexibility
        self.action = definition.get('action')
        self.next_node_id = definition.get('next') # Default next node ID

        # Extract other common fields for easier access (optional)
        self.atom_name = definition.get('atom_name')
        self.input_template = definition.get('input') # Can be string or dict
        self.output_variable = definition.get('output_var')
        # Add fields for AV_Query, Logic_Gate etc. as needed

        if not self.action:
            raise ValueError(f"Node '{self.id}' is missing required 'action' field.")

    def __repr__(self):
        return f"<BlueprintNode id='{self.id}' action='{self.action}'>"

class CompiledBlueprint:
    """Represents a loaded and minimally validated Cognitive Blueprint."""
    def __init__(self, name, description, nodes_dict, start_node_id='start', end_node_id='end'):
        self.name = name
        self.description = description
        self.nodes = nodes_dict # Dictionary mapping node_id -> BlueprintNode object
        self.start_node_id = start_node_id
        self.end_node_id = end_node_id
        self._validate() # Perform basic validation on load

    def get_node(self, node_id):
        """Safely retrieves a node by its ID."""
        return self.nodes.get(node_id)

    def _validate(self):
        """Performs basic structural validation of the blueprint."""
        logger.debug(f"Validating blueprint: {self.name}")
        if not self.get_node(self.start_node_id):
            raise ValueError(f"Blueprint '{self.name}' is missing the start node '{self.start_node_id}'.")

        # Basic reachability check (ensure all nodes are connected and lead towards 'end')
        # More complex validation (cycle detection, input/output matching) could be added.
        visited = set()
        queue = deque([self.start_node_id])
        has_end_node = False

        while queue:
            current_id = queue.popleft()
            if current_id in visited:
                continue
            visited.add(current_id)

            if current_id == self.end_node_id:
                 has_end_node = True
                 # Don't explore further from the end node in this basic check
                 continue

            node = self.get_node(current_id)
            if not node:
                 # This case might indicate a dangling 'next' reference
                 logger.warning(f"Validation Warning: Node '{current_id}' referenced but not defined in blueprint '{self.name}'.")
                 continue # Allow processing other branches

            # Check potential next nodes based on node type
            potential_next = []
            if node.action == 'Logic_Gate':
                if node.definition.get('then'): potential_next.append(node.definition['then'])
                if node.definition.get('else'): potential_next.append(node.definition['else'])
            # Default 'next' is always a potential path if defined
            if node.next_node_id:
                 potential_next.append(node.next_node_id)

            if not potential_next and current_id != self.end_node_id:
                 logger.warning(f"Validation Warning: Node '{current_id}' in blueprint '{self.name}' has no defined 'next', 'then', or 'else' and is not the end node.")

            for next_id in potential_next:
                if next_id not in visited:
                    queue.append(next_id)

        if not has_end_node:
             logger.warning(f"Validation Warning: End node '{self.end_node_id}' may not be reachable in blueprint '{self.name}'.")

        # Check if all defined nodes were visited (detect orphans)
        defined_node_ids = set(self.nodes.keys())
        unreachable_nodes = defined_node_ids - visited
        if unreachable_nodes:
            logger.warning(f"Validation Warning: The following nodes may be unreachable in blueprint '{self.name}': {unreachable_nodes}")

        logger.debug(f"Basic validation complete for blueprint: {self.name}")

    def __repr__(self):
        return f"<CompiledBlueprint name='{self.name}' nodes={len(self.nodes)}>"


def load_and_compile_blueprint(blueprint_name_or_path: str) -> CompiledBlueprint:
    """
    Loads a blueprint YAML file, parses it, performs basic validation,
    and returns a CompiledBlueprint object.

    Args:
        blueprint_name_or_path (str): The name of the blueprint (e.g., 'my_blueprint')
                                       which will be looked for as 'definitions/my_blueprint.yaml',
                                       OR a direct relative/absolute path to the YAML file.

    Returns:
        CompiledBlueprint: The loaded and validated blueprint object.

    Raises:
        FileNotFoundError: If the blueprint YAML file cannot be found.
        yaml.YAMLError: If the YAML file has syntax errors.
        ValueError: If the blueprint structure is invalid (e.g., missing action, start node).
    """
    if not blueprint_name_or_path.endswith('.yaml') and not os.path.isabs(blueprint_name_or_path):
        # Assume it's a name, construct path relative to definitions directory
        file_path = os.path.join(DEFINITIONS_DIR, f"{blueprint_name_or_path}.yaml")
    else:
        # Assume it's a relative or absolute path
        # If relative, make it relative to AEON_ROOT for consistency if needed
        if not os.path.isabs(blueprint_name_or_path):
             file_path = os.path.join(AEON_ROOT, blueprint_name_or_path)
        else:
             file_path = blueprint_name_or_path

    logger.info(f"Loading blueprint definition from: {file_path}")

    if not os.path.exists(file_path):
        logger.error(f"Blueprint definition file not found: {file_path}")
        raise FileNotFoundError(f"Blueprint definition file not found: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            definition = yaml.safe_load(f) # Use safe_load to avoid arbitrary code execution

        if not isinstance(definition, dict):
             raise ValueError("Blueprint YAML content must be a dictionary (object).")

        # --- Basic Schema Validation ---
        required_keys = ['name', 'nodes']
        for key in required_keys:
            if key not in definition:
                raise ValueError(f"Blueprint definition missing required top-level key: '{key}'")

        if not isinstance(definition['nodes'], list):
            raise ValueError("Blueprint 'nodes' key must contain a list of node definitions.")
        # --- End Basic Schema Validation ---

        name = definition['name']
        description = definition.get('description', '') # Optional description

        # Parse nodes into BlueprintNode objects stored in a dictionary
        nodes_dict = {}
        for node_def in definition['nodes']:
            if not isinstance(node_def, dict) or 'id' not in node_def:
                raise ValueError(f"Invalid node definition found in blueprint '{name}': must be a dict with an 'id'. Node: {node_def}")
            node_id = node_def['id']
            if node_id in nodes_dict:
                 raise ValueError(f"Duplicate node ID '{node_id}' found in blueprint '{name}'.")
            try:
                 nodes_dict[node_id] = BlueprintNode(node_id, node_def)
            except ValueError as e:
                 # Catch errors during node initialization (e.g., missing action)
                 raise ValueError(f"Error in node '{node_id}' definition: {e}") from e


        # Create and return the compiled blueprint object (validation happens inside __init__)
        compiled_blueprint = CompiledBlueprint(name, description, nodes_dict)
        logger.info(f"Successfully loaded and compiled blueprint: {compiled_blueprint.name}")
        return compiled_blueprint

    except yaml.YAMLError as e:
        logger.error(f"Error parsing YAML file {file_path}: {e}")
        raise # Re-raise YAMLError
    except ValueError as e:
        logger.error(f"Invalid blueprint structure in {file_path}: {e}")
        raise # Re-raise ValueError for structure issues
    except Exception as e:
        logger.error(f"An unexpected error occurred loading blueprint {file_path}: {e}", exc_info=True)
        # Wrap unexpected errors
        raise RuntimeError(f"Failed to load blueprint {file_path}: {e}") from e


# --- Example Usage (for testing this module directly) ---
if __name__ == '__main__':
    # Configure basic logging JUST for this direct test run
    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger.info("="*30)
    logger.info("Running Blueprint Parser Standalone Test")
    logger.info("="*30)

    # Define a dummy blueprint content IN CODE for testing the parser logic
    # In real use, we load from file, but this makes the test self-contained
    dummy_yaml_content = """
name: TestBlueprint
description: A simple test blueprint.
nodes:
  - id: start
    action: StartAction # Placeholder action
    next: process_text
  - id: process_text
    action: Activate_Atom
    atom_name: example_string_upper # Assumes this atom exists for validation purposes
    input: "{{start.input.raw_text}}"
    output_var: processed_text
    next: end
  - id: end
    action: EndAction # Placeholder action
"""
    # Create a temporary YAML file for the test
    TEST_BLUEPRINT_NAME = '___test_blueprint___'
    test_file_path = os.path.join(DEFINITIONS_DIR, f"{TEST_BLUEPRINT_NAME}.yaml")
    try:
        with open(test_file_path, 'w') as f:
            f.write(dummy_yaml_content)
        logger.info(f"Created temporary test blueprint file: {test_file_path}")

        # --- Test Case 1: Load Valid Blueprint by Name ---
        logger.info(f"\n--- Test Case 1: Load Valid Blueprint by Name ('{TEST_BLUEPRINT_NAME}') ---")
        try:
            compiled_bp = load_and_compile_blueprint(TEST_BLUEPRINT_NAME)
            logger.info(f"Successfully loaded blueprint: {compiled_bp.name}")
            logger.info(f"Start node: {compiled_bp.start_node_id}, End node: {compiled_bp.end_node_id}")
            logger.info(f"Node count: {len(compiled_bp.nodes)}")
            process_node = compiled_bp.get_node('process_text')
            if process_node and process_node.action == 'Activate_Atom' and process_node.atom_name == 'example_string_upper':
                logger.info("Blueprint structure seems correct. Test PASSED.")
            else:
                logger.error("Blueprint structure check FAILED.")
        except Exception as e:
            logger.error(f"Test Case 1 FAILED with error: {e}", exc_info=True)

        # --- Test Case 2: Load Non-existent Blueprint ---
        logger.info("\n--- Test Case 2: Load Non-existent Blueprint ---")
        try:
            load_and_compile_blueprint("non_existent_blueprint")
            logger.error("Expected FileNotFoundError but none was raised. Test FAILED.")
        except FileNotFoundError as e:
            logger.info(f"Successfully caught expected FileNotFoundError: {e}. Test PASSED.")
        except Exception as e:
            logger.error(f"Caught unexpected error: {e}", exc_info=True)
            logger.error("Test FAILED.")

    finally:
        # Clean up the temporary test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)
            logger.info(f"Cleaned up temporary file: {test_file_path}")

    logger.info("\n" + "="*30)
    logger.info("Blueprint Parser standalone test finished.")
    logger.info("="*30)