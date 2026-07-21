import {
  BOOKABLE_WEEKDAYS,
  buildDaySlots,
  filterAvailableSlots,
} from "@/lib/slots";
import { OVERLAP_MESSAGE, type Appointment, type TimeSlot } from "@/lib/types";

const STORAGE_V1 = "waira-preview-sandbox-v1";
const STORAGE_V2 = "waira-preview-sandbox-v2";

export const SANDBOX_DOCTOR_ID = "sandbox-doctor";

/** Mon=1 … Sat=6 */
export type PresenceWeekday = 1 | 2 | 3 | 4 | 5 | 6;

export type PresenceWindow = {
  weekday: PresenceWeekday;
  start: string; // HH:mm
  end: string; // HH:mm
};

export type Affiliation = {
  clinicId: string;
  windows: PresenceWindow[];
};

export type DoctorSandbox = {
  id: string;
  displayName: string;
  affiliations: Affiliation[];
  appointmentsByClinic: Record<string, Appointment[]>;
};

export type SandboxAppointment = Appointment & { clinicId: string };

export type SandboxResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const DEFAULT_WINDOWS: PresenceWindow[] = [1, 2, 3, 4, 5].flatMap((weekday) => [
  { weekday: weekday as PresenceWeekday, start: "09:00", end: "13:00" },
  { weekday: weekday as PresenceWeekday, start: "15:00", end: "18:00" },
]);

const DEFAULT_CLINIC_IDS = [
  "metropolitano-quito",
  "vozandes-quito",
  "valles-cumbaya",
];

function defaultDoctor(): DoctorSandbox {
  return {
    id: SANDBOX_DOCTOR_ID,
    displayName: "Dra. Demo Waira",
    affiliations: DEFAULT_CLINIC_IDS.map((clinicId) => ({
      clinicId,
      windows: DEFAULT_WINDOWS.map((w) => ({ ...w })),
    })),
    appointmentsByClinic: {},
  };
}

function emptyDoctor(): DoctorSandbox {
  return defaultDoctor();
}

function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function readRawV1(): Record<string, Appointment[]> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_V1);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, Appointment[]>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function migrateFromV1(): DoctorSandbox | null {
  const v1 = readRawV1();
  if (!v1) return null;
  const doctor = defaultDoctor();
  doctor.appointmentsByClinic = { ...v1 };
  const withAppts = Object.keys(v1).filter((id) => (v1[id]?.length ?? 0) > 0);
  for (const clinicId of withAppts) {
    if (!doctor.affiliations.some((a) => a.clinicId === clinicId)) {
      doctor.affiliations.push({
        clinicId,
        windows: DEFAULT_WINDOWS.map((w) => ({ ...w })),
      });
    }
  }
  return doctor;
}

function readDoctor(): DoctorSandbox {
  if (typeof window === "undefined") return emptyDoctor();
  try {
    const raw = window.localStorage.getItem(STORAGE_V2);
    if (raw) {
      const parsed = JSON.parse(raw) as DoctorSandbox;
      if (parsed?.id && Array.isArray(parsed.affiliations)) {
        return {
          ...defaultDoctor(),
          ...parsed,
          appointmentsByClinic: parsed.appointmentsByClinic ?? {},
        };
      }
    }
    const migrated = migrateFromV1();
    if (migrated) {
      writeDoctor(migrated);
      return migrated;
    }
  } catch {
    /* fall through */
  }
  const fresh = defaultDoctor();
  writeDoctor(fresh);
  return fresh;
}

function writeDoctor(doctor: DoctorSandbox) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_V2, JSON.stringify(doctor));
}

export function getSandboxDoctor(): DoctorSandbox {
  return readDoctor();
}

export function saveSandboxDoctor(
  patch: Partial<Pick<DoctorSandbox, "displayName" | "affiliations">>,
): DoctorSandbox {
  const current = readDoctor();
  const next: DoctorSandbox = {
    ...current,
    ...patch,
    id: SANDBOX_DOCTOR_ID,
  };
  writeDoctor(next);
  return next;
}

