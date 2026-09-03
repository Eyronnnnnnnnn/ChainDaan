import "dotenv/config";
import dns from "node:dns";
import mongoose from "mongoose";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const profileSchema = new mongoose.Schema({ role: String, name: String, email: String, phone: String, town: String, about: String }, { timestamps: true });
const productSchema = new mongoose.Schema({ name: String, category: String, price: Number, stock: Number, supplierId: mongoose.Schema.Types.ObjectId }, { timestamps: true });
const Profile = mongoose.model("Profile", profileSchema);
const Product = mongoose.model("Product", productSchema);

if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI. Add your MongoDB Atlas connection string to .env.");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
await Product.deleteMany({});
await Profile.deleteMany({});
const supplier = await Profile.create({ role: "supplier", name: "Northstar Supply", email: "northstar@example.com", phone: "0917-555-0123", town: "Laoag City", about: "Reliable local supplier of food and agricultural goods." });
await Profile.create({ role: "business", name: "Northstar Cafe", email: "cafe@example.com", phone: "0917-555-0456", town: "Laoag City", about: "A local cafe sourcing products from trusted suppliers." });
await Product.insertMany([
  { name: "Premium Ilocos Rice", category: "Food & Grain", price: 1350, stock: 42, supplierId: supplier._id },
  { name: "Organic Malunggay Bundle", category: "Agriculture", price: 180, stock: 28, supplierId: supplier._id },
  { name: "Handwoven Abel Fabric", category: "Textiles", price: 850, stock: 16, supplierId: supplier._id },
]);
console.log("Seed data inserted into chaindaan database.");
await mongoose.disconnect();
