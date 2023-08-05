/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable quotes */
/* eslint-disable no-underscore-dangle */
const { nanoid } = require('nanoid');
const { Pool } = require('pg');

class ActivitiesService {
  constructor() {
    this._pool = new Pool();
  }

  async deleteActivities(playlistId, userId, songId) {
    const id = `activity-${nanoid(16)}`;

    const time = new Date();

    const query = {
      text: `INSERT INTO activities
          VALUES($1,$2,$3,$4,$5,$6)`,
      values: [id, playlistId, songId, userId, 'delete', time],
    };
    await this._pool.query(query);
  }

  async addActivities(playlistId, userId, songId) {
    const id = `activity-${nanoid(16)}`;
    const time = new Date();
    const query = {
      text: `INSERT INTO activities
                 VALUES($1, $2, $3, $4, $5, $6)`,
      values: [id, playlistId, songId, userId, 'add', time],
    };
    await this._pool.query(query);
  }
}

module.exports = ActivitiesService;
