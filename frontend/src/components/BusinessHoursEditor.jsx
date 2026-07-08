import { useEffect, useMemo, useState } from "react";

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
  });

  // Remove placeholder slots when real slots exist
  Object.keys(weekly).forEach((day) => {
    weekly[day].slots = normalizeRanges(weekly[day].slots, { keepOnePlaceholder: true });
  });

  return weekly;
}

function weeklyScheduleArrayToWeeklyState(weeklyScheduleArray) {
  const weekly = emptyWeeklySchedule();
  (weeklyScheduleArray || []).forEach((dayItem) => {
    const day = dayItem?.day;
    if (!weekly[day]) return;

    const status = ["available", "weeklyOff", "holiday"].includes(dayItem?.status) ? dayItem.status : "weeklyOff";
    weekly[day] = {
      status,
      slots: normalizeRanges(dayItem?.slots, { keepOnePlaceholder: true }),
      breaks: normalizeRanges(dayItem?.breaks, { keepOnePlaceholder: false }),
    };
  });

  // ensure available days keep one slot placeholder
  Object.keys(weekly).forEach((day) => {
    if (weekly[day].status === "available") {
      weekly[day].slots = normalizeRanges(weekly[day].slots, { keepOnePlaceholder: true });
    }
  });

  return weekly;
}

