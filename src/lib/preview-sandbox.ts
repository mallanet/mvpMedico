import {
  BOOKABLE_WEEKDAYS,
  buildDaySlots,
  filterAvailableSlots,
} from "@/lib/slots";
import { OVERLAP_MESSAGE, type Appointment, type TimeSlot } from "@/lib/types";
import { joinPatientName } from "@/lib/patient-name";

const STORAGE_V1 = "waira-preview-sandbox-v1";
const STORAGE_V2 = "waira-preview-sandbox-v2";
const STORAGE_V3 = "waira-preview-sandbox-v3";

export const SANDBOX_DOCTOR_ID = "sandbox-doctor";

/** Mon=1 … Sat=6 */
export type PresenceWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

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
  specialty: string;
  zone: string;
  bioShort: string;
  /** Bumped when default mock appointments / profile change. */
  seedVersion: number;
  affiliations: Affiliation[];
  appointmentsByClinic: Record<string, Appointment[]>;
};

export const SANDBOX_SEED_VERSION = 3;

export type SandboxAppointment = Appointment & { clinicId: string };

export type SandboxResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const DEFAULT_WINDOWS: PresenceWindow[] = [0, 1, 2, 3, 4, 5, 6].map(
  (weekday) => ({
    weekday: weekday as PresenceWeekday,
    start: "08:00",
    end: "20:00",
  }),
);

const DEFAULT_CLINIC_IDS = [
  "metropolitano-quito",
  "vozandes-quito",
  "valles-cumbaya",
];

function localSlotIso(daysFromToday: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function mockAppointment(
  clinicId: string,
  daysFromToday: number,
  hour: number,
  minute: number,
  patient: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  },
  notes: string | null,
  status: Appointment["status"] = "scheduled",
): Appointment {
  const id = `seed-${clinicId}-d${daysFromToday}-${hour}${String(minute).padStart(2, "0")}`;
  const starts_at = localSlotIso(daysFromToday, hour, minute);
  const ends_at = new Date(
    new Date(starts_at).getTime() + 30 * 60 * 1000,
  ).toISOString();
  return {
    id,
    resource_id: `sandbox-${clinicId}`,
    patient_id: null,
    starts_at,
    ends_at,
    status,
    notes,
    patients_min: {
      id: `p-${id}`,
      full_name: joinPatientName(patient.firstName, patient.lastName),
      phone: patient.phone,
      email: patient.email ?? null,
    },
  };
}

/** Cross-clinic demo load: no overlaps, presence 08–20. */
export function buildMockAppointments(): Record<string, Appointment[]> {
  return {
    "metropolitano-quito": [
      mockAppointment(
        "metropolitano-quito",
        1,
        9,
        0,
        {
          firstName: "Ana",
          lastName: "Torres",
          phone: "0991112233",
          email: "ana.torres@example.com",
        },
        "Control anual",
      ),
      mockAppointment(
        "metropolitano-quito",
        2,
        11,
        30,
        {
          firstName: "Carlos",
          lastName: "Mendoza",
          phone: "0987654321",
        },
        "Resultados de laboratorio",
        "confirmed",
      ),
    ],
    "vozandes-quito": [
      mockAppointment(
        "vozandes-quito",
        1,
        15,
        0,
        {
          firstName: "Lucía",
          lastName: "Vargas",
          phone: "0976543210",
          email: "lucia.vargas@example.com",
        },
        "Primera consulta",
      ),
      mockAppointment(
        "vozandes-quito",
        3,
        10,
        0,
        {
          firstName: "Diego",
          lastName: "Salazar",
          phone: "0965432109",
        },
        null,
      ),
    ],
    "valles-cumbaya": [
      mockAppointment(
        "valles-cumbaya",
        2,
        16,
        0,
        {
          firstName: "María",
          lastName: "Gómez",
          phone: "0954321098",
          email: "maria.gomez@example.com",
        },
        "Seguimiento",
      ),
      mockAppointment(
        "valles-cumbaya",
        4,
        9,
        30,
        {
          firstName: "Pedro",
          lastName: "Jiménez",
          phone: "0943210987",
        },
        "Chequeo",
        "confirmed",
      ),
    ],
  };
}

