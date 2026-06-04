import sys

with open('frontend/src/App.tsx', 'r') as f:
    content = f.read()

search_text = """  useEffect(() => {
    let active = true;

    void restoreSession().then((sessionPayload) => {
      if (!active) return;
      setAuthSession(sessionPayload);
      setAuthReady(true);
    });

    return () => {
      active = false;
    };
  }, []);"""

replace_text = """  useEffect(() => {
    let active = true;

    void restoreSession().then(async (sessionPayload) => {
      if (!active) return;
      setAuthSession(sessionPayload);

      if (sessionPayload) {
        try {
          const bootstrap = await fetchAdlerBootstrap();
          if (!active) return;

          // Mapeia os dados do backend para os tipos do frontend
          const mappedPatients: Patient[] = bootstrap.patients.map(p => ({
            id: p.id,
            name: p.name,
            initials: p.initials,
            status: p.status,
            focus: p.focus,
            hypothesis: p.diagnosis,
            protocol: p.current_protocol,
            sessions: p.default_session,
            progress: 0, // Backend nao tem progresso ainda
            risk: 0,     // Backend nao tem risco base no registro
            lastSeen: "Recentemente"
          }));

          const mappedAppointments: Appointment[] = bootstrap.dashboard.schedule.map(s => ({
            id: s.id || Math.random().toString(36).substr(2, 9),
            patientId: s.patient_id,
            patientName: s.patient_name,
            time: s.time,
            kind: s.session_label,
            mode: s.mode,
            status: s.status === "completed" ? "completed" : s.status === "next" ? "next" : "scheduled"
          }));

          setPatients(mappedPatients);
          setAppointments(mappedAppointments);
        } catch (error) {
          print("Erro no bootstrap:", error);
        }
      }

      setAuthReady(true);
    });

    return () => {
      active = false;
    };
  }, []);"""

if search_text in content:
    new_content = content.replace(search_text, replace_text)
    with open('frontend/src/App.tsx', 'w') as f:
        f.write(new_content)
    print("Sucesso ao atualizar App.tsx")
else:
    print("Texto nao encontrado")
