const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Trang chủ: Hiển thị tất cả bài đăng
router.get('/', async (req, res) => {
    try {
        const posts = await Post.findAll();
        res.render('index', { posts });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});
// Trang đăng nhập
router.get('/login', (req, res) => {
    res.render('login');
});

// Trang đăng ký
router.get('/register', (req, res) => {
    res.render('register');
});

module.exports = router;