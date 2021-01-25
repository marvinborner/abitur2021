const express = require("express");
const db = require("../db");
const app = express.Router();
const { checkUser } = require("../auth");

app.use("/", checkUser, express.static(__dirname + "/public"));

app.get("/api/question/:id", checkUser, async (req, res) => {
    try {
        const questions = await db.query("SELECT id, question FROM question_questions");
        const id = +req.params.id;
        if (id >= 0 && id < questions.length) {
            const question = questions[id];
            const answers = await db.query(
                "SELECT answer FROM question_answers WHERE question_id = ?  AND user_id = ?",
                [question.id, req.session.uid],
            );
            question.answer = answers.length > 0 ? answers[0].answer : undefined;
            res.json(question);
        } else {
            res.json({});
        }
    } catch (e) {
        console.error(e);
        res.json({ success: false });
    }
});

app.get("/api/questions", checkUser, async (req, res) => {
    const fail = { success: false };
    try {
        const questions = await db.query("SELECT id FROM question_questions");
        const answers = await db.query("SELECT question_id FROM question_answers WHERE user_id = ?", [req.session.uid]);
        const resp = [];
        let i = 0;
        for (const question of questions) {
            const qid = answers.findIndex((answer) => question.id === answer.question_id);
            resp.push({ id: i++, answered: qid >= 0 });
        }
        res.json(resp);
    } catch (e) {
        console.error(e);
        res.json(fail);
    }
});

app.post("/api/answer", checkUser, async (req, res) => {
    return await answer(req, res, "INSERT INTO question_answers (answer, question_id, user_id) VALUE (?,?,?)");
});

app.put("/api/answer", checkUser, async (req, res) => {
    return await answer(req, res, "UPDATE question_answers SET answer = ? WHERE question_id = ? AND user_id = ?");
});

async function answer(req, res, qu) {
    const { question, answer } = req.body;
    try {
        await db.query(qu, [answer, question, req.session.uid]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.json({ success: false });
    }
}

module.exports = app;
