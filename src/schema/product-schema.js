import Mongoose from "../../db.js";

const productsSchema = new Mongoose.Schema(
  {
    name: String,
    description: String,
    price: Number,
    summary: String,
    stock: Number,
    fileName: String,
  },
  {
    collection: "products",
    timestamps: true,
  }
);

export default Mongoose.model("products", productsSchema, "products");

