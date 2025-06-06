import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import roomRoutes from "./routes/roomRoutes"
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", roomRoutes); 


app.get("/", (_: Request, res: Response) => {
  res.send("API running");
});

app.listen(3000, () => {
  console.log("Server running on 3000");
});
