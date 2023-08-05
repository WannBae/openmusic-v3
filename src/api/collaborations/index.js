const CollaborationsHandlers = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'collaborations',
  version: '1.0.0',
  register: async (
    server,
    {
      collaborationsService, playlistService, usersService, validator,
    },
  ) => {
    const collaborationsHandlers = new CollaborationsHandlers(
      collaborationsService,
      playlistService,
      usersService,
      validator,
    );
    server.route(routes(collaborationsHandlers));
  },
};
