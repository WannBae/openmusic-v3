/* eslint-disable spaced-comment */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable quotes */
/* eslint-disable no-underscore-dangle */
const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const NotFoundError = require("../../exceptions/NotFoundError");
const InvariantError = require("../../exceptions/InvariantError");
const AuthorizationError = require("../../exceptions/AuthorizationError");

class PlaylistService {
  constructor(collaborationsService, cacheService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
    this._cacheService = cacheService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: "INSERT INTO playlist VALUES ($1,$2,$3) RETURNING id",
      values: [id, name, owner],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError("Playlist gagal ditambahkan");
    }
    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlist.id, playlist.name, users.username 
      FROM playlist
      LEFT JOIN users ON users.id = playlist.owner 
      LEFT JOIN collaborations ON collaborations.playlist_id = playlist.id
      WHERE playlist.owner = $1 OR collaborations.user_id = $1`,
      values: [owner],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: "DELETE FROM playlist WHERE id=$1 RETURNING id",
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError("Gagal menghapus, id tidak ditemukan");
    }
  }

  // ... other methods

  async addSongToPlaylist(playlistId, songId, userId) {
    const id = `playlist-song-${nanoid(16)}`;
    const activitiesId = `Playlist-activities-${nanoid(16)}`;

    const query = {
      text: "INSERT INTO playlistsongs VALUES($1, $2, $3) RETURNING id",
      values: [id, playlistId, songId],
    };

    const activitiesQuery = {
      text: "INSERT INTO activities VALUES ($1, $2, $3, $4, $5) RETURNING id", // There's a closing parenthesis ")" at the end
      values: [activitiesId, playlistId, songId, userId, "add"],
    };

    const resultPlaylist = await this._pool.query(query);
    const resultActivities = await this._pool.query(activitiesQuery);

    if (!resultPlaylist.rows.length) {
      throw new InvariantError("Lagu gagal ditambahkan");
    }
    if (!resultActivities.rows.length) {
      throw new InvariantError("Aktivitas gagal ditambahkan");
    }
    //cache
    await this._cacheService.delete(`songs:${playlistId}`);
  }

  async getPlaylistWithId(playlistId) {
    try {
      const result = await this._cacheService.get(`songs:${playlistId}`);
      return JSON.parse(result);
    } catch (error) {
      const queryPlaylist = {
        text: "SELECT * FROM playlist WHERE id = $1",
        values: [playlistId],
      };

      const queryUser = {
        text: `SELECT users.username FROM users 
        LEFT JOIN playlist ON users.id = playlist.owner
        WHERE playlist.id = $1 `,
        values: [playlistId],
      };

      const querySongs = {
        text: `SELECT DISTINCT songs.id, songs.title, songs.performer FROM songs 
        LEFT JOIN playlistsongs ON songs.id = playlistsongs.song_id 
        WHERE playlistsongs.playlist_id = $1`,
        values: [playlistId],
      };

      const resultList = await this._pool.query(queryPlaylist);
      const resultUser = await this._pool.query(queryUser);
      const resultSongs = await this._pool.query(querySongs);

      if (!resultList.rows.length) {
        throw new NotFoundError("Daftar tidak ditemukan");
      }
      await this._cacheService.set(
        `songs:${playlistId}`,
        JSON.stringify(resultList, resultUser, resultSongs.rows),
      );
      return {
        id: resultList.rows[0].id,
        name: resultList.rows[0].name,
        username: resultUser.rows[0].username,
        songs: resultSongs.rows,
      };
    }
  }

  async deleteSongFromPlaylist(songId, playlistId, userId) {
    const activitiesId = `Playlist-activities-${nanoid(16)}`;
    const query = {
      text: `DELETE FROM playlistsongs 
               WHERE song_id = $1
               RETURNING id`,
      values: [songId],
    };
    const ActivitiesQuery = {
      text: "INSERT INTO activities VALUES ($1, $2, $3, $4, $5) RETURNING id",
      values: [activitiesId, playlistId, songId, userId, "delete"],
    };

    const result = await this._pool.query(query);
    const ActivitiesResult = await this._pool.query(ActivitiesQuery);

    if (!result.rows.length) {
      throw new NotFoundError("Lagu gagal dihapus. Id tidak ditemukan");
    }
    if (!ActivitiesResult.rows.length) {
      throw new NotFoundError("Aktivitas gagal dihapus. Id tidak ditemukan");
    }

    //cache
    await this._cacheService.delete(`songs:${playlistId}`);
  }

  // Verify

  async verifyPlaylistOwner(playlistId, owner) {
    const query = {
      text: "SELECT * FROM playlist WHERE id = $1",
      values: [playlistId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Playlist tidak ditemukan");
    }
    if (result.rows[0].owner !== owner) {
      throw new AuthorizationError("Anda tidak berhak mengakses resource ini");
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationsService.verifyCollaborator(
          playlistId,
          userId,
        );
      } catch {
        throw error;
      }
    }
  }

  // Aktivitas
  async getActivities(id) {
    const query = {
      text: `SELECT users.username, songs.title, activities.action, activities.time FROM activities
      JOIN songs ON songs.id = activities.song_id
      JOIN users ON users.id = activities.user_id
      WHERE activities.playlist_id = $1`,
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Playlist tidak ditemukan");
    }

    return result.rows;
  }

  // verify untuk mengecek playlist
  async verifySongPlaylist(songId) {
    const query = {
      text: "SELECT * FROM songs WHERE id = $1",
      values: [songId],
    };
    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError("Lagu belum terdaftar pada playlist");
    }
    return result.rows[0];
  }
}

module.exports = PlaylistService;
