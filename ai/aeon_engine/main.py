# --- File: aeon_engine/main.py ---
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
import logging
import time

# --- Import AEON Core Executor ---
# Ensure this import works correctly when running via uvicorn
try:
    # Use absolute import from the project structure perspective
    from core_executor.ace_executor import ace_instance
    if not ace_instance:
         raise ImportError("ACE instance failed to initialize.")
except ImportError as e:
     logging.critical(f"CRITICAL: Failed to import AEON components in API: {e}", exc_info=True)
     # Exit or handle gracefully if core components are missing
     ace_instance = None # Ensure it's defined for checks below

# --- Configure Logging ---
# Consider more robust logging configuration for production
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Initialize FastAPI App ---
app = FastAPI(
    title="AEON Engine API",
    description="API endpoint to execute AEON Cognitive Blueprints.",
    version="0.1.0"
)

# --- Define Request/Response Models (using Pydantic) ---
class BlueprintExecutionRequest(BaseModel):
    blueprint_name: str = Field(..., description="Name of the blueprint (e.g., 'simple_uppercase_blueprint') or path relative to definitions.")
    initial_input: dict = Field(..., description="Input data dictionary for the blueprint's start node.")

class BlueprintExecutionResponse(BaseModel):
    success: bool
    result: dict | str | list | None = None # Type depends on blueprint output
    error: str | None = None
    execution_time_ms: float | None = None

# --- API Endpoint Definition ---
@app.post("/execute", response_model=BlueprintExecutionResponse)
async def execute_aeon_blueprint(request: BlueprintExecutionRequest, http_request: Request):
    """
    Executes a specified AEON Cognitive Blueprint with the given input.
    """
    start_time = time.monotonic()
    logger.info(f"Received request to execute blueprint: {request.blueprint_name}")
    logger.debug(f"Request input data: {request.initial_input}")

    if not ace_instance:
         logger.error("ACE instance is not available. Cannot execute blueprint.")
         raise HTTPException(status_code=503, detail="AEON engine not available.")

    try:
        # --- Execute the Blueprint ---
        final_result = ace_instance.execute_blueprint(
            blueprint_name_or_path=request.blueprint_name,
            initial_input=request.initial_input
        )
        end_time = time.monotonic()
        exec_time = (end_time - start_time) * 1000

        logger.info(f"Blueprint '{request.blueprint_name}' executed successfully in {exec_time:.2f} ms.")
        return BlueprintExecutionResponse(
            success=True,
            result=final_result,
            execution_time_ms=round(exec_time, 2)
        )

    except (FileNotFoundError, yaml.YAMLError, ValueError) as load_err:
         # Errors during blueprint loading/validation in ACE
         logger.warning(f"Blueprint load/validation error for '{request.blueprint_name}': {load_err}", exc_info=True)
         raise HTTPException(status_code=404, detail=f"Blueprint '{request.blueprint_name}' not found or invalid: {load_err}")
    except RuntimeError as exec_err:
         # Errors during blueprint execution raised by ACE
         logger.error(f"Runtime error executing blueprint '{request.blueprint_name}': {exec_err}", exc_info=True)
         raise HTTPException(status_code=500, detail=f"Error during blueprint execution: {exec_err}")
    except Exception as e:
         # Catch any other unexpected errors
         logger.error(f"Unexpected error during /execute endpoint: {e}", exc_info=True)
         raise HTTPException(status_code=500, detail="Internal server error.")

# --- Health Check Endpoint ---
@app.get("/health")
async def health_check():
    """Basic health check endpoint."""
    if ace_instance and av_instance and atom_loader_instance:
         # Could add more checks here (e.g., test AV connection)
         return {"status": "ok", "message": "AEON components seem initialized."}
    else:
         raise HTTPException(status_code=503, detail="AEON components failed to initialize.")


# --- Run Locally (for testing) ---
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting AEON API server locally via Uvicorn...")
    # Make sure AEON_ROOT is correctly inferred or set when running directly
    if not AEON_ROOT:
         logger.warning("AEON_ROOT not determined, relative paths might fail.")
    # Run on localhost, port 8000 (or any other available port)
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")