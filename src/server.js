import "dotenv/config";
import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import crypto from "crypto";
import {extname} from "path"

import { authMiddleware } from "./middleware/authMiddleware.js";
import { ProductService } from "./services/product-service.js";
import { UserService } from "./services/user-service.js";
import cors from "cors"

const app = express();
app.use(cors())
const port = 3001;
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const newFileName = crypto.randomBytes(32).toString("hex");
    const fileExtension = extname(file.originalname);
    cb(null, `${newFileName}${fileExtension}`);
  },
});

const uploadMiddleware = multer({ storage });

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  res.status(200).json({ message: "test" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userService = new UserService();
  const userLogged = await userService.login(email, password);
  if (userLogged) {
    const secretKey = process.env.SECRET_KEY;
    const token = jwt.sign({ user: userLogged }, secretKey, {
      expiresIn: "1d",
    });
    return res.status(200).json({ token });
  }
  return res.status(400).json({ message: "e-mail ou senha invalido." });
});

app.get("/products", async (req, res) => {
  const produtSevice = new ProductService();
  const product = await produtSevice.findAll();
  return res.status(200).json(product);
});

app.use("/uploads", express.static("uploads"));

app.use(authMiddleware);

app.post("/users", async (req, res) => {
  const { name, email, password } = req.body;
  const user = { name, email, password };
  const userSevice = new UserService();
  await userSevice.create(user);
  return res.status(201).json(user);
});

app.get("/users", async (req, res) => {
  const userSevice = new UserService();
  const users = await userSevice.findAll();
  return res.status(200).json(users);
});

app.get("/users/:id", async (req, res) => {
  const id = req.params.id;
  const userSevice = new UserService();
  const user = await userSevice.findById(id);
  if (user) {
    return res.status(200).json(user);
  }
  return res.status(404).json({ message: "Usuario não encontrado" });
});

app.delete("/users/:id", async (req, res) => {
  const id = req.params.id;
  const userSevice = new UserService();
  const user = await userSevice.findById(id);
  if (user) {
    await userSevice.delete(id);
    return res.status(200).json({ message: "Usuario excluido com sucesso." });
  }
  return res.status(404).json({ message: "Usuario não encontrado" });
});

app.put("/users/:id", async (req, res) => {
  const id = req.params.id;
  const { name, email, password } = req.body;
  const user = { name, email, password };
  const userService = new UserService();
  const findUser = await userService.findById(id);
  if (findUser) {
    await userService.update(id, user);
    return res.status(200).json({ message: "Usuario atualizado com sucesso" });
  }
  return res.status(404).json({ message: "Usuario não encontrado" });
});


app.post("/products", uploadMiddleware.single("image"), async (req, res) => {
  const { name, description, price, summary, stock } = req.body;
  const fileName = req.file.filename;
  const product = { name, description, price, summary, stock, fileName };
  const productService = new ProductService();
  await productService.create(product);
  return res.status(201).json(product);
});

app.listen(process.env.PORT || port, () => {
  console.log(`App listening on http://localhost:${port}`);
});