export function setSandboxAffiliations(affiliations: Affiliation[]): DoctorSandbox {
  return saveSandboxDoctor({ affiliations });
}

export function isClinicAffiliated(clinicId: string): boolean {
  return readDoctor().affiliations.some((a) => a.clinicId === clinicId);
}

export function getAffiliation(clinicId: string): Affiliation | undefined {
  return readDoctor().affiliations.find((a) => a.clinicId === clinicId);
}

export function sandboxResourceId(clinicId: string): string {
  return `sandbox-${clinicId}`;
}

export function listSandboxAppointments(clinicId: string): Appointment[] {
  return readDoctor().appointmentsByClinic[clinicId] ?? [];
}

export function listAllSandboxAppointments(): SandboxAppointment[] {
  const doctor = readDoctor();
  const out: SandboxAppointment[] = [];
  for (const [clinicId, list] of Object.entries(doctor.appointmentsByClinic)) {
    for (const a of list) {
      out.push({ ...a, clinicId });
    }
  }
  return out.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

function allActiveBusy(
  doctor: DoctorSandbox,
  exceptAppointmentId?: string,
): { starts_at: string; ends_at: string; clinicId: string }[] {
  const busy: { starts_at: string; ends_at: string; clinicId: string }[] = [];
  for (const [clinicId, list] of Object.entries(doctor.appointmentsByClinic)) {
    for (const a of list) {
      if (a.status === "cancelled") continue;
      if (exceptAppointmentId && a.id === exceptAppointmentId) continue;
      busy.push({
        starts_at: a.starts_at,
        ends_at: a.ends_at,
        clinicId,
      });
    }
  }
  return busy;
}

function findGlobalOverlap(
  doctor: DoctorSandbox,
  startsAt: string,
  endsAt: string,
  exceptAppointmentId?: string,
): { clinicId: string } | null {
  const hit = allActiveBusy(doctor, exceptAppointmentId).find((b) =>
    rangesOverlap(b.starts_at, b.ends_at, startsAt, endsAt),
  );
  return hit ? { clinicId: hit.clinicId } : null;
}

/** JS Date.getDay(): 0=Sun … 6=Sat → presence weekday 1–6 or null */
export function toPresenceWeekday(day: Date): PresenceWeekday | null {
  const d = day.getDay();
  if (!BOOKABLE_WEEKDAYS.has(d)) return null;
  return d as PresenceWeekday;
}

function parseHm(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function slotInsideWindows(
  slotStart: Date,
  slotEnd: Date,
  windows: PresenceWindow[],
): boolean {
  const weekday = toPresenceWeekday(slotStart);
  if (weekday == null) return false;
  const startMin = slotStart.getHours() * 60 + slotStart.getMinutes();
  const endMin = slotEnd.getHours() * 60 + slotEnd.getMinutes();
  return windows.some((w) => {
    if (w.weekday !== weekday) return false;
    const ws = parseHm(w.start);
    const we = parseHm(w.end);
    return startMin >= ws && endMin <= we;
  });
}

export function listSandboxAvailableSlots(
  clinicId: string,
  dateIso: string,
): { ok: true; slots: TimeSlot[] } | { ok: false; error: string } {
  const doctor = readDoctor();
  const affiliation = doctor.affiliations.find((a) => a.clinicId === clinicId);
  if (!affiliation) {
    return {
      ok: false,
      error: "Esta clínica no está en el panel del doctor demo. Afiliala en Doctor demo.",
    };
  }

  const day = new Date(`${dateIso}T12:00:00`);
  const built = buildDaySlots(day);
  const busy = allActiveBusy(doctor).map((b) => ({
    starts_at: b.starts_at,
    ends_at: b.ends_at,
  }));
  const free = filterAvailableSlots(built, busy);
  const inWindow = free.filter((slot) =>
    slotInsideWindows(
      new Date(slot.startsAt),
      new Date(slot.endsAt),
      affiliation.windows,
    ),
  );
  return { ok: true, slots: inWindow };
}

export function createSandboxAppointment(
  clinicId: string,
  input: {
    startsAt: string;
    endsAt: string;
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    notes?: string;
  },
): SandboxResult {
  const doctor = readDoctor();
  if (!doctor.affiliations.some((a) => a.clinicId === clinicId)) {
    return {
      ok: false,
      error: "Clínica no afiliada al doctor demo.",
    };
  }

  const affiliation = doctor.affiliations.find((a) => a.clinicId === clinicId)!;
  const start = new Date(input.startsAt);
  const end = new Date(input.endsAt);
  if (!slotInsideWindows(start, end, affiliation.windows)) {
    return {
      ok: false,
      error: "Fuera del horario de presencia en esta clínica.",
    };
  }

  const overlap = findGlobalOverlap(doctor, input.startsAt, input.endsAt);
  if (overlap) {
    return {
      ok: false,
      error:
        overlap.clinicId === clinicId
          ? OVERLAP_MESSAGE
          : `${OVERLAP_MESSAGE} (conflicto con otra clínica del doctor).`,
    };
  }

  const list = doctor.appointmentsByClinic[clinicId] ?? [];
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sb-${Date.now()}`;
  const appointment: Appointment = {
    id,
    resource_id: sandboxResourceId(clinicId),
    patient_id: null,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    status: "scheduled",
    notes: input.notes ?? null,
    patients_min: {
      id: `p-${id}`,
      full_name: input.patientName,
      phone: input.patientPhone,
      email: input.patientEmail ?? null,
    },
  };
  doctor.appointmentsByClinic[clinicId] = [...list, appointment];
  writeDoctor(doctor);
  return { ok: true, id };
}

export function moveSandboxAppointment(
  clinicId: string,
  input: { appointmentId: string; startsAt: string; endsAt: string },
): SandboxResult {
  const doctor = readDoctor();
  const list = doctor.appointmentsByClinic[clinicId] ?? [];
  const idx = list.findIndex((a) => a.id === input.appointmentId);
  if (idx < 0) return { ok: false, error: "Turno no encontrado." };

  const affiliation = doctor.affiliations.find((a) => a.clinicId === clinicId);
  if (!affiliation) {
    return { ok: false, error: "Clínica no afiliada al doctor demo." };
  }
  if (
    !slotInsideWindows(
      new Date(input.startsAt),
      new Date(input.endsAt),
      affiliation.windows,
    )
  ) {
    return {
      ok: false,
      error: "Fuera del horario de presencia en esta clínica.",
    };
  }

  const overlap = findGlobalOverlap(
    doctor,
    input.startsAt,
    input.endsAt,
    input.appointmentId,
  );
  if (overlap) {
    return {
      ok: false,
      error:
        overlap.clinicId === clinicId
          ? OVERLAP_MESSAGE
          : `${OVERLAP_MESSAGE} (conflicto con otra clínica del doctor).`,
    };
  }

  const next = [...list];
  next[idx] = {
    ...next[idx],
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    status: "scheduled",
  };
  doctor.appointmentsByClinic[clinicId] = next;
  writeDoctor(doctor);
  return { ok: true };
}

export function cancelSandboxAppointment(
  clinicId: string,
  appointmentId: string,
): SandboxResult {
  const doctor = readDoctor();
  const list = doctor.appointmentsByClinic[clinicId] ?? [];
  const idx = list.findIndex((a) => a.id === appointmentId);
  if (idx < 0) return { ok: false, error: "Turno no encontrado." };
  const next = [...list];
  next[idx] = { ...next[idx], status: "cancelled" };
  doctor.appointmentsByClinic[clinicId] = next;
  writeDoctor(doctor);
  return { ok: true };
}

/** Reset helper for tests / UI */
export function resetSandboxDoctor(seed = defaultDoctor()): void {
  writeDoctor(seed);
}
