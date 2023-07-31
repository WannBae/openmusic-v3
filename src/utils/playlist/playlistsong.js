const PlaylistModel = (playlist, songs) => ({
  playlist: {
    id: playlist.id,
    name: playlist.name,
    username: playlist.username,
    songs: songs,
  },
});

module.exports = PlaylistModel;
