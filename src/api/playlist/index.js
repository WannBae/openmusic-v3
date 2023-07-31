const PlaylistHandler = require("./handler");
const routes = require("./routes");

module.exports = {
  name: "playlist",
  version: "1.0.0",
  register: async (server, { service, validator, songsService }) => {
    const playlisthandler = new PlaylistHandler(
      service,
      validator,
      songsService
    );
    server.route(routes(playlisthandler));
  },
};
