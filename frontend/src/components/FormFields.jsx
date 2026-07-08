import ClinicBranchField from "./ClinicBranchField.jsx";

export default function FormFields({ fields, values, onChange }) {
  function set(name, value) {
    onChange({ ...values, [name]: value });
  }

  return (
    <div className="form-grid">
      {fields.map((f) => {
        const val = values[f.name] ?? "";
        const cls = f.full ? "field full" : "field";

        if (f.type === "clinicBranch") {
          return (
            <div className={f.full ? "full" : undefined} key={f.name}>
              <ClinicBranchField
                label={f.label}
                required={f.required}
                value={val}
                onChange={(branchId) => set(f.name, branchId)}
              />
            </div>
          );
        }

        return (
          <div className={cls} key={f.name}>
            <label>
              {f.label} {f.required && <span className="req">*</span>}
            </label>
            {f.type === "select" ? (
              <select value={val} onChange={(e) => set(f.name, e.target.value)} required={f.required}>
                <option value="">{f.placeholder || "Select…"}</option>
                {(f.options || []).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea value={val} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />
            ) : (
              <input
                type={f.type || "text"}
                value={val}
                onChange={(e) => set(f.name, f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
                placeholder={f.placeholder}
                required={f.required}
                min={f.min}
                step={f.step}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
