/* eslint-disable quotes */
/* eslint-disable no-underscore-dangle */
const autoBind = require("auto-bind");

class AlbumHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name = "name", year } = request.payload;
    const albumId = await this._service.addAlbum({ name, year });
    const response = h.response({
      status: "success",
      message: "Album berhasil ditambahkan",
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumsHandler(h) {
    const albums = await this._service.getAlbums();
    const response = h.response({
      status: "success",
      data: {
        albums,
      },
    });
    response.code(200);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);

    if (!album) {
      const response = h.response({
        status: "fail",
        message: "Album tidak ditemukan",
      });
      response.code(404);
      return response;
    }

    const songs = await this._service.getDataSong(id);

    const response = h.response({
      status: "success",
      data: {
        album: {
          id: album.id,
          name: album.name,
          year: album.year,
          coverUrl: album.cover_url,
          songs: songs.map((song) => ({
            id: song.id,
            title: song.title,
            performer: song.performer,
          })),
        },
      },
    });
    response.code(200);
    return response;
  }

  async putAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const { name, year } = request.payload;

    if (typeof year !== "number") {
      const response = h
        .response({
          status: "fail",
          message: "Maaf, payload album tidak valid",
        })
        .code(400);
      return response;
    }

    await this._service.editAlbumById(id, { name, year });

    return {
      status: "success",
      message: "Album berhasil diperbarui",
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);
    return {
      status: "success",
      message: "Album berhasil dihapus",
    };
  }
}

module.exports = AlbumHandler;
