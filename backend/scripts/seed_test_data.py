import uuid
from backend.core.database import SessionLocal
from backend.models.user import User
from backend.models.adler_patient import AdlerPatient
from backend.models.adler_science_knowledge import AdlerClinicianProfile
from backend.core.security import hash_password

def seed():
    db = SessionLocal()
    try:
        # 1. Create/Update Demo User
        user = db.query(User).filter(User.email == "clinica.demo@adler.ai").first()
        if not user:
            user = User(
                email="clinica.demo@adler.ai",
                name="Érico",
                password_hash=hash_password("demo123"),
                is_approved=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created user {user.email}")
        else:
            user.is_approved = True
            db.commit()
            print(f"Updated user {user.email}")

        # 2. Create Profile
        profile = db.query(AdlerClinicianProfile).filter(AdlerClinicianProfile.user_id == str(user.id)).first()
        if not profile:
            profile = AdlerClinicianProfile(
                user_id=str(user.id),
                primary_approach="schema",
                onboarding_completed=True,
                is_premium=True
            )
            db.add(profile)
            db.commit()
            print("Created profile")
        else:
            profile.onboarding_completed = True
            profile.is_premium = True
            db.commit()
            print("Profile updated")

        # 3. Create Test Patient
        patient = db.query(AdlerPatient).filter(AdlerPatient.name == "Daniel Rocha").first()
        if not patient:
            patient = AdlerPatient(
                id=str(uuid.uuid4()),
                tenant_id=f"user-{user.id}",
                name="Daniel Rocha",
                initials="DR",
                focus="Ansiedade e Performance",
                diagnosis="TAG",
                current_protocol="Protocolo de Terapia do Esquema",
                status="active"
            )
            db.add(patient)
            db.commit()
            print(f"Created patient Daniel Rocha for {user.email}")
        else:
            print("Patient Daniel Rocha already exists")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
