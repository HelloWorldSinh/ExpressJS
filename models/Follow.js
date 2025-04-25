const pool = require('../config/db');

class Follow {
    static async findFollowers(userId) {
        const [rows] = await pool.query(
            'SELECT * FROM follows WHERE followed_user_id = ?',
            [userId]
        );
        return rows;
    }
}

module.exports = Follow;