function weeklyStateToWeeklyScheduleArray(weekly) {
  return WEEKDAYS.map((d) => {
    const dayState = weekly?.[d.key] || { status: "weeklyOff", slots: [], breaks: [] };
    const status = ["available", "weeklyOff", "holiday"].includes(dayState.status) ? dayState.status : "weeklyOff";
    const slots = normalizeRanges(dayState.slots, { keepOnePlaceholder: false }).filter((r) => r.from && r.to);
    const breaks = normalizeRanges(dayState.breaks, { keepOnePlaceholder: false }).filter((r) => r.from && r.to);
    return { day: d.key, status, slots, breaks };
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

function validateBreaksWithinSlots(breaks, slots) {
  const b = (breaks || []).filter((r) => r.from && r.to);
  const s = (slots || []).filter((r) => r.from && r.to);
  const errors = [];
  if (!b.length) return errors;
  if (!s.length) return ["Breaks require at least one working slot"];

  b.forEach((br, idx) => {
    const brStart = timeToMinutes(br.from);
    const brEnd = timeToMinutes(br.to);
    if (brStart == null || brEnd == null) return;
    const ok = s.some((sl) => {
      const slStart = timeToMinutes(sl.from);
      const slEnd = timeToMinutes(sl.to);
      if (slStart == null || slEnd == null) return false;
      return slStart <= brStart && brEnd <= slEnd;
    });
    if (!ok) errors.push(`Break #${idx + 1} must be inside a working slot`);
  });

  return errors;
}

export default function BusinessHoursEditor({ value = [], onChange }) {
  const initial = useMemo(() => {
    if (isWeeklyScheduleValue(value)) return weeklyScheduleArrayToWeeklyState(value);
    return availabilityToWeeklySchedule(value);
  }, [value]);
  const [weekly, setWeekly] = useState(initial);

  useEffect(() => {
    if (isWeeklyScheduleValue(value)) setWeekly(weeklyScheduleArrayToWeeklyState(value));
    else setWeekly(availabilityToWeeklySchedule(value));
  }, [value]);

  function update(nextWeekly) {
    setWeekly(nextWeekly);
    onChange?.({
      weeklySchedule: weeklyStateToWeeklyScheduleArray(nextWeekly),
      availability: weeklyStateToLegacyAvailability(nextWeekly),
    });
  }

  function setStatus(day, status) {
    const prev = weekly[day] || { status: "weeklyOff", slots: [{ from: "", to: "" }], breaks: [] };
    const nextDay =
      status === "available"
        ? { ...prev, status, slots: normalizeRanges(prev.slots, { keepOnePlaceholder: true }) }
        : { ...prev, status };
    update({ ...weekly, [day]: nextDay });
  }

  function setSlot(day, idx, patch, which = "slots") {
    const dayState = weekly[day];
    const list = [...(dayState[which] || [])];
    list[idx] = { ...list[idx], ...patch };
    update({ ...weekly, [day]: { ...dayState, [which]: list } });
  }

  function addRange(day, which = "slots") {
    const dayState = weekly[day];
    const list = [...(dayState[which] || []), { from: "", to: "" }];
    update({ ...weekly, [day]: { ...dayState, [which]: list } });
  }

  function removeRange(day, idx, which = "slots") {
    const dayState = weekly[day];
    const list = (dayState[which] || []).filter((_, i) => i !== idx);
    const nextList =
      which === "slots" ? (list.length ? list : [{ from: "", to: "" }]) : list;
    update({ ...weekly, [day]: { ...dayState, [which]: nextList } });
  }

  function copyMondayToWeekdays() {
    const mon = weekly.mon;
    update({
      ...weekly,
      tue: { status: mon.status, slots: (mon.slots || []).map((s) => ({ from: s.from, to: s.to })), breaks: (mon.breaks || []).map((b) => ({ from: b.from, to: b.to })) },
      wed: { status: mon.status, slots: (mon.slots || []).map((s) => ({ from: s.from, to: s.to })), breaks: (mon.breaks || []).map((b) => ({ from: b.from, to: b.to })) },
      thu: { status: mon.status, slots: (mon.slots || []).map((s) => ({ from: s.from, to: s.to })), breaks: (mon.breaks || []).map((b) => ({ from: b.from, to: b.to })) },
      fri: { status: mon.status, slots: (mon.slots || []).map((s) => ({ from: s.from, to: s.to })), breaks: (mon.breaks || []).map((b) => ({ from: b.from, to: b.to })) },
    });
  }

  return (
    <div className="business-hours">
      <div className="business-hours-header">
        <div className="business-hours-title">Weekly Hours</div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={copyMondayToWeekdays}>
          Copy Monday to Weekdays
        </button>
      </div>

      {WEEKDAYS.map((d) => {
        const dayState = weekly[d.key];
        const status = dayState?.status || "weeklyOff";
        const isAvailable = status === "available";
        const slotErrors = isAvailable ? validateRanges("Working hours", dayState?.slots || []) : [];
        const breakErrors = isAvailable ? validateRanges("Break", dayState?.breaks || []) : [];
        const breakWithinErrors = isAvailable ? validateBreaksWithinSlots(dayState?.breaks || [], dayState?.slots || []) : [];
        const dayErrors = [...slotErrors, ...breakErrors, ...breakWithinErrors];
        return (
          <div key={d.key} className={`business-hours-row ${status !== "available" ? "is-closed" : ""}`}>
            <div className="business-hours-day">
              <div className="bh-day-label">{d.label}</div>
              <div className={`bh-status-chip status-${status}`}>
                {status === "available" ? "Available" : status === "holiday" ? "Holiday" : "Weekly off"}
              </div>
            </div>

            <div className="bh-status">
              <div className="bh-segmented">
                <button type="button" className={`bh-seg ${status === "available" ? "active" : ""}`} onClick={() => setStatus(d.key, "available")}>
                  Available
                </button>
                <button type="button" className={`bh-seg ${status === "weeklyOff" ? "active" : ""}`} onClick={() => setStatus(d.key, "weeklyOff")}>
                  Weekly off
                </button>
                <button type="button" className={`bh-seg ${status === "holiday" ? "active" : ""}`} onClick={() => setStatus(d.key, "holiday")}>
                  Holiday
                </button>
              </div>
            </div>

            <div className="business-hours-slots">
              {!isAvailable ? (
                <div className="muted">{status === "holiday" ? "Holiday (no appointments)" : "No working hours"}</div>
              ) : (
                <div className="bh-available">
                  <div className="bh-section">
                    <div className="bh-section-title">Working hours</div>
                    {(dayState?.slots || []).map((s, idx) => (
                      <div key={idx} className="business-hours-slot">
                        <input type="time" value={s.from || ""} onChange={(e) => setSlot(d.key, idx, { from: e.target.value }, "slots")} />
                        <span className="business-hours-sep">to</span>
                        <input type="time" value={s.to || ""} onChange={(e) => setSlot(d.key, idx, { to: e.target.value }, "slots")} />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeRange(d.key, idx, "slots")}
                          disabled={(dayState?.slots || []).length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="bh-actions">
                      <button type="button" className="btn btn-sm" onClick={() => addRange(d.key, "slots")}>
                        + Add hours
                      </button>
                    </div>
                  </div>

                  <div className="bh-section">
                    <div className="bh-section-title">Breaks</div>
                    {(dayState?.breaks || []).length ? (
                      (dayState?.breaks || []).map((b, idx) => (
                        <div key={idx} className="business-hours-slot bh-break">
                          <input type="time" value={b.from || ""} onChange={(e) => setSlot(d.key, idx, { from: e.target.value }, "breaks")} />
                          <span className="business-hours-sep">to</span>
                          <input type="time" value={b.to || ""} onChange={(e) => setSlot(d.key, idx, { to: e.target.value }, "breaks")} />
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeRange(d.key, idx, "breaks")}>
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="muted">No breaks</div>
                    )}
                    <div className="bh-actions">
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => addRange(d.key, "breaks")}>
                        + Add break
                      </button>
                    </div>
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
  );
}

