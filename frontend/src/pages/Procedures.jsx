import { useState } from "react";
import CrudPage from "../components/CrudPage.jsx";
import PageDashboard from "../components/PageDashboard.jsx";
import Badge from "../components/Badge.jsx";
import FormFields from "../components/FormFields.jsx";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";
import api, { apiError } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

const STATUS = [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }];
const PAGE_SIZE = 10;

function money(n) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
}

export default function Procedures() {
  const toast = useToast();
  const [dashKey, setDashKey] = useState(0);
  const [statusBusyId, setStatusBusyId] = useState(null);

  async function toggleProcedureStatus(row, setRows) {
    const nextStatus = row.status === "active" ? "inactive" : "active";
    setStatusBusyId(row._id);
    try {
      await api.put(`/procedures/${row._id}`, { status: nextStatus });
      setRows?.((prev) => prev.map((r) => (r._id === row._id ? { ...r, status: nextStatus } : r)));
      toast.success(`Procedure marked ${nextStatus}`);
      setDashKey((k) => k + 1);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <CrudPage
      title="Procedures"
      subtitle="Procedure price list — charges used in billing and estimates."
      endpoint="procedures"
      singular="Procedure"
      statusOptions={STATUS}
      defaultValues={{ charge: "", status: "active" }}
      onChanged={() => setDashKey((k) => k + 1)}
      tableProps={{
        selectable: true,
        sortable: true,
        hideDelete: true,
        actionVariant: "teal",
      }}
      topContent={
        <PageDashboard
          resource="procedures"
          refreshKey={dashKey}
          cards={[
            { key: "total", label: "Total Procedures", icon: "📝" },
            { key: "active", label: "Active", icon: "✅" },
            { key: "avgCharge", label: "Avg Charge", icon: "💰", prefix: "₹" },
          ]}
        />
      }
      columns={({ setRows, page }) => [
        {
          key: "sno",
          header: "S.No",
          width: 72,
          sortable: false,
          render: (_r, rowIndex) => (page - 1) * PAGE_SIZE + rowIndex + 1,
        },
        {
          key: "name",
          header: "Procedure",
          render: (r) => <div className="cell-main">{r.name}</div>,
        },
        {
          key: "charge",
          header: "Amount",
          render: (r) => money(r.charge),
        },
        {
          key: "status",
          header: "Status",
          render: (r) => {
            const active = r.status === "active";
            return (
              <button
                type="button"
                className={`status-toggle ${active ? "is-active" : "is-inactive"}`}
                disabled={statusBusyId === r._id}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleProcedureStatus(r, setRows);
                }}
                title={active ? "Set inactive" : "Set active"}
              >
                <span className="status-toggle-label">{active ? "Active" : "Inactive"}</span>
                <span className="status-toggle-knob" />
              </button>
            );
          },
        },
      ]}
      fields={() => []}
      renderForm={({ values, setValues, editing }) => (
        <FormFields
          values={values}
          onChange={setValues}
          fields={[
            {
              name: "name",
              label: "Procedure Name",
              required: true,
              placeholder: "Enter Procedure Name",
              full: true,
            },
            {
              name: "charge",
              label: "Amount",
              type: "number",
              required: true,
              placeholder: "Enter amount",
              min: 0,
              full: true,
            },
            ...(editing
              ? [{ name: "status", label: "Status", type: "select", options: STATUS, full: true }]
              : []),
          ]}
        />
      )}
      toForm={(r) => ({
        name: r.name || "",
        charge: r.charge ?? "",
        status: r.status || "active",
      })}
      toPayload={(v) => ({
        name: v.name,
        charge: Number(v.charge) || 0,
        status: v.status || "active",
      })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Name" value={r.name} />
          <DetailItem label="Amount" value={money(r.charge)} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
        </DetailGrid>
      )}
    />
  );
}