function defaultDoctor(): DoctorSandbox {
  return {
    id: SANDBOX_DOCTOR_ID,
    displayName: "Dra. Valentina Reyes",
    specialty: "Cardiología",
    zone: "Quito · multi-sede",
    bioShort:
      "Cardiología en varias sedes con agenda única anti-solape. Pedí turno eligiendo clínica y horario.",
    seedVersion: SANDBOX_SEED_VERSION,
    affiliations: DEFAULT_CLINIC_IDS.map((clinicId) => ({
      clinicId,
      windows: DEFAULT_WINDOWS.map((w) => ({ ...w })),
    })),
    appointmentsByClinic: buildMockAppointments(),
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

function ensureFullWeekWindows(affiliations: Affiliation[]): {
  affiliations: Affiliation[];
  changed: boolean;
} {
  let changed = false;
  const next = affiliations.map((a) => {
    const have = new Set(a.windows.map((w) => w.weekday));
    const missing = DEFAULT_WINDOWS.filter((w) => !have.has(w.weekday));
    if (missing.length === 0) return a;
    changed = true;
    return { ...a, windows: [...a.windows, ...missing.map((w) => ({ ...w }))] };
  });
  return { affiliations: next, changed };
}

function hasAnyAppointments(
  appointmentsByClinic: Record<string, Appointment[]>,
): boolean {
  return Object.values(appointmentsByClinic).some((list) =>
    (list ?? []).some((a) => a.status !== "cancelled"),
  );
}

function mergeMissingMockAppointments(
  current: Record<string, Appointment[]>,
): { next: Record<string, Appointment[]>; changed: boolean } {
  const mock = buildMockAppointments();
  let changed = false;
  const next: Record<string, Appointment[]> = { ...current };
  for (const [clinicId, list] of Object.entries(mock)) {
    if ((next[clinicId] ?? []).length === 0) {
      next[clinicId] = list;
      changed = true;
    }
  }
  return { next, changed };
}

function normalizeDoctor(parsed: Partial<DoctorSandbox>): {
  doctor: DoctorSandbox;
  changed: boolean;
} {
  const defaults = defaultDoctor();
  let appointmentsByClinic =
    parsed.appointmentsByClinic ?? defaults.appointmentsByClinic;
  const seedVersion = parsed.seedVersion ?? 0;
  let seedChanged = false;

  if (seedVersion < SANDBOX_SEED_VERSION) {
    if (!hasAnyAppointments(appointmentsByClinic)) {
      appointmentsByClinic = defaults.appointmentsByClinic;
      seedChanged = true;
    } else {
      const merged = mergeMissingMockAppointments(appointmentsByClinic);
      appointmentsByClinic = merged.next;
      seedChanged = merged.changed || seedVersion < SANDBOX_SEED_VERSION;
    }
  }

  const affiliationsRaw =
    Array.isArray(parsed.affiliations) && parsed.affiliations.length > 0
      ? parsed.affiliations
      : defaults.affiliations;
  const ensured = ensureFullWeekWindows(affiliationsRaw);

  const refreshIdentity =
    seedVersion < 3 &&
    (!parsed.displayName ||
      parsed.displayName.includes("Demo Waira") ||
      parsed.specialty === "Medicina familiar");

  const doctor: DoctorSandbox = {
    ...defaults,
    ...parsed,
    id: SANDBOX_DOCTOR_ID,
    displayName: refreshIdentity
      ? defaults.displayName
      : parsed.displayName?.trim() || defaults.displayName,
    specialty: refreshIdentity
      ? defaults.specialty
      : parsed.specialty?.trim() || defaults.specialty,
    zone: refreshIdentity
      ? defaults.zone
      : parsed.zone?.trim() || defaults.zone,
    bioShort: refreshIdentity
      ? defaults.bioShort
      : parsed.bioShort?.trim() || defaults.bioShort,
    seedVersion: Math.max(seedVersion, SANDBOX_SEED_VERSION),
    affiliations: ensured.affiliations,
    appointmentsByClinic,
  };

  const changed =
    ensured.changed ||
    seedChanged ||
    refreshIdentity ||
    seedVersion < SANDBOX_SEED_VERSION ||
    !parsed.specialty ||
    !parsed.zone ||
    !parsed.bioShort;

  return { doctor, changed };
}

function readDoctor(): DoctorSandbox {
  if (typeof window === "undefined") return emptyDoctor();
  try {
    const rawV3 = window.localStorage.getItem(STORAGE_V3);
    if (rawV3) {
      const parsed = JSON.parse(rawV3) as Partial<DoctorSandbox>;
      if (parsed?.id && Array.isArray(parsed.affiliations)) {
        const { doctor, changed } = normalizeDoctor(parsed);
        if (changed) writeDoctor(doctor);
        return doctor;
      }
    }

    // v2 → v3: keep appointments/affiliations, refresh presence to full demo day
    const rawV2 = window.localStorage.getItem(STORAGE_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as Partial<DoctorSandbox>;
      if (parsed?.id && Array.isArray(parsed.affiliations)) {
        const { doctor } = normalizeDoctor({
          ...parsed,
          affiliations: (parsed.affiliations.length
            ? parsed.affiliations
            : defaultDoctor().affiliations
          ).map((a) => ({
            clinicId: a.clinicId,
            windows: DEFAULT_WINDOWS.map((w) => ({ ...w })),
          })),
        });
        writeDoctor(doctor);
        return doctor;
      }
    }

    const migrated = migrateFromV1();
    if (migrated) {
      const { doctor } = normalizeDoctor(migrated);
      writeDoctor(doctor);
      return doctor;
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
  window.localStorage.setItem(STORAGE_V3, JSON.stringify(doctor));
}

export function getSandboxDoctor(): DoctorSandbox {
  return readDoctor();
}

export function saveSandboxDoctor(
  patch: Partial<
    Pick<
      DoctorSandbox,
      "displayName" | "specialty" | "zone" | "bioShort" | "affiliations"
    >
  >,
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

/** JS Date.getDay(): 0=Sun … 6=Sat */
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

/** First bookable date (yyyy-MM-dd) with at least one free slot, or null. */
export function findNextSandboxDateWithSlots(
  clinicId: string,
  fromDays: Date[],
): string | null {
  for (const day of fromDays) {
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    const result = listSandboxAvailableSlots(clinicId, iso);
    if (result.ok && result.slots.length > 0) return iso;
  }
  return null;
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

export function applyDemoPresenceWindows(): DoctorSandbox {
  const current = readDoctor();
  const affiliations = current.affiliations.map((a) => ({
    clinicId: a.clinicId,
    windows: DEFAULT_WINDOWS.map((w) => ({ ...w })),
  }));
  return saveSandboxDoctor({ affiliations });
}

/** Reset helper for tests / UI */
export function resetSandboxDoctor(seed = defaultDoctor()): void {
  writeDoctor(seed);
}
