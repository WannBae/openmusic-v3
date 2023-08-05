/* eslint-disable quotes */
/* eslint-disable no-underscore-dangle */

const autoBind = require('auto-bind');

class PlaylistHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    autoBind(this);
  }

  // activity handler
  async getActivitiesHandler(request) {
    const { id: playlistId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(playlistId, userId);
    const activities = await this._service.getActivities(playlistId);
    return {
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    };
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload); // Fixed typo here
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this._service.addPlaylist({
      name,
      owner: credentialId,
    });

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._service.getPlaylists(credentialId);
    const response = h.response({
      status: 'success',
      data: {
        playlists,
      },
    });
    response.code(200); // Fixed response code here
    return response;
  }

  async deletePlaylistByIdHandler(request, h) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(playlistId, credentialId); // Fixed typo here
    await this._service.deletePlaylistById(playlistId);
    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil dihapus',
    });
    response.code(200); // Fixed response code here
    return response;
  }

  // ... other methods

  async postPlaylistWithIdHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);

    const { songId } = request.payload;
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    await this._service.verifySongPlaylist(songId);
    await this._service.addSongToPlaylist(playlistId, songId, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan pada playlist',
    });
    response.code(201);
    return response;
  }

  async getPlaylistWithIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.verifyPlaylistAccess(id, credentialId);

    const playlist = await this._service.getPlaylistWithId(id);
    const response = h.response({
      status: 'success',
      data: {
        playlist,
      },
    });
    return h.response(response);
  }

  async deleteSongPlaylistHandler(request) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;
    const { songId } = request.payload;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    await this._service.verifySongPlaylist(songId);
    await this._service.deleteSongFromPlaylist(
      songId,
      playlistId,
      credentialId,
    );

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus dari playlist',
    };
  }
}

module.exports = PlaylistHandler;
