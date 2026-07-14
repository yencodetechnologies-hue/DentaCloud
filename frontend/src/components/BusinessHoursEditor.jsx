import { useEffect, useMemo, useRef, useState } from "react";

const WEEKDAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toTimeValueMaybe(input) {
  const s = String(input || "").trim();
  if (!s) return "";

  // already 24h "HH:mm"
  const m24 = s.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (m24) return `${pad2(Number(m24[1]))}:${pad2(Number(m24[2]))}`;

  // "h:mm AM/PM" (or "hh:mmam")
  const m12 = s.match(/^(\d{1,2})(?::([0-5]\d))?\s*([AaPp][Mm])$/);
  if (m12) {
    let h = Number(m12[1]);
    const mm = Number(m12[2] || "0");
    const ap = m12[3].toLowerCase();
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return `${pad2(h)}:${pad2(mm)}`;
  }

  // "h:mm AM/PM"
  const m12b = s.match(/^(\d{1,2}):([0-5]\d)\s*([AaPp][Mm])$/);
  if (m12b) {
    let h = Number(m12b[1]);
    const mm = Number(m12b[2]);
    const ap = m12b[3].toLowerCase();
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return `${pad2(h)}:${pad2(mm)}`;
  }

  return "";
}

function emptyWeeklySchedule() {
  return WEEKDAYS.reduce((acc, d) => {
    acc[d.key] = { status: "weeklyOff", slots: [{ from: "", to: "" }], breaks: [] };
    return acc;
  }, {});
}

function normalizeRanges(ranges, { keepOnePlaceholder = false } = {}) {
  const out = (ranges || []).map((r) => ({
    from: toTimeValueMaybe(r?.from),
    to: toTimeValueMaybe(r?.to),
  }));

  const meaningful = out.filter((r) => r.from || r.to);
  if (meaningful.length) return meaningful;
  return keepOnePlaceholder ? [{ from: "", to: "" }] : [];
}

function isWeeklyScheduleValue(value) {
  if (!Array.isArray(value)) return false;
  return value.some((x) => x && (x.status || Array.isArray(x.slots) || Array.isArray(x.breaks)));
}

function availabilityToWeeklySchedule(availability) {
  const weekly = emptyWeeklySchedule();
  (availability || []).forEach((slot) => {
    const day = slot?.day;
    if (!weekly[day]) return;
    weekly[day].status = "available";
    weekly[day].slots.push({
      from: toTimeValueMaybe(slot.from),
      to: toTimeValueMaybe(slot.to),
    });
    weekly[day].breaks = [];
  });

  Object.keys(weekly).forEach((day) => {
    weekly[day].slots = normalizeRanges(weekly[day].slots, { keepOnePlaceholder: true });
    weekly[day].breaks = [];
  });

  return weekly;
}

function normalizeDayStatus(status) {
  return status === "available" ? "available" : "weeklyOff";
}

function weeklyScheduleArrayToWeeklyState(weeklyScheduleArray) {
  const weekly = emptyWeeklySchedule();
  (weeklyScheduleArray || []).forEach((dayItem) => {
    const day = dayItem?.day;
    if (!weekly[day]) return;

    const status = normalizeDayStatus(dayItem?.status);
    weekly[day] = {
      status,
      slots: normalizeRanges(dayItem?.slots, { keepOnePlaceholder: true }),
      breaks: [],
    };
  });

  Object.keys(weekly).forEach((day) => {
    if (weekly[day].status === "available") {
      weekly[day].slots = normalizeRanges(weekly[day].slots, { keepOnePlaceholder: true });
    }
    weekly[day].breaks = [];
  });

  return weekly;
}

function weeklyStateToWeeklyScheduleArray(weekly) {
  return WEEKDAYS.map((d) => {
    const dayState = weekly?.[d.key] || { status: "weeklyOff", slots: [], breaks: [] };
    const status = normalizeDayStatus(dayState.status);
    // Keep incomplete start/end while editing so values don't get wiped on re-render
    let slots = (dayState.slots || []).map((r) => ({
      from: toTimeValueMaybe(r?.from) || String(r?.from || "").trim(),
      to: toTimeValueMaybe(r?.to) || String(r?.to || "").trim(),
    })).filter((r) => r.from || r.to);

    if (status === "available" && !slots.length) {
      slots = [{ from: "", to: "" }];
    }

    return { day: d.key, status, slots, breaks: [] };
  });
}

