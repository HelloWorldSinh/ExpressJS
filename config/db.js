const mysql = require('mysql2/promise');

// Tạo pool kết nối
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root', // Thay bằng username MySQL của bạn
    password: 'admin', // Thay bằng password MySQL của bạn
    database: 'social_media_web', // Tên database của bạn
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;