exports.up = (pgm) => {
  pgm.createTable("playlistsongs", {
    id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    playlist_id: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    song_id: {
      type: "VARCHAR(50)",
      notNull: true,
    },
  });

  pgm.addConstraint(
    "playlistsongs",
    "fk_playlist_songs_id.songs_id",
    "FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE"
  );
  pgm.addConstraint(
    "playlistsongs",
    "fk_playlist_playlist_id.playlist_id",
    "FOREIGN KEY(playlist_id) REFERENCES playlist(id) ON DELETE CASCADE"
  );
};

exports.down = (pgm) => {
  pgm.dropConstraint("playlistsongs", "fk_playlist_songs_id.songs_id");
  pgm.dropConstraint("playlistsongs", "fk_playlist_playlist_id.playlist_id");
  pgm.dropTable("playlistsongs");
};
