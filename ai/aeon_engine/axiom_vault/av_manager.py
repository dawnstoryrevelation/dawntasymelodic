import sqlite3
import faiss
from sentence_transformers import SentenceTransformer
import numpy as np
import json # For storing metadata and potentially the ID map
import pickle # Alternative for storing the ID map if complex objects needed
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - AV_Manager - %(levelname)s - %(message)s')

# --- Configuration Constants ---
# Define paths relative to the aeon_engine root
AEON_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Gets /path/to/aeon_engine
DB_PATH = os.path.join(AEON_ROOT, 'axiom_vault', 'axiom_vault.db')
INDEX_PATH = os.path.join(AEON_ROOT, 'axiom_vault', 'vector_store.faiss')
ID_MAP_PATH = os.path.join(AEON_ROOT, 'axiom_vault', 'faiss_id_map.pkl') # Using pickle for simplicity
# Choose your embedding model (consider smaller models for faster startup/less RAM)
# Examples: 'all-MiniLM-L6-v2' (good balance), 'paraphrase-MiniLM-L3-v2', 'sentence-t5-base'
# More powerful but larger: 'bge-base-en-v1.5', 'e5-large-v2'
EMBEDDING_MODEL_NAME = 'all-MiniLM-L6-v2'

class AxiomVault:
    """Manages the structured (SQLite) and vector (FAISS) knowledge base for AEON."""

    def __init__(self):
        """Initializes the database connection, embedding model, and FAISS index."""
        logging.info("Initializing Axiom Vault...")
        self.conn = None # Initialize conn to None
        self._connect_db()
        self._create_tables_if_not_exist()

        logging.info(f"Loading embedding model: {EMBEDDING_MODEL_NAME}")
        self.model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        self.embedding_dimension = self.model.get_sentence_embedding_dimension()

        self.index = None
        self.faiss_id_to_sqlite_id = {} # Map FAISS sequential ID -> SQLite primary key
        self.sqlite_id_to_faiss_id = {} # Map SQLite primary key -> FAISS sequential ID
        self._load_or_initialize_faiss()
        self._load_id_map()
        logging.info("Axiom Vault Initialization Complete.")

    def _connect_db(self):
        """Establishes connection to the SQLite database."""
        try:
            self.conn = sqlite3.connect(DB_PATH)
            self.conn.row_factory = sqlite3.Row # Access columns by name
            self.cursor = self.conn.cursor()
            logging.info(f"Connected to SQLite database: {DB_PATH}")
        except sqlite3.Error as e:
            logging.error(f"Error connecting to database: {e}")
            raise

    def _create_tables_if_not_exist(self):
        """Creates necessary SQLite tables if they don't already exist."""
        try:
            # Main table for storing various knowledge items
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS knowledge_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content_type TEXT NOT NULL, -- e.g., 'note', 'code_snippet', 'rule', 'document_chunk'
                    text_content TEXT,         -- The main text data
                    metadata_json TEXT,        -- JSON string for additional structured metadata
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Table to explicitly map SQLite IDs to FAISS IDs (optional but robust)
            # Helps if FAISS index needs rebuilding or for easier deletes later
            self.cursor.execute("""
                 CREATE TABLE IF NOT EXISTS vector_map (
                    sqlite_id INTEGER UNIQUE NOT NULL,
                    faiss_id INTEGER UNIQUE NOT NULL,
                    FOREIGN KEY (sqlite_id) REFERENCES knowledge_items (id) ON DELETE CASCADE
                 );
             """)
            # Add indexes for performance if needed later
            # self.cursor.execute("CREATE INDEX IF NOT EXISTS idx_content_type ON knowledge_items (content_type);")

            self.conn.commit()
            logging.info("Database tables checked/created successfully.")
        except sqlite3.Error as e:
            logging.error(f"Error creating/checking tables: {e}")
            raise

    def _load_or_initialize_faiss(self):
        """Loads the FAISS index from disk or initializes a new one."""
        if os.path.exists(INDEX_PATH):
            try:
                logging.info(f"Loading FAISS index from: {INDEX_PATH}")
                self.index = faiss.read_index(INDEX_PATH)
                logging.info(f"FAISS index loaded successfully. Contains {self.index.ntotal} vectors.")
                # Verify dimension matches model
                if self.index.d != self.embedding_dimension:
                     logging.error(f"FAISS index dimension ({self.index.d}) does not match model dimension ({self.embedding_dimension})! Index may be incompatible.")
                     # Handle this error appropriately - maybe force re-indexing or raise critical error
                     raise ValueError("FAISS index dimension mismatch with embedding model.")
            except Exception as e:
                logging.error(f"Error loading FAISS index: {e}. Initializing a new index.", exc_info=True)
                self._initialize_faiss_index()
        else:
            logging.info("FAISS index file not found. Initializing a new index.")
            self._initialize_faiss_index()

    def _initialize_faiss_index(self):
        """Creates a new, empty FAISS index."""
        # Using IndexFlatL2 for simplicity. Consider IndexIDMap for easier deletion later.
        # Or more advanced indexes like IndexIVFFlat for larger datasets.
        self.index = faiss.IndexFlatL2(self.embedding_dimension)
        logging.info(f"Initialized new FAISS IndexFlatL2 with dimension {self.embedding_dimension}")

    def _load_id_map(self):
        """Loads the FAISS ID <-> SQLite ID mapping from disk."""
        if os.path.exists(ID_MAP_PATH):
            try:
                with open(ID_MAP_PATH, 'rb') as f:
                    saved_map = pickle.load(f)
                    # Check if saved map is in the expected newer format (dict of dicts)
                    if isinstance(saved_map, dict) and 'faiss_to_sqlite' in saved_map and 'sqlite_to_faiss' in saved_map:
                         self.faiss_id_to_sqlite_id = saved_map['faiss_to_sqlite']
                         self.sqlite_id_to_faiss_id = saved_map['sqlite_to_faiss']
                    else:
                        # Assume old format (just faiss_to_sqlite) for backward compatibility
                        logging.warning("Loading potentially outdated ID map format. Rebuilding reverse map.")
                        self.faiss_id_to_sqlite_id = saved_map
                        self.sqlite_id_to_faiss_id = {v: k for k, v in self.faiss_id_to_sqlite_id.items()}

                    logging.info(f"Loaded ID map. Contains {len(self.faiss_id_to_sqlite_id)} entries.")
                    # Sanity check: Ensure map size roughly matches index size (if index loaded)
                    if self.index and self.index.ntotal > 0 and len(self.faiss_id_to_sqlite_id) != self.index.ntotal:
                        logging.warning(f"ID map size ({len(self.faiss_id_to_sqlite_id)}) differs from FAISS index size ({self.index.ntotal}). Map might be outdated or index corrupted.")

            except Exception as e:
                logging.error(f"Error loading ID map: {e}. Initializing empty map.", exc_info=True)
                self.faiss_id_to_sqlite_id = {}
                self.sqlite_id_to_faiss_id = {}
        else:
            logging.info("ID map file not found. Initializing empty map.")
            self.faiss_id_to_sqlite_id = {}
            self.sqlite_id_to_faiss_id = {}

    def save_index_and_map(self):
        """Saves the current FAISS index and ID mapping to disk."""
        try:
            logging.info(f"Saving FAISS index ({self.index.ntotal} vectors) to: {INDEX_PATH}")
            faiss.write_index(self.index, INDEX_PATH)

            map_to_save = {
                'faiss_to_sqlite': self.faiss_id_to_sqlite_id,
                'sqlite_to_faiss': self.sqlite_id_to_faiss_id
            }
            logging.info(f"Saving ID map ({len(self.faiss_id_to_sqlite_id)} entries) to: {ID_MAP_PATH}")
            with open(ID_MAP_PATH, 'wb') as f:
                pickle.dump(map_to_save, f)
            logging.info("FAISS index and ID map saved successfully.")
        except Exception as e:
            logging.error(f"Error saving FAISS index or ID map: {e}", exc_info=True)

    def add_knowledge_item(self, content_type: str, text_content: str, metadata: dict = None, add_to_vector_index: bool = True):
        """Adds a new knowledge item to SQLite and optionally to the FAISS index."""
        if not text_content:
             logging.warning("Attempted to add knowledge item with empty text_content. Skipping.")
             return None

        metadata_str = json.dumps(metadata) if metadata else None
        try:
            self.cursor.execute("""
                INSERT INTO knowledge_items (content_type, text_content, metadata_json)
                VALUES (?, ?, ?)
            """, (content_type, text_content, metadata_str))
            sqlite_id = self.cursor.lastrowid
            self.conn.commit()
            logging.info(f"Added knowledge item to SQLite with ID: {sqlite_id}")

            if add_to_vector_index and self.index is not None:
                try:
                    embedding = self.model.encode([text_content])[0].astype('float32')
                    # FAISS IDs are sequential 0-based indices internally for IndexFlatL2
                    faiss_id = self.index.ntotal # The ID will be the current size before adding
                    self.index.add(np.array([embedding]))

                    # Update maps
                    self.faiss_id_to_sqlite_id[faiss_id] = sqlite_id
                    self.sqlite_id_to_faiss_id[sqlite_id] = faiss_id

                    # Optional: Update vector_map table
                    self.cursor.execute("""
                        INSERT INTO vector_map (sqlite_id, faiss_id) VALUES (?, ?)
                    """, (sqlite_id, faiss_id))
                    self.conn.commit()

                    logging.info(f"Added vector embedding to FAISS for SQLite ID {sqlite_id} with FAISS ID {faiss_id}. New index size: {self.index.ntotal}")

                except Exception as e:
                    logging.error(f"Error adding vector for SQLite ID {sqlite_id}: {e}", exc_info=True)
                    # Consider rolling back the SQLite commit if vector add fails critically? Depends on desired atomicity.
                    return sqlite_id # Return ID even if vector add failed, but log error

            return sqlite_id # Return the ID of the newly inserted item

        except sqlite3.Error as e:
            logging.error(f"Error adding knowledge item to SQLite: {e}")
            self.conn.rollback() # Rollback transaction on error
            return None

    def get_knowledge_item(self, sqlite_id: int):
        """Retrieves a knowledge item from SQLite by its primary key."""
        try:
            self.cursor.execute("SELECT * FROM knowledge_items WHERE id = ?", (sqlite_id,))
            row = self.cursor.fetchone()
            if row:
                # Convert row object to a dictionary for easier use
                item = dict(row)
                # Parse metadata JSON back into a dict
                if item.get('metadata_json'):
                    try:
                        item['metadata'] = json.loads(item['metadata_json'])
                    except json.JSONDecodeError:
                        logging.warning(f"Could not decode metadata JSON for item ID {sqlite_id}")
                        item['metadata'] = None # Or keep raw string?
                del item['metadata_json'] # Remove raw JSON string
                return item
            else:
                return None
        except sqlite3.Error as e:
            logging.error(f"Error retrieving knowledge item ID {sqlite_id}: {e}")
            return None

    def query_vector_index(self, query_text: str, k: int = 5, filter_criteria: dict = None):
        """Performs semantic search using FAISS and returns enriched results from SQLite."""
        if self.index is None or self.index.ntotal == 0:
            logging.warning("FAISS index is not initialized or is empty. Cannot perform vector query.")
            return []

        try:
            query_embedding = self.model.encode([query_text])[0].astype('float32')
            # Ensure embedding is 2D array for search
            query_embedding_np = np.array([query_embedding])

            distances, faiss_indices = self.index.search(query_embedding_np, k)

            results = []
            if len(faiss_indices[0]) > 0:
                 # Get corresponding SQLite IDs using the map
                 sqlite_ids = [self.faiss_id_to_sqlite_id.get(idx) for idx in faiss_indices[0] if idx in self.faiss_id_to_sqlite_id]

                 if not sqlite_ids:
                      logging.warning("Vector search returned indices not found in ID map.")
                      return []

                 # Fetch full items from SQLite
                 # Using IN clause efficiently fetch multiple items
                 placeholders = ','.join('?' for _ in sqlite_ids)
                 query = f"SELECT * FROM knowledge_items WHERE id IN ({placeholders})"
                 self.cursor.execute(query, sqlite_ids)
                 rows = self.cursor.fetchall()

                 # Create a dictionary for quick lookup by sqlite_id
                 items_by_id = {}
                 for row in rows:
                      item = dict(row)
                      if item.get('metadata_json'):
                           try:
                                item['metadata'] = json.loads(item['metadata_json'])
                           except json.JSONDecodeError:
                                item['metadata'] = None
                      del item['metadata_json']
                      items_by_id[item['id']] = item

                 # Combine with distances and filter (if needed)
                 for i, faiss_idx in enumerate(faiss_indices[0]):
                      sqlite_id = self.faiss_id_to_sqlite_id.get(faiss_idx)
                      if sqlite_id and sqlite_id in items_by_id:
                           item_data = items_by_id[sqlite_id]
                           # Apply optional filtering based on metadata
                           passes_filter = True
                           if filter_criteria:
                                metadata = item_data.get('metadata', {})
                                for key, value in filter_criteria.items():
                                     if metadata.get(key) != value:
                                          passes_filter = False
                                          break
                           if passes_filter:
                                results.append({
                                     "id": sqlite_id,
                                     "score": float(distances[0][i]), # FAISS distance (L2 squared)
                                     "content_type": item_data.get('content_type'),
                                     "text_content": item_data.get('text_content'),
                                     "metadata": item_data.get('metadata'),
                                     "created_at": item_data.get('created_at'),
                                })

            # Sort results by score (distance, lower is better for L2)
            results.sort(key=lambda x: x['score'])
            return results

        except Exception as e:
            logging.error(f"Error during vector query: {e}", exc_info=True)
            return []

    def query_structured(self, query: str, params: tuple = ()):
        """Executes a custom SELECT query on the SQLite database."""
        try:
            self.cursor.execute(query, params)
            rows = self.cursor.fetchall()
            # Convert rows to list of dictionaries
            return [dict(row) for row in rows]
        except sqlite3.Error as e:
            logging.error(f"Error executing structured query: {e}")
            return [] # Return empty list on error

    def close(self):
        """Saves the index/map and closes the database connection."""
        logging.info("Closing Axiom Vault.")
        self.save_index_and_map()
        if self.conn:
            self.conn.close()
            logging.info("SQLite connection closed.")

