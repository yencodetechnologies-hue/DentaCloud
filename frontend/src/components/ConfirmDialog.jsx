import Modal from "./Modal.jsx";

export default function ConfirmDialog({ title = "Are you sure?", message, confirmLabel = "Delete", onConfirm, onClose, loading }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}
