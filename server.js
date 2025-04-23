require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import services and repositories
const TodoService = require('./services/TodoService');
const UserService = require('./services/UserService');
const TodoRepository = require('./repositories/TodoRepository');
const UserRepository = require('./repositories/UserRepository');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todo-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Initialize repositories and services
const todoRepository = new TodoRepository();
const userRepository = new UserRepository();
const todoService = new TodoService(todoRepository);
const userService = new UserService(userRepository);

// Models
const User = require('./models/User');
const Todo = require('./models/Todo');

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('todoUpdate', (data) => {
        socket.broadcast.emit('todoUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const user = await userService.register(req.body);
        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await userService.login(username, password);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Todo Routes
app.get('/api/todos', authenticateToken, async (req, res) => {
    try {
        const todos = await todoService.getTodos(req.user.userId);
        res.json(todos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/todos', authenticateToken, async (req, res) => {
    try {
        const todo = await todoService.createTodo({
            ...req.body,
            userId: req.user.userId
        });
        io.emit('todoUpdate', { type: 'add', todo });
        res.status(201).json(todo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/todos/:id', authenticateToken, async (req, res) => {
    try {
        const todo = await todoService.updateTodo(req.params.id, req.user.userId, req.body);
        io.emit('todoUpdate', { type: 'update', todo });
        res.json(todo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/todos/:id', authenticateToken, async (req, res) => {
    try {
        await todoService.deleteTodo(req.params.id, req.user.userId);
        io.emit('todoUpdate', { type: 'delete', id: req.params.id });
        res.json({ message: 'Todo deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// User Profile Routes
app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await userService.updateProfile(req.user.userId, req.body);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/change-password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        await userService.changePassword(req.user.userId, oldPassword, newPassword);
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 