require("dotenv").config();
const express = require("express");

const motto = require("./motto");
const auth = require("./auth");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => res.redirect("/motto"));
app.use("/motto", motto);
app.use("/auth", auth);

app.listen(5005, () => console.log("Server started on http://localhost:5005"));
