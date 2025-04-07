const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');

const bcrypt = require('bcrypt');
const saltRounds = 10;

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

app.use(express.static(path.join(__dirname, 'assets')));

app.use(express.static(path.join(__dirname, 'styles')));

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, './criar', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, './login', 'index.html'));
});

app.post('/create', async (req, res) => {
    const { nome, email, senha } = req.body;

    const hash = await bcrypt.hash(senha, saltRounds); // Cria um hash para essa senha baseada no nível de segurança especificado lá em cima no saltRounds

    const query = `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`;

    connection.query(query, [nome, email, hash], (err, result) => // Manda o hash da senha encryptada em vez da senha
    {
        if (err) throw err;
        res.send('Dados inseridos com sucesso!');
    });
});

// Sistema de login

app.post('/enviar', (req, res) => {
    const { email, senha } = req.body;

    const query = `SELECT * FROM usuarios WHERE email = ?`; // Query para achar o email que o usuário digitou

    connection.query(query, [email], async (err, result) =>
    {
        if (err) throw err;

        if (result.lenght === 0) // Verificar se achou
            return res.status(401).send("Usuário não encontrado");

        const usuario = result[0];

        const match = await bcrypt.compare(senha, usuario.senha); // Comparar a senha que o usuário digitou com o hash do banco

        if (match)
            res.send("Login bem sucedido");
        else
            res.status(401).send('Email e/ou senha incorretos');
    });
});


app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});