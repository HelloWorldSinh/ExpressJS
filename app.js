const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const session = require('express-session');
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set secure: true if using HTTPS
}));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MySQL connection pool
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'admin',
    database: 'social_media_web',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Routes
app.get('/', isAuthenticated, async (req, res) => {
    try {
        // Fetch posts with user info
        const [posts] = await pool.query(`
            SELECT posts.*, users.username, users.avatar_url 
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            ORDER BY posts.created_at DESC
        `);
        // Fetch comments for each post
        for (let post of posts) {
            const [comments] = await pool.query(`
                SELECT comments.*, users.username, users.avatar_url
                FROM comments
                JOIN users ON comments.user_id = users.id
                WHERE comments.post_id = ?
                ORDER BY comments.created_at ASC
            `, [post.id]);
            post.comments_data = comments;
        }
        res.render('index', { posts });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [results] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (results.length > 0) {
            return res.render('register', { error: 'Username đã tồn tại!' });
        }
        await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
        res.redirect('/login');
    } catch (err) {
        console.error('Lỗi đăng ký:', err);
        res.status(500).render('register', { error: 'Lỗi máy chủ. Vui lòng thử lại.' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [results] = await pool.query(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );
        if (results.length > 0) {
            req.session.userId = results[0].id;
            res.redirect('/');
        } else {
            res.render('login', { error: 'Sai username hoặc password!' });
        }
    } catch (err) {
        console.error('Lỗi đăng nhập:', err);
        res.status(500).render('login', { error: 'Lỗi máy chủ. Vui lòng thử lại.' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Error destroying session:', err);
        res.redirect('/login');
    });
});

app.post('/like/:postId', isAuthenticated, async (req, res) => {
    const { postId } = req.params;
    try {
        await pool.query('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

app.post('/comment/:postId', isAuthenticated, async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.session.userId;
    try {
        await pool.query('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [postId, userId, content]);
        await pool.query('UPDATE posts SET comments = comments + 1 WHERE id = ?', [postId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error commenting on post:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});