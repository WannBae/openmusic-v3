exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("activities", {
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
    user_id: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    action: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    time: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.addConstraint(
    "activities",
    "fk_activities.playlist_id_playlist.id",
    "FOREIGN KEY(playlist_id) REFERENCES playlist(id) ON DELETE CASCADE"
  );
};

exports.down = (pgm) => {
  pgm.dropTable("activities");
};
