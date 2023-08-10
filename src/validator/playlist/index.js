const InvariantError = require('../../exceptions/InvariantError');
const {
  playlistPayloadSchema,
  playlistSongPayloadSchema,
} = require('./schema');

class PlaylistsValidator {
  validatePlaylistPayload = (payload) => {
    const validationResult = playlistPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }

    return validationResult.value;
  };

  validatePlaylistSongPayload = (payload) => {
    const validationResult = playlistSongPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }

    return validationResult.value;
  };
}

module.exports = PlaylistsValidator;
