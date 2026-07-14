export default function ProfilePictureField({
  url,
  uploading = false,
  onPick,
  onClear,
  alt = "Profile",
}) {
  function handlePick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onPick?.(file);
  }

  return (
    <div className="doctor-profile-photo-body">
      <label
        className={`doctor-profile-avatar ${uploading ? "is-uploading" : ""} ${url ? "has-image" : ""}`}
        title={uploading ? "Uploading..." : "Change profile picture"}
      >
        {url ? (
          <img src={url} alt={alt} />
        ) : (
          <span className="doctor-profile-placeholder" aria-hidden="true">
            <svg viewBox="0 0 48 48" width="56" height="56" fill="none">
              <circle cx="24" cy="18" r="8" stroke="currentColor" strokeWidth="2.2" />
              <path d="M8 40c2.8-8 11-12 16-12s13.2 4 16 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
        )}
        <span className="doctor-profile-avatar-overlay">
          {uploading ? "Uploading…" : url ? "Change" : "Upload"}
        </span>
        <input
          type="file"
          accept="image/*"
          hidden
          disabled={uploading}
          onChange={handlePick}
        />
      </label>

      <div className="doctor-profile-actions">
        <label className={`btn btn-sm ${uploading ? "is-disabled" : ""}`}>
          {uploading ? "Uploading…" : url ? "Change photo" : "Upload photo"}
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={uploading}
            onChange={handlePick}
          />
        </label>
        {url ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear} disabled={uploading}>
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}