# --- Singleton Instance ---
# Create a single instance to be imported by other AEON components
# Ensures only one connection, one model load, one index in memory.
try:
    av_instance = AxiomVault()
    # Ensure graceful shutdown (optional, depends on application structure)
    import atexit
    atexit.register(av_instance.close)
except Exception as e:
    logging.critical(f"Failed to initialize AxiomVault: {e}", exc_info=True)
    # Handle critical failure - maybe exit or provide a dummy object?
    av_instance = None # Indicate failure

# --- Example Usage (for testing this module directly) ---
if __name__ == "__main__":
    logging.info("Running AV Manager standalone test...")

    if not av_instance:
        logging.error("AV Instance failed to initialize. Exiting test.")
        exit()

    # 1. Add some structured knowledge (metadata is key)
    item1_id = av_instance.add_knowledge_item(
        content_type="rule",
        text_content="Always use virtual environments for Python projects.",
        metadata={"topic": "python", "level": "best_practice"},
        add_to_vector_index=True # Also index this rule semantically
    )
    item2_id = av_instance.add_knowledge_item(
        content_type="code_snippet",
        text_content="def hello(name):\n  print(f'Hello, {name}!')",
        metadata={"language": "python", "function": "greeting"},
        add_to_vector_index=True
    )
    item3_id = av_instance.add_knowledge_item(
        content_type="note",
        text_content="AEON stands for Algorithmic Embodiment & Optimized Nexus.",
        metadata={"project": "aeon", "area": "naming"},
        add_to_vector_index=True
    )
    # Add an item NOT indexed for vector search
    item4_id = av_instance.add_knowledge_item(
        content_type="config",
        text_content="TIMEOUT=30",
        metadata={"setting": "timeout"},
        add_to_vector_index=False
    )

    print(f"\nAdded items with SQLite IDs: {item1_id}, {item2_id}, {item3_id}, {item4_id}")

    # 2. Retrieve an item
    retrieved_item = av_instance.get_knowledge_item(item2_id)
    print(f"\nRetrieved Item ID {item2_id}:")
    if retrieved_item:
        print(json.dumps(retrieved_item, indent=2))
    else:
        print("Item not found.")

    # 3. Perform a vector search
    search_query = "best way to manage python dependencies"
    print(f"\nPerforming vector search for: '{search_query}'")
    vector_results = av_instance.query_vector_index(search_query, k=3)
    print("Vector Search Results:")
    if vector_results:
        for res in vector_results:
            print(f"  ID: {res['id']}, Score: {res['score']:.4f}, Content: '{res['text_content'][:50]}...'")
    else:
        print("  No results found.")

    search_query_2 = "what does aeon mean?"
    print(f"\nPerforming vector search for: '{search_query_2}'")
    vector_results_2 = av_instance.query_vector_index(search_query_2, k=2)
    print("Vector Search Results:")
    if vector_results_2:
        for res in vector_results_2:
            print(f"  ID: {res['id']}, Score: {res['score']:.4f}, Content: '{res['text_content'][:50]}...'")
    else:
        print("  No results found.")


    # 4. Perform a structured query
    print("\nPerforming structured query for Python best practices:")
    structured_results = av_instance.query_structured(
        "SELECT * FROM knowledge_items WHERE content_type = ? AND metadata_json LIKE ?",
        ("rule", '%"level": "best_practice"%') # Search within JSON metadata
    )
    print("Structured Query Results:")
    if structured_results:
        for row in structured_results:
            print(f"  ID: {row['id']}, Content: '{row['text_content']}'")
    else:
        print("  No results found.")

    # 5. Close (automatically handled by atexit, but good practice if not using singleton)
    # av_instance.close()
    print("\nAV Manager standalone test finished.")