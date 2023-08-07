/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable("album_likes", {
    id: {
      type: "VARCHAR(50)",
      primariKey: true,
    },
    user_id: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    album_id: {
      type: "VARCHAR(50)",
      notNull: true,
    },
  });
  pgm.addConstraint(
    "album_likes",
    "unique_user_id_and_album_id",
    "UNIQUE(user_id, album_id)"
  );
  pgm.addConstraint(
    "album_likes",
    "fk_album_likes.users.id",
    "FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE"
  );
  pgm.addConstraint(
    "album_likes",
    "fk_album_likes.albums.id",
    "FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE"
  );
};

exports.down = (pgm) => {
  pgm.dropTable("album_likes");
};
