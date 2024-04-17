import express from "express";
import cors from "cors";
import routes from "./route/routes.js";
import config from "../config.json";
const app = express();
const port = config.port;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/", middleware);
app.use("/api/", routes);

function middleware(req, res, next) {
  console.log(req.url, new Date());
  res.locals.staticUrl = "cache/" + req.url.replace(/\//g, "__") + ".json";
  next();
}

app.listen(port, () => {
  console.log(`IsThisLiv listening on port ${port}`);
});

export default app;
