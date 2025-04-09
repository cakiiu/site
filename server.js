const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const saltRounds = 10;
const SECRET = process.env.JSON_TOKEN_SECRET;

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Importante para lidar com JSON no corpo das requisições
app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'styles')));

// Conexão com banco de dados
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

// Rotas
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, './criar', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, './login', 'index.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './paginas/primeira', 'index.html'));
});

// Criar conta
app.post('/create', async (req, res) => {
  const { nome, email, senha } = req.body;

  const hash = await bcrypt.hash(senha, saltRounds);

  const query = `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`;
  connection.query(query, [nome, email, hash], (err, result) => {
    if (err) return res.status(500).send('Erro ao criar conta');
    res.send('Conta criada com sucesso!');
  });
});

// Login com JWT
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const query = `SELECT * FROM usuarios WHERE email = ?`;
  connection.query(query, [email], async (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro no servidor' });

    if (result.length === 0) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    const user = result[0];
    const match = await bcrypt.compare(senha, user.senha);

    if (!match) {
      return res.status(401).json({ message: 'Senha e/ou email incorretos' });
    }

    // Inclui nome no token
    const token = jwt.sign(
      { id: user.id, email: user.email, nome: user.nome },
      SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login bem-sucedido', token });
  });
});

// Middleware para verificar token
function verificarToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Token não fornecido');

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(403).send('Token inválido');
    req.user = decoded;
    next();
  });
}

// Rota protegida
app.get('/profile', verificarToken, (req, res) => {
  res.send(`Olá, ${req.user.nome}! Você está autenticado.`);
});

// Start
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
