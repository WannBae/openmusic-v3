const AlbumLikesHandler = require("./handler");
const routes = require("./routes");

module.exports = {
  name: "albumLikes",
  version: "1.0.0",
  register: async (server, { service, validator }) => {
    const albumLikesHandler = new AlbumLikesHandler(service, validator);
    server.route(routes(albumLikesHandler));
  },
};
