import { useEffect, useState, useCallback } from "react";
import api, { apiError } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import useUserBranch from "../hooks/useUserBranch.js";
import DataTable from "./DataTable.jsx";
import Modal from "./Modal.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import FormFields from "./FormFields.jsx";

/**
 * Generic CRUD page.
 * props:
 *  - title, subtitle, endpoint, singular
 *  - columns: DataTable columns
 *  - fields: form field schema (or function(extra) => fields)
 *  - statusOptions: [{value,label}] for filter
 *  - defaultValues: object
 *  - toForm(row): map a record to form values for editing
 *  - toPayload(values): map form values to API payload
 *  - renderView(row): JSX for the view modal
 *  - extra: any extra data (e.g. branches/doctors) passed to fields()
 */
export default function CrudPage(props) {
  const {
    title,
    subtitle,
    endpoint,
    singular,
    columns,
    fields,
    statusOptions = [],
    defaultValues = {},
    toForm = (r) => r,
    toPayload = (v) => v,
    renderView,
    onChanged,
    listParams = {},
    initialStatus = "",
    hideStatusFilter = false,
    tableProps = {},
  } = props;

  const toast = useToast();
  const { branchId } = useUserBranch();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(defaultValues);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const listParamsKey = JSON.stringify(listParams || {});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const paramsExtra = listParamsKey ? JSON.parse(listParamsKey) : {};
      const { data } = await api.get(`/${endpoint}`, {
        params: {
          page,
          search: search || undefined,
          status: statusFilter || undefined,
          limit: 10,
          ...paramsExtra,
        },
      });
      setRows(data.data);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, search, statusFilter, toast, listParamsKey]);

  useEffect(() => {
    setStatusFilter(initialStatus || "");
    setPage(1);
  }, [initialStatus]);

  useEffect(() => {
    setPage(1);
  }, [listParamsKey]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load]);

  const fieldSchema = typeof fields === "function" ? fields() : fields;
  const resolvedColumns = typeof columns === "function" ? columns({ reload: load, rows, setRows, page }) : columns;

  function openCreate() {
    setEditing(null);
    setValues(branchId ? { ...defaultValues, branch: branchId } : defaultValues);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setValues(toForm(row));
    setFormError("");
    setFormOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = toPayload(values);
      if (editing) {
        await api.put(`/${endpoint}/${editing._id}`, payload);
        toast.success(`${singular} updated`);
      } else {
        await api.post(`/${endpoint}`, payload);
        toast.success(`${singular} created`);
      }
      setFormOpen(false);
      load();
      onChanged?.();
    } catch (err) {
      setFormError(apiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await api.delete(`/${endpoint}/${deleting._id}`);
      toast.success(`${singular} deleted`);
      setDeleting(null);
      if (rows.length === 1 && page > 1) setPage(page - 1);
      else load();
      onChanged?.();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="fade-up">
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>＋ Add {singular}</button>
      </div>

      {props.topContent}

      <div className="table-card" style={{ marginBottom: 0 }}>
        <div className="table-toolbar">
          <div className="left">
            <div className="table-search">
              <span>🔍</span>
              <input
                placeholder={`Search ${title.toLowerCase()}…`}
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              />
            </div>
            {statusOptions.length > 0 && !hideStatusFilter && (
              <select className="select" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
                <option value="">All status</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <DataTable
          columns={resolvedColumns}
          rows={rows}
          loading={loading}
          page={page}
          pages={pages}
          total={total}
          onPageChange={setPage}
          onView={renderView ? (row) => setViewing(row) : undefined}
          onEdit={openEdit}
          onDelete={(row) => setDeleting(row)}
          emptyLabel={`No ${title.toLowerCase()} found`}
          {...tableProps}
        />
      </div>

      {formOpen && (
        <Modal
          title={`${editing ? "Edit" : "Add"} ${singular}`}
          onClose={() => setFormOpen(false)}
          wide={props.wideForm ?? fieldSchema.length > 6}
          footer={
            props.hideDefaultFooter ? null : (
              <>
                <button className="btn btn-ghost" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" form="crud-form" type="submit" disabled={saving}>
                  {saving ? "Saving…" : editing ? "Save changes" : `Create ${singular}`}
                </button>
              </>
            )
          }
        >
          <form id="crud-form" onSubmit={handleSave}>
            {formError && <div className="form-error">{formError}</div>}
            {props.renderForm
              ? props.renderForm({ values, setValues, saving, editing, onCancel: () => setFormOpen(false) })
              : <FormFields fields={fieldSchema} values={values} onChange={setValues} />}
          </form>
        </Modal>
      )}

      {viewing && renderView && (
        <Modal title={`${singular} Details`} onClose={() => setViewing(null)} wide>
          {renderView(viewing)}
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete ${singular}?`}
          message={`This will permanently remove this ${singular.toLowerCase()}. This action cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
