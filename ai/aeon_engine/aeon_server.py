# --- File: aeon_engine/aeon_server.py ---

import logging
from flask import Flask, request, jsonify

# --- Import AEON Components ---
# Use absolute imports assuming aeon_server.py is in the aeon_engine root
try:
    # Ensure core components initialize first if they haven't already
    # These imports will bring in the singleton instances
    from core_executor.ace_executor import ace_instance
    # Also import parser potentially if needed, though ACE handles loading
    from cognitive_blueprints.parser import load_and_compile_blueprint
    # Import AV and Loader only if directly needed here (unlikely)
    # from axiom_vault.av_manager import av_instance
    # from cognitive_atoms.atom_runtime.loader import atom_loader_instance

except ImportError as e:
     logging.basicConfig(level=logging.CRITICAL) # Basic logging for this critical error
     logging.critical(f"CRITICAL ERROR: Failed to import AEON components in server: {e}. Check sys.path and file locations.", exc_info=True)
     ace_instance = None # Ensure instance is None if import fails
except Exception as e:
     logging.basicConfig(level=logging.CRITICAL)
     logging.critical(f"CRITICAL ERROR: Unexpected error during AEON component import: {e}", exc_info=True)
     ace_instance = None


# Configure Flask App and Logging
app = Flask(__name__)

# Configure basic logging for Flask and AEON components accessed via server
# Adjust level as needed (DEBUG for development, INFO for production)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
# You might want separate handlers for Flask vs AEON later

@app.route('/')
def index():
    # Simple health check endpoint
    if ace_instance:
        return jsonify({"status": "AEON Server Running", "message": "AEON ACE instance loaded."}), 200
    else:
         return jsonify({"status": "ERROR", "message": "AEON ACE instance failed to load."}), 500

@app.route('/execute/<blueprint_name>', methods=['POST'])
def execute_blueprint_endpoint(blueprint_name):
    """
    API Endpoint to execute an AEON blueprint.
    Expects JSON body with 'initial_input' field.
    """
    if not ace_instance:
        return jsonify({"error": "AEON ACE instance not available."}), 503 # Service Unavailable

    if not request.is_json:
        return jsonify({"error": "Request must be JSON."}), 400

    data = request.get_json()
    initial_input = data.get('initial_input')

    if initial_input is None: # Allow empty dict {} but not missing key
        return jsonify({"error": "'initial_input' key missing in JSON body."}), 400
    if not isinstance(initial_input, dict):
         return jsonify({"error": "'initial_input' must be a JSON object (dictionary)."}), 400

    logger.info(f"Received request to execute blueprint '{blueprint_name}' with input: {initial_input}")

    try:
        # Execute the blueprint using the singleton ACE instance
        result = ace_instance.execute_blueprint(blueprint_name, initial_input)

        logger.info(f"Blueprint '{blueprint_name}' execution completed. Result: {str(result)[:200]}") # Log preview
        return jsonify({"success": True, "result": result}), 200

    except FileNotFoundError as e:
        logger.warning(f"Blueprint file not found for '{blueprint_name}': {e}")
        return jsonify({"error": "Blueprint definition not found.", "details": str(e)}), 404
    except (ValueError, RuntimeError) as e:
        # Catch errors during blueprint loading, validation, or execution
        logger.error(f"Error executing blueprint '{blueprint_name}': {e}", exc_info=True) # Log traceback for server debug
        # Return a generic error to the client for security
        return jsonify({"error": "Blueprint execution failed.", "details": str(e)}), 500
    except Exception as e:
        # Catch any other unexpected errors
        logger.error(f"Unexpected server error during blueprint execution '{blueprint_name}': {e}", exc_info=True)
        return jsonify({"error": "An unexpected server error occurred."}), 500

# Run the Flask development server
# Run the Flask development server
if __name__ == '__main__':
    # --- Add this line to get the logger ---
    logger = logging.getLogger(__name__) # Use the same logger as defined elsewhere or root
    # ---------------------------------------

    # WARNING: This is a development server. Use a production WSGI server
    # (like Gunicorn or Waitress) for deployment!
    logger.info("Starting AEON Flask development server...")
    # Run on 0.0.0.0 to make it accessible on your network (use with caution)
    # or 127.0.0.1 for local access only. Choose an unused port.
    app.run(host='127.0.0.1', port=5175, debug=False) # Turn debug=False for cleaner logs