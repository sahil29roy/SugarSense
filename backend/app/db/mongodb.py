import logging
import os
from typing import Optional
from pymongo import DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, PyMongoError

logger = logging.getLogger("sugarsense.database")

DEFAULT_MONGODB_URI = "mongodb://localhost:27017/"
DEFAULT_MONGODB_DATABASE = "sugarsense"
SCREENINGS_COLLECTION = "screenings"

_mongo_client: Optional[MongoClient] = None


def get_mongodb_uri() -> str:
    """Retrieve MongoDB URI from environment with default local fallback."""
    return os.getenv("MONGODB_URI", DEFAULT_MONGODB_URI)


def get_database_name() -> str:
    """Retrieve MongoDB database name from environment with default fallback."""
    return os.getenv("MONGODB_DATABASE", DEFAULT_MONGODB_DATABASE)


def get_mongodb_client() -> MongoClient:
    """Return singleton MongoClient with quick failover timeouts."""
    global _mongo_client
    if _mongo_client is None:
        uri = get_mongodb_uri()
        _mongo_client = MongoClient(
            uri,
            serverSelectionTimeoutMS=2000,
            connectTimeoutMS=2000,
            socketTimeoutMS=2000,
        )
    return _mongo_client


def get_database() -> Database:
    """Return configured MongoDB Database instance."""
    client = get_mongodb_client()
    db_name = get_database_name()
    return client[db_name]


def get_screening_collection() -> Collection:
    """Return screening records collection."""
    db = get_database()
    return db[SCREENINGS_COLLECTION]


def ping_mongodb() -> bool:
    """Verify live connectivity to MongoDB server via administrative ping."""
    try:
        client = get_mongodb_client()
        client.admin.command("ping")
        return True
    except (ConnectionFailure, PyMongoError) as exc:
        logger.warning("MongoDB ping failed: %s", exc.__class__.__name__)
        return False
    except Exception as exc:
        logger.warning("Unexpected error during MongoDB ping: %s", exc.__class__.__name__)
        return False


def init_db_indexes() -> bool:
    """Initialize essential performance indexes on MongoDB collections."""
    try:
        if not ping_mongodb():
            logger.info("MongoDB unavailable; skipping index initialization.")
            return False

        collection = get_screening_collection()
        collection.create_index([("created_at", DESCENDING)], name="idx_created_at_desc")
        logger.info("MongoDB indexes verified successfully.")
        return True
    except Exception as exc:
        logger.warning("Could not initialize MongoDB indexes: %s", exc)
        return False


def connect_to_mongodb() -> bool:
    """Establish connection and check connectivity on startup."""
    is_connected = ping_mongodb()
    if is_connected:
        logger.info("Successfully connected to MongoDB database '%s'", get_database_name())
        init_db_indexes()
    else:
        logger.warning(
            "MongoDB is not currently reachable at '%s'. "
            "Application will run with screening persistence in degraded mode.",
            get_mongodb_uri().split("@")[-1]  # Strip any credentials safely
        )
    return is_connected


def close_mongodb_connection() -> None:
    """Cleanly close MongoDB client connection on application shutdown."""
    global _mongo_client
    if _mongo_client is not None:
        try:
            _mongo_client.close()
            logger.info("MongoDB client connection closed cleanly.")
        except Exception as exc:
            logger.warning("Error closing MongoDB connection: %s", exc)
        finally:
            _mongo_client = None