function weeklyStateToLegacyAvailability(weekly) {
  const out = [];
  WEEKDAYS.forEach((d) => {
    const dayState = weekly?.[d.key];
    if (!dayState || dayState.status !== "available") return;
    (dayState.slots || []).forEach((s) => {
      const from = String(s?.from || "").trim();
      const to = String(s?.to || "").trim();
      if (!from || !to) return;
      out.push({ day: d.key, from, to });
    });
  });
  return out;
}

function timeToMinutes(t) {
  const m = String(t || "").match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function overlaps(a, b) {
  const a1 = timeToMinutes(a.from);
  const a2 = timeToMinutes(a.to);
  const b1 = timeToMinutes(b.from);
  const b2 = timeToMinutes(b.to);
  if (a1 == null || a2 == null || b1 == null || b2 == null) return false;
  return Math.max(a1, b1) < Math.min(a2, b2);
}

function validateRanges(label, ranges) {
  const items = (ranges || []).filter((r) => r.from || r.to);
  const errors = [];

  items.forEach((r, i) => {
    if (!r.from || !r.to) return;
    const a = timeToMinutes(r.from);
    const b = timeToMinutes(r.to);
    if (a == null || b == null) return;
    if (a >= b) errors.push(`${label} #${i + 1}: start time must be before end time`);
  });

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (!items[i].from || !items[i].to || !items[j].from || !items[j].to) continue;
      if (overlaps(items[i], items[j])) errors.push(`${label} overlaps between #${i + 1} and #${j + 1}`);
    }
  }

  return errors;
}

