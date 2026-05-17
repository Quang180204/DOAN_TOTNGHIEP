import express from "express";
import cors from "cors";

import homeRoutes from "./Routes/client/HomeRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/home", homeRoutes);

export default app;