function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function pickTenantFilter(Model, req) {
  const filter = {};
  const tenant = req.tenant || {};

  const hasBranch = !!Model?.schema?.path?.("branch");
  const hasEnterprise = !!Model?.schema?.path?.("enterprise");

  if (hasBranch && tenant.branchId) filter.branch = tenant.branchId;
  if (hasEnterprise && tenant.enterpriseId) filter.enterprise = tenant.enterpriseId;

  return filter;
}

function requireTenantBranch(Model, req, res) {
  const hasBranch = !!Model?.schema?.path?.("branch");
  if (hasBranch && !req.tenant?.branchId) {
    res.status(400).json({ message: "Active clinic (branch) is required" });
    return false;
  }
  return true;
}

function enforceTenantOnPayload(Model, req, payload) {
  const tenant = req.tenant || {};
  const hasBranch = !!Model?.schema?.path?.("branch");
  const hasEnterprise = !!Model?.schema?.path?.("enterprise");

  const nextPayload = { ...(payload || {}) };
  if (hasBranch && tenant.branchId) nextPayload.branch = tenant.branchId;
  if (hasEnterprise && tenant.enterpriseId) nextPayload.enterprise = tenant.enterpriseId;
  return nextPayload;
}

function stripTenantFields(Model, payload) {
  const nextPayload = { ...(payload || {}) };
  const hasBranch = !!Model?.schema?.path?.("branch");
  const hasEnterprise = !!Model?.schema?.path?.("enterprise");

  if (hasBranch) delete nextPayload.branch;
  if (hasEnterprise) delete nextPayload.enterprise;
  return nextPayload;
}

/**
 * Build a set of CRUD handlers for a Mongoose model.
 * @param {import('mongoose').Model} Model
 * @param {object} options
 * @param {string[]} options.searchFields - fields used for text search (regex)
 * @param {string[]} options.populate - ref paths to populate
 */
export function crudController(Model, { searchFields = [], populate = [] } = {}) {
  const applyPopulate = (query) => {
    populate.forEach((p) => query.populate(p));
    return query;
  };

  return {
    list: asyncHandler(async (req, res) => {
      if (!requireTenantBranch(Model, req, res)) return;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(200, parseInt(req.query.limit) || 50);
      const skip = (page - 1) * limit;

      const filter = { ...pickTenantFilter(Model, req) };
      if (req.query.search && searchFields.length) {
        const rx = new RegExp(req.query.search.trim(), "i");
        filter.$or = searchFields.map((f) => ({ [f]: rx }));
      }
      if (req.query.status) filter.status = req.query.status;
      if (req.query.patient) filter.patient = req.query.patient;
      if (req.query.vendor) filter.vendor = req.query.vendor;
      if (req.query.type) filter.type = req.query.type;

      const sort = req.query.sort || "-createdAt";

      const [items, total] = await Promise.all([
        applyPopulate(Model.find(filter).sort(sort).skip(skip).limit(limit)),
        Model.countDocuments(filter),
      ]);

      res.json({ data: items, total, page, pages: Math.ceil(total / limit) || 1 });
    }),

    get: asyncHandler(async (req, res) => {
      if (!requireTenantBranch(Model, req, res)) return;
      const filter = { _id: req.params.id, ...pickTenantFilter(Model, req) };
      const item = await applyPopulate(Model.findOne(filter));
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    }),

    create: asyncHandler(async (req, res) => {
      if (!requireTenantBranch(Model, req, res)) return;
      const payload = enforceTenantOnPayload(Model, req, req.body);
      const created = await Model.create(payload);
      const item = await applyPopulate(Model.findById(created._id));
      res.status(201).json(item);
    }),

    update: asyncHandler(async (req, res) => {
      if (!requireTenantBranch(Model, req, res)) return;
      const filter = { _id: req.params.id, ...pickTenantFilter(Model, req) };
      const item = await Model.findOne(filter);
      if (!item) return res.status(404).json({ message: "Not found" });
      const safe = stripTenantFields(Model, req.body);
      Object.assign(item, safe);
      await item.save();
      const populated = await applyPopulate(Model.findById(item._id));
      res.json(populated);
    }),

    remove: asyncHandler(async (req, res) => {
      if (!requireTenantBranch(Model, req, res)) return;
      const filter = { _id: req.params.id, ...pickTenantFilter(Model, req) };
      const item = await Model.findOneAndDelete(filter);
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted", id: req.params.id });
    }),
  };
}

export { asyncHandler };
