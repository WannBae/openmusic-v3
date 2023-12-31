/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable quotes */
/* eslint-disable no-underscore-dangle */
const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const { AlbumModel } = require("../../utils/albums");
const NotFoundError = require("../../exceptions/NotFoundError");
const InvariantError = require("../../exceptions/InvariantError");
const { SongModel } = require("../../utils/songs");

class AlbumServices {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const query = {
      text: "INSERT INTO albums (id, name, year) VALUES ($1, $2, $3) RETURNING id",
      values: [id, name, year],
    };
    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError("Album gagal ditambahkan");
    }
    return result.rows[0].id;
  }

  async getAlbums() {
    const result = await this._pool.query("SELECT * FROM albums");
    return result.rows.map(AlbumModel);
  }

  async getSongsByAlbumId(id) {
    const query = {
      text: "SELECT * FROM songs WHERE album_id = $1",
      values: [id],
    };
    const result = await this._pool.query(query);
    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      performer: row.performer,
    }));
  }

  async getAlbumById(id) {
    const query = {
      text: "SELECT * FROM albums WHERE id=$1",
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      return null;
    }
    return AlbumModel(result.rows[0]);
  }

  async getDataSong(id) {
    const query = {
      text: "SELECT id, title, performer FROM songs WHERE album_id=$1",
      values: [id],
    };
    const result = await this._pool.query(query);
    return result.rows.map(SongModel);
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: "UPDATE albums SET name=$1, year=$2 WHERE id=$3 RETURNING id",
      values: [name, year, id],
    };
    const result = await this._pool.query(query);
    if (result.rows.length === 0) {
      throw new NotFoundError("Gagal memperbarui Album. Id tidak ditemukan");
    }
    return result;
  }

  async deleteAlbumById(id) {
    const query = {
      text: "DELETE FROM albums WHERE id=$1 RETURNING id",
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError("Gagal menghapus, id tidak ditemukan");
    }
  }

  async coverAlbumId(coverUrl, id) {
    const query = {
      text: "UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id",
      values: [coverUrl, id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError("Sampul gagal diperbarui. Id tidak ditemukan");
    }
    await this._cacheService.delete(`album:${id}`);
  }

  async getAlbumLikeId(id) {
    try {
      const result = await this._cacheService.get(`albums:${id}`);
      return {
        result: JSON.parse(result),
        cached: true,
      };
    } catch (error) {
      const query = {
        text: `SELECT albums.id as "album_id", albums.year as "album_year", albums.name as "album_name", albums.cover_url, songs.id, songs.title, songs.performer
        FROM songs RIGHT JOIN albums ON songs.album_id = albums.id
        WHERE albums.id = $1`,
        values: [id],
      };
      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError("Album tidak ditemukan");
      }
      await this._cacheService.set(`albums:${id}`, JSON.stringify(result));

      return {
        result,
        cached: false,
      };
    }
  }
}

module.exports = AlbumServices;
