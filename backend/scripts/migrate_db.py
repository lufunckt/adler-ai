from backend.core.database import init_db, engine
from backend.models.base import Base

def migrate():
    print("Dropping existing tables to apply new schema...")
    Base.metadata.drop_all(bind=engine)
    print("Creating new tables...")
    init_db()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
