const pool = require('../config/db');

class Post {
    static async findAll() {
        const [rows] = await pool.query(`
            SELECT posts.*, users.username, users.avatar_url
            FROM posts
            JOIN users ON posts.user_id = users.id 
            ORDER BY posts.created_at DESC
        `);
        return rows;
    }
}

module.exports = Post;