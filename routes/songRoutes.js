const express = require('express');
const checkToken = require('../utilities/checkToken');
const router = express.Router();
const db = require('../db');

router.post("/", checkToken, (req, res) => {
    const {title, artist_id, genre, album_name} = req.body;

    if (!title || !artist_id || !genre || !album_name) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    const query = "INSERT INTO music (title, artist_id, genre, album_name, updated_at) VALUES (?, ?, ?, ?, NOW())";
    db.query(query, [title, artist_id, genre, album_name], (err, results) => {
        if (err) {
            console.error("Error registering song:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to register song"
            })
        }

        res.status(201).json({
            success: true,
            message: "Music registered successfully"
        })
    })
})

router.get("/", checkToken, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const totalSongsQuery = 'SELECT COUNT(*) AS totalSongs FROM song';

    db.query(totalSongsQuery, (err, totalSongsResult) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "An error occurred while retrieving total songs.",
            });
        }

        const totalSongs = totalSongsResult[0].totalSongs;
        const totalPages = Math.ceil(totalSongs / limit);

        // Query to get songs with pagination
        const songsQuery = `SELECT id, title, artist_id, genre, album_name FROM song LIMIT ? OFFSET ?`;
        db.query(songsQuery, [limit, offset], (err, songs) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "An error occurred while retrieving songs.",
                });
            }

            res.status(200).json({
                success: true,
                message: "Songs retrieved successfully.",
                data: songs,
                metadata: {
                    totalSongs,
                    totalPages,
                    currentPage: page,
                    songsPerPage: limit
                }
            });
        });
    });
})

router.get("/:id", checkToken, (req, res) => {
    const songId = req.params.id;

    // Query to get song by ID
    const query = "SELECT * FROM music WHERE id = ?";
    db.query(query, [songId], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "An error occurred while retrieving the song.",
          error: err
        });
      }

      res.status(200).json({
        success: true,
        message: "Song retrieved successfully.",
        data: results[0]
      });
    })
});

router.put("/:id", checkToken, (req, res) => {
    const { id } = req.params;

    const { title, genre, album_name } = req.body;

    if (!title || !genre || !album_name) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    const query = "UPDATE music SET title = ?, genre = ?, album_name = ?, updated_at = NOW() WHERE id = ?";
    db.query(query, [title, genre, album_name, id], (err, results) => {
        if (err) {
            console.error("Error updating song:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to update song"
            })
        }

        res.status(200).json({
            success: true,
            message: "Song updated successfully"
        })
    })
});

router.delete("/:id", checkToken, (req, res) => {
    const { id } = req.params;

    const deleteSongQuery = `DELETE FROM music WHERE id = ?`;

    db.query(deleteSongQuery, [id], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "An error occurred while deleting the song.",
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Song not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Song deleted successfully.",
        });
    });
});

module.exports = router;