'use strict';
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);

let boardCollection = {

}
/*
    DBName - 'MessageBoard'
    Collections:
      boards:
          _id
          name
          ??delete_password
      threads:
          _id
          board_id
          name
          text
          created_on(date and time)
          bumped_on(date and time)
          reported - boolen
          delete_password
          replies (array _id, text, created_on, delete_password, reported) - storing only 10 recent replies
      replies:
        _id,
        text,
        created_on, 
        delete_password,
        reported

*/

module.exports = function (app) {
  prepareDB();
  app.route('/api/threads/:board');
    
  app.route('/api/replies/:board');

};
