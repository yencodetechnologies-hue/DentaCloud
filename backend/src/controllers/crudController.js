function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
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
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(200, parseInt(req.query.limit) || 50);
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.search && searchFields.length) {
        const rx = new RegExp(req.query.search.trim(), "i");
        filter.$or = searchFields.map((f) => ({ [f]: rx }));
      }
      if (req.query.status) filter.status = req.query.status;
      if (req.query.branch) filter.branch = req.query.branch;

      const sort = req.query.sort || "-createdAt";

      const [items, total] = await Promise.all([
        applyPopulate(Model.find(filter).sort(sort).skip(skip).limit(limit)),
        Model.countDocuments(filter),
      ]);

      res.json({ data: items, total, page, pages: Math.ceil(total / limit) || 1 });
    }),

    get: asyncHandler(async (req, res) => {
      const item = await applyPopulate(Model.findById(req.params.id));
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    }),

    create: asyncHandler(async (req, res) => {
      const created = await Model.create(req.body);
      const item = await applyPopulate(Model.findById(created._id));
      res.status(201).json(item);
    }),

    update: asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ message: "Not found" });
      Object.assign(item, req.body);
      await item.save();
      const populated = await applyPopulate(Model.findById(item._id));
      res.json(populated);
    }),

    remove: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted", id: req.params.id });
    }),
  };
}

export { asyncHandler };
