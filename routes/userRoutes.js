const express = require('express');
const router = express.Router();
const db = require('../db');
const checkToken = require('../utilities/checkToken');

// Route to get all users with pagination
router.get("/", checkToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Query to count total users
  const totalUsersQuery = 'SELECT COUNT(*) AS totalUsers FROM users';

  db.query(totalUsersQuery, (err, totalUsersResult) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "An error occurred while retrieving total users.",
      });
    }

    const totalUsers = totalUsersResult[0].totalUsers;
    const totalPages = Math.ceil(totalUsers / limit);

    // Query to get users with pagination
    const usersQuery = `SELECT id, first_name, last_name, email, phone, dob, gender, address FROM user LIMIT ? OFFSET ?`;
    db.query(usersQuery, [limit, offset], (err, users) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "An error occurred while retrieving users.",
        });
      }

      res.status(200).json({
        success: true,
        data: users,
        metadata: {
          totalUsers,
          totalPages,
          currentPage: page,
          usersPerPage: limit,
        },
      });
    });
  });
});

// Route to update a user (PUT)
router.put("/:id", checkToken, (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone, dob, gender, address } = req.body;

  const updateUserQuery = `UPDATE user SET first_name = ?, last_name = ?, email = ?, phone = ?, dob = ?, gender = ?, address = ?, updated_at = NOW() WHERE id = ?`;

  db.query(updateUserQuery, [first_name, last_name, email, phone, dob, gender, address, id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the user.",
      });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
    });
  });
});


// Route to delete a user (DELETE)
router.delete("/:id", checkToken, (req, res) => {
  const { id } = req.params;

  const deleteUserQuery = `DELETE FROM user WHERE id = ?`;

  db.query(deleteUserQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the user.",
      });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  });
});


module.exports = router;