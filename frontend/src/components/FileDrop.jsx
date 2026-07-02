import { useState } from "react";
import api, { apiError } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

export default function FileDrop({ label, url, onChange, accept = "image/*,application/pdf" }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  async function pick(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(data.url);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
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
