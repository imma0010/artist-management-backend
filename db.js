const mysql = require("mysql2");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "artist",
    connectionLimit: 10
});

module.exports = db