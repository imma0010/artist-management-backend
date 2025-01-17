const express = require('express');
const checkToken = require('../utilities/checkToken');
const router = express.Router();
const db = require('../db');

router.post("/", checkToken, (req, res) => {
    const { name, dob, gender, address, first_release_year, no_of_albums_released } = req.body;

    if (!name || !dob || !gender || !address || !first_release_year || !no_of_albums_released) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    const query = "INSERT INTO artist (name, dob, gender, address, first_release_year, no_of_albums_released, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW())";
    db.query(query, [name, dob, gender, address, first_release_year, no_of_albums_released], (err, results) => {
        if (err) {
            console.error("Error registering artist:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to register artist"
            })
        }

        res.status(201).json({
            success: true,
            message: "Artist registered successfully"
        })
    })
})

router.get("/", checkToken, (req, res) => {
    const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Query to count total users
  const totalArtistsQuery = 'SELECT COUNT(*) AS totalArtists FROM artist';

  db.query(totalArtistsQuery, (err, totalArtistsResult) => {
    if (err) {
      console.log("Error:", err);
      return res.status(500).json({
        success: false,
        message: "An error occurred while retrieving total artists.",
        error: err
      });
    }

    const totalArtists = totalArtistsResult[0].totalArtists;
    const totalPages = Math.ceil(totalArtists / limit);

    // Query to get users with pagination
    const artistsQuery = `SELECT id, name, dob, gender, address, first_release_year, no_of_albums_released FROM artist LIMIT ? OFFSET ?`;
    db.query(artistsQuery, [limit, offset], (err, artists) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "An error occurred while retrieving artists.",
        });
      }

      res.status(200).json({
        success: true,
        data: artists,
        metadata: {
          totalArtists,
          totalPages,
          currentPage: page,
          usersPerPage: limit,
        },
      });
    });
  });
});

router.get("/song/:id", checkToken, (req, res) => {
    const artistId = req.params.id;
    
    // Query to get artist by ID
    const query = "SELECT * FROM music WHERE artist_id = ?";
    db.query(query, [artistId], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "An error occurred while retrieving the artist.",
          error: err
        });
      }

      res.status(200).json({
        success: true,
        message: "Artist retrieved successfully.",
        data: results
      });
    })
});

router.get("/:id", checkToken, (req, res) => {
    const artistId = req.params.id;

    // Query to get artist by ID
    const artistQuery = 'SELECT id, name, dob, gender, address, first_release_year, no_of_albums_released FROM artist WHERE id = ?';

    db.query(artistQuery, [artistId], (err, artistResult) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "An error occurred while retrieving the artist.",
                error: err
            });
        }

        if (artistResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Artist not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Artist retrieved successfully.",
            data: artistResult[0], // Return the artist object
        });
    });
});

router.put("/:id", checkToken, (req, res) => {
  const { id } = req.params;
  const { name, dob, gender, address, first_release_year, no_of_albums_released } = req.body;
  
  const updateArtistQuery = `UPDATE artist SET name = ?, dob = ?, gender = ?, address = ?, first_release_year = ?, no_of_albums_released = ?, updated_at = NOW() WHERE id = ?`;

  db.query(updateArtistQuery, [name, dob, gender, address, first_release_year, no_of_albums_released, id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the user.",
      });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Artist not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Artist updated successfully.",
    });
  });
});

router.delete("/:id", checkToken, (req, res) => {
  const { id } = req.params;

  const deleteArtistQuery = `DELETE FROM artist WHERE id = ?`;

  db.query(deleteArtistQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the artist.",
      });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Artist not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Artist deleted successfully.",
    });
  });
});

module.exports = router