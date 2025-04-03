const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();



const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Conectado ao banco de dados MySQL');
});

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'criar_conta')));

// Rota GET para servir o arquivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './criar_conta', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, './login', 'index.html'));
});

// Rota POST para processar o formulário
app.post('/enviar', (req, res) => {
    const { nome, email, senha } = req.body;
    const query = `INSERT INTO usuarios (nome, email, Senha) VALUES (?, ?, ?)`;

    connection.query(query, [nome, email, senha], (err, result) => {
        if (err) throw err;
        res.send('Dados inseridos com sucesso!');
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});