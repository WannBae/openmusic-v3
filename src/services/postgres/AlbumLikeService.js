/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");
const ClientError = require("../../exceptions/ClientError");

class AlbumLikesService {
  constructor(albumService, cacheService) {
    this._pool = new Pool();
    this._albumService = albumService;
    this._cacheService = cacheService;
  }

  async addLikesToAlbum(albumId, userId) {
    const id = `like-${nanoid(16)}`;

    const query = {
      text: "INSERT INTO album_likes VALUES($1, $2, $3) RETURNING id",
      values: [id, userId, albumId],
    };
    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Gagal menyukai album");
    }

    await this._cacheService.delete(`likes:${albumId}`);
    return result.rows[0].id;
  }

  async getAlbumLikes(albumId) {
    try {
      const result = await this._cacheService.get(`likes:${albumId}`);
      return {
        likes: JSON.parse(result),
        cached: true,
      };
    } catch (error) {
      const query = {
        text: "SELECT * FROM album_likes WHERE album_id = $1",
        values: [albumId],
      };

      const result = await this._pool.query(query);

      if (!result.rowCount) {
        throw new NotFoundError("Album tidak ditemukan");
      }

      await this._cacheService.set(
        `likes:${albumId}`,
        JSON.stringify(result.rowCount)
      );

      return {
        likes: result.rowCount,
        cached: false,
      };
    }
  }

  async deleteLike(albumId, userId) {
    const query = {
      text: "DELETE FROM album_likes WHERE album_id = $1 AND user_id = $2",
      values: [albumId, userId],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError("Like gagal dihapus. Id tidak ditemukan");
    }

    await this._cacheService.delete(`likes:${albumId}`);
  }

  async verifyUserLiked(albumId, userId) {
    await this._albumService.getAlbumLikeId(albumId);
    const query = {
      text: "SELECT * FROM album_likes WHERE album_id = $1 AND user_id = $2",
      values: [albumId, userId],
    };
    const result = await this._pool.query(query);

    if (result.rowCount > 0) {
      throw new ClientError("Anda sudah menyukai album ini");
    }
  }
}

module.exports = AlbumLikesService;