export default function BusinessHoursEditor({ value = [], onChange }) {
  const initial = useMemo(() => {
    if (isWeeklyScheduleValue(value)) return weeklyScheduleArrayToWeeklyState(value);
    return availabilityToWeeklySchedule(value);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- seed once from opening form values
  const [weekly, setWeekly] = useState(initial);
  const lastEmittedRef = useRef("");

  useEffect(() => {
    const nextState = isWeeklyScheduleValue(value)
      ? weeklyScheduleArrayToWeeklyState(value)
      : availabilityToWeeklySchedule(value);
    const nextSerialized = JSON.stringify(weeklyStateToWeeklyScheduleArray(nextState));

    // Ignore echoes of our own onChange so mid-edit times are not reset
    if (nextSerialized === lastEmittedRef.current) return;

    lastEmittedRef.current = nextSerialized;
    setWeekly(nextState);
  }, [value]);

  function update(nextWeekly) {
    setWeekly(nextWeekly);
    const weeklySchedule = weeklyStateToWeeklyScheduleArray(nextWeekly);
    lastEmittedRef.current = JSON.stringify(weeklySchedule);
    onChange?.({
      weeklySchedule,
      availability: weeklyStateToLegacyAvailability(nextWeekly),
    });
  }

  function setStatus(day, status) {
    const nextStatus = normalizeDayStatus(status);
    const prev = weekly[day] || { status: "weeklyOff", slots: [{ from: "", to: "" }], breaks: [] };
    const nextDay =
      nextStatus === "available"
        ? { ...prev, status: nextStatus, slots: normalizeRanges(prev.slots, { keepOnePlaceholder: true }), breaks: [] }
        : { ...prev, status: nextStatus, breaks: [] };
    update({ ...weekly, [day]: nextDay });
  }

  function setSlot(day, idx, patch) {
    const dayState = weekly[day] || { status: "available", slots: [{ from: "", to: "" }], breaks: [] };
    const list = [...(dayState.slots || [])];
    list[idx] = { ...(list[idx] || { from: "", to: "" }), ...patch };
    update({ ...weekly, [day]: { ...dayState, slots: list, breaks: [] } });
  }

  function addSlot(day) {
    const dayState = weekly[day] || { status: "available", slots: [], breaks: [] };
    const list = [...(dayState.slots || []), { from: "", to: "" }];
    update({ ...weekly, [day]: { ...dayState, slots: list, breaks: [] } });
  }

  function removeSlot(day, idx) {
    const dayState = weekly[day] || { status: "available", slots: [], breaks: [] };
    const list = (dayState.slots || []).filter((_, i) => i !== idx);
    update({
      ...weekly,
      [day]: {
        ...dayState,
        slots: list.length ? list : [{ from: "", to: "" }],
        breaks: [],
      },
    });
  }

  function copyMondayToWeekdays() {
    const mon = weekly.mon;
    const slots = (mon?.slots || []).map((s) => ({ from: s.from || "", to: s.to || "" }));
    const copied = {
      status: normalizeDayStatus(mon?.status),
      slots: slots.length ? slots : [{ from: "", to: "" }],
      breaks: [],
    };
    update({
      ...weekly,
      tue: { ...copied, slots: copied.slots.map((s) => ({ ...s })) },
      wed: { ...copied, slots: copied.slots.map((s) => ({ ...s })) },
      thu: { ...copied, slots: copied.slots.map((s) => ({ ...s })) },
      fri: { ...copied, slots: copied.slots.map((s) => ({ ...s })) },
    });
  }

  return (
    <div className="business-hours">
      <div className="business-hours-header">
        <div>
          <div className="business-hours-title">Weekly Hours</div>
          <div className="business-hours-subtitle">Set availability and working hours for each day</div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={copyMondayToWeekdays}>
          Copy Monday to Weekdays
        </button>
      </div>

      <div className="business-hours-list">
        {WEEKDAYS.map((d) => {
          const dayState = weekly[d.key];
          const status = normalizeDayStatus(dayState?.status || "weeklyOff");
          const isAvailable = status === "available";
          const slots = dayState?.slots?.length ? dayState.slots : [{ from: "", to: "" }];
          const dayErrors = isAvailable ? validateRanges("Working hours", slots) : [];
          return (
            <div key={d.key} className={`business-hours-row ${status !== "available" ? "is-closed" : "is-open"}`}>
              <div className="bh-row-top">
                <div className="business-hours-day">
                  <div className="bh-day-label">{d.label}</div>
                  <div className={`bh-status-chip status-${status}`}>
                    {status === "available" ? "Available" : "Weekly off"}
                  </div>
                </div>

                <div className="bh-status">
                  <div className="bh-segmented" role="group" aria-label={`${d.label} status`}>
                    <button type="button" className={`bh-seg ${status === "available" ? "active" : ""}`} onClick={() => setStatus(d.key, "available")}>
                      Available
                    </button>
                    <button type="button" className={`bh-seg ${status === "weeklyOff" ? "active" : ""}`} onClick={() => setStatus(d.key, "weeklyOff")}>
                      Weekly off
                    </button>
                  </div>
                </div>
              </div>

              <div className="business-hours-slots">
                {!isAvailable ? (
                  <div className="bh-closed-note">No working hours</div>
                ) : (
                  <div className="bh-available">
                    {slots.map((slot, idx) => (
                      <div key={idx} className="bh-hours-row">
                        <label className="bh-hours-label">Start</label>
                        <input
                          type="time"
                          value={slot.from || ""}
                          onChange={(e) => setSlot(d.key, idx, { from: e.target.value })}
                        />
                        <span className="business-hours-sep">to</span>
                        <label className="bh-hours-label">End</label>
                        <input
                          type="time"
                          value={slot.to || ""}
                          onChange={(e) => setSlot(d.key, idx, { to: e.target.value })}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeSlot(d.key, idx)}
                          disabled={slots.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    <div className="bh-actions">
                      <button type="button" className="btn btn-sm" onClick={() => addSlot(d.key)}>
                        + Add hours
                      </button>
                    </div>

                    {dayErrors.length ? (
                      <div className="bh-errors">
                        {dayErrors.map((e, i) => (
                          <div key={i} className="bh-error">
                            {e}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

