import sys

with open('frontend/src/App.tsx', 'r') as f:
    content = f.read()

# Atualizar addPatient
search_add = """  const addPatient = (payload: { focus: string; name: string }) => {
    const p: Patient = {
      id: slugify(payload.name),
      initials: initialsFrom(payload.name),
      name: payload.name,
      status: "active",
      focus: payload.focus || "Avaliação inicial",
      hypothesis: "Hipótese em aberto",
      protocol: `${approach.label} · formulação inicial`,
      progress: 8,
      risk: 12,
      sessions: 0,
      lastSeen: "Nunca"
    };
    setPatients([p, ...patients]);
    setModal(null);
  };"""

replace_add = """  const addPatient = async (payload: { focus: string; name: string }) => {
    try {
      const newP = await createAdlerPatient({ name: payload.name, focus: payload.focus });
      const p: Patient = {
        id: newP.id,
        initials: newP.initials,
        name: newP.name,
        status: newP.status,
        focus: newP.focus,
        hypothesis: newP.diagnosis,
        protocol: newP.current_protocol,
        progress: 0,
        risk: 0,
        sessions: newP.default_session,
        lastSeen: "Agora"
      };
      setPatients([p, ...patients]);
      setModal(null);
    } catch (error) {
      console.error("Falha ao criar paciente:", error);
    }
  };"""

# Atualizar schedulePatient
search_sch = """  const schedulePatient = (payload: {
    kind: string;
    mode: string;
    name: string;
    note: string;
    time: string;
  }) => {
    const existing = patients.find((p) => p.name.toLowerCase() === payload.name.toLowerCase());
    const p =
      existing ??
      ({
        id: slugify(payload.name),
        initials: initialsFrom(payload.name),
        name: payload.name,
        status: "active",
        focus: "Nova demanda",
        hypothesis: "Aguardando triagem",
        protocol: "Primeiro contato",
        progress: 0,
        risk: 0,
        sessions: 0,
        lastSeen: "Nunca"
      } as Patient);

    if (!existing) setPatients([p, ...patients]);

    const apt: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      kind: payload.kind,
      mode: payload.mode,
      note: payload.note,
      patientId: p.id,
      time: payload.time
    };

    setAppointments([apt, ...appointments]);
    setModal(null);
  };"""

replace_sch = """  const schedulePatient = async (payload: {
    kind: string;
    mode: string;
    name: string;
    note: string;
    time: string;
  }) => {
    try {
      const newApt = await createAdlerAppointment({
        patient_name: payload.name,
        time: payload.time,
        session_label: payload.kind,
        mode: payload.mode,
        prep_note: payload.note
      });

      // Recarrega bootstrap para garantir que pacientes/agenda estejam sincronizados
      const bootstrap = await fetchAdlerBootstrap();

      const mappedPatients: Patient[] = bootstrap.patients.map(p => ({
        id: p.id,
        name: p.name,
        initials: p.initials,
        status: p.status,
        focus: p.focus,
        hypothesis: p.diagnosis,
        protocol: p.current_protocol,
        sessions: p.default_session,
        progress: 0,
        risk: 0,
        lastSeen: "Recentemente"
      }));

      const mappedAppointments: Appointment[] = bootstrap.dashboard.schedule.map(s => ({
        id: s.id || Math.random().toString(36).substr(2, 9),
        patientId: s.patient_id,
        patientName: s.patient_name,
        time: s.time,
        kind: s.session_label,
        mode: s.mode,
        note: s.prep_note || "",
        status: s.status === "completed" ? "completed" : s.status === "next" ? "next" : "scheduled"
      }));

      setPatients(mappedPatients);
      setAppointments(mappedAppointments);
      setModal(null);
    } catch (error) {
      console.error("Falha ao agendar:", error);
    }
  };"""

if search_add in content:
    content = content.replace(search_add, replace_add)
    print("addPatient atualizado")
else:
    print("addPatient nao encontrado")

if search_sch in content:
    content = content.replace(search_sch, replace_sch)
    print("schedulePatient atualizado")
else:
    print("schedulePatient nao encontrado")

with open('frontend/src/App.tsx', 'w') as f:
    f.write(content)
