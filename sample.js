import express from "express";
const express = require("express");

const app = express();

// Middleware to log the Content-Type header
app.use((req, res, next) => {
  console.log("Content-Type:", req.headers["content-type"]);
  next();
});

app.use(express.json()); // Parse JSON bodies

app.post("/data", (req, res) => {
  console.log("Parsed body:", req.body);
  res.send("Data received!");
});
