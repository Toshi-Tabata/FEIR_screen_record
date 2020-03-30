import app from './App'
import * as express from 'express'
import * as path from "path";

const port = process.env.PORT || 3000;

app.listen(port, (err) => {
    if (err) {
        return console.log(err)
    }
    return console.log(`server is listening on ${port}`)
});

app.use(express.static(path.join(__dirname, "/default-page.css")));
app.use(express.static(path.join(__dirname, "/default-page.js")));

