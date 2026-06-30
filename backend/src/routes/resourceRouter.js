import { Router } from "express";
import { crudController } from "../controllers/crudController.js";

export function resourceRouter(Model, options) {
  const router = Router();
  const c = crudController(Model, options);

  router.get("/", c.list);
  router.get("/:id", c.get);
  router.post("/", c.create);
  router.put("/:id", c.update);
  router.delete("/:id", c.remove);

  return router;
}
