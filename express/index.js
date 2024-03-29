import express from "express";
import cors from "cors";
import routes from "./route/routes.js";
import config from "./config.json" assert { type: "json" };
const app = express();
const port = config.port;

app.use(cors());
app.use(express.json());
app.use("/", middleware);
app.use("/api/", routes);

function middleware(req, res, next) {
  console.log(req.url, new Date());
  req.staticUrl = "build/" + req.url.replace(/\//g, "__") + ".json";
  next();
}

app.listen(port, () => {
  console.log(`IsThisLiv listening on port ${port}`);
});

export default app;
