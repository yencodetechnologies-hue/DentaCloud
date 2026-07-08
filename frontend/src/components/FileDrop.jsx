import { useState } from "react";
import api, { apiError } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

export default function FileDrop({ label, url, files, onChange, accept = "image/*,application/pdf" }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const multi = Array.isArray(files);

  async function pick(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (multi) {
        onChange([...(files || []), data.url]);
      } else {
        onChange(data.url);
      }
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  if (multi) {
    return (
      <div className="field">
        {label && <label>{label}</label>}
        {(files || []).map((f, i) => (
          <div className="file-pill solo" key={f}>
            <a href={f} target="_blank" rel="noreferrer">File {i + 1}</a>
            <button type="button" onClick={() => onChange(files.filter((_, idx) => idx !== i))}>✕</button>
          </div>
        ))}
        <label className="dropzone">
          <span>{uploading ? "Uploading…" : "📎 Add file"}</span>
          <input type="file" accept={accept} hidden onChange={(e) => pick(e.target.files?.[0])} />
        </label>
      </div>
    );
  }

  return (
    <div className="field">
      <label>{label} <span className="hint">optional</span></label>
      {url ? (
        <div className="file-pill solo">
          <a href={url} target="_blank" rel="noreferrer">{url.split("/").pop()}</a>
          <button type="button" onClick={() => onChange("")}>✕</button>
        </div>
      ) : (
        <label className="dropzone">
          <span>{uploading ? "Uploading…" : "📎 Click to upload"}</span>
          <input type="file" accept={accept} hidden onChange={(e) => pick(e.target.files?.[0])} />
        </label>
      )}
    </div>
  );
}
