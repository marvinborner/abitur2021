const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const app = express.Router();

// TODO: Change passwords
// TODO: Login (+ Frontend, cookie, etc)

function checkUser(req, res, next) {
    if (req.session.loggedIn) next();
    else res.redirect("/auth");
}

app.use(
    "/",
    (req, res, next) => {
        // Very important, don't change :)
        if (!req.session.loggedIn || req.path.startsWith("/api")) next();
        else res.redirect("/");
    },
    express.static(__dirname + "/public"),
);

app.post("/api/login", async (req, res) => {
    if (req.session.loggedIn) return res.redirect("/");

    const { username, password } = req.body;
    if (!(username && password)) return res.redirect("/auth");
    const user = (await db.query("SELECT id, password FROM users WHERE username = ?", [username]))[0];
    if (!user.password) return res.redirect("/auth");
    const loggedIn = await bcrypt.compare(password, user.password);
    if (loggedIn) {
        req.session.loggedIn = true;
        req.session.uid = user.id;
    }
    res.redirect("/auth");
});

app.use("/api/logout", (req, res) => req.session.destroy() & res.redirect("/"));

app.put("/api/password", checkUser, async (req, res) => {
    const { pwd, newPwd } = req.body;
    if (!(pwd && newPwd)) return res.redirect("/auth");
    const user = await db.query("SELECT id, password FROM users WHERE username = ?", [username]);
    if (!user.password) return res.send("error");
    if (!((await bcrypt.compare(pwd, user.password)) && user.id === req.session.uid && req.session.loggedIn))
        return res.redirect("/auth");
    try {
        const newHash = await bcrypt.hash(newPwd, 12);
        await db.query("UPDATE users SET password = ? WHERE id = ?", [newHash, req.session.uid]);
        res.redirect("/auth");
    } catch (e) {
        console.error(e);
        res.redirect("/auth");
    }
});

app.get("/api/list", checkUser, async (req, res) => {
    let users;
    if (req.query.class === "all") {
        users = await db.query("SELECT id, name, middlename, surname FROM users");
    } else {
        users = await db.query(
            "SELECT id, name, middlename, surname FROM users WHERE class_id = (SELECT class_id FROM users WHERE id = ?) ORDER BY name",
            [req.session.uid],
        );
    }

    res.json(users);
});

module.exports = { auth: app, checkUser };
