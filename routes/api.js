'use strict';
const { query } = require('express');
const { MongoClient } = require('mongodb');
const { ObjectId }    = require('bson');
const { options } = require('../server');


const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);

/*
    DBName - 'MessageBoard'
    Collections:
      boards:
          _id
          name
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


  app.route('/api/threads/:board')
    .get(function(req, res) {
      //console.log(req);

      getBoardRecentThreads(req.params.board, res);

    })
    .post(function(req, res) {
      //console.log(req.body);
      
      createNewThread(req.body, res, req.params.board);

    })
    .put(function(req, res) {
      //console.log(req.body);

      reportThread(req.body.thread_id ? req.body.thread_id : req.body.report_id, res);
    })
    .delete(function(req, res) {
      //console.log(req.body);

      deleteThread(req.body, res);

    });

  app.route('/api/replies/:board')
     .post(function(req, res) {
        //console.log(req.body, req);

        createNewReply(req.body, req.params.board, res);
     })
     .get(function(req, res) {
        //console.log(req);

        getThreadWithReplies(req.query.thread_id, res);
     })
     .put(function(req, res)  {

        reportReply(req.body.thread_id, req.body.reply_id, res);
     })
     .delete(function(req, res) {
        //console.log(req.body);

        deleteReply(req.body, res);

     });

  async function reportReply(thread_id, reply_id, res) {
    try {
      await client.connect();
      const database = client.db('MessageBoard');
      const threads = database.collection('threads');

      const threadReplyReported = await threads.updateOne({
                                        _id: new ObjectId(thread_id),},
                                        { $set: { "replies.$[elem].reported" : true } },
                                        { arrayFilters: [ { "elem._id" :  +reply_id } ]} );
      

      res.json("reported");

    } finally {
      await client.close();
    }
  }

  async function deleteReply(query, res) {
    try {
      await client.connect();
      const database = client.db('MessageBoard');
      const threads = database.collection('threads');

      const threadWithDeletedReply = await threads.updateOne( 
                                            { _id : new ObjectId(query.thread_id), 
                                              replies: { $elemMatch : {  _id : +query.reply_id, 
                                                          delete_password: query.delete_password, }}
                                            }, 
                                            { $set: { "replies.$[elem].text" : '[deleted]'  }},
                                            { arrayFilters: [ { "elem._id" :  +query.reply_id, 
                                                                "elem.delete_password" : query.delete_password } ]
                                            });
      

      if (threadWithDeletedReply.modifiedCount === 1) {
        res.json("success");
      } else {
        res.json("incorrect password");
      }

    } finally {
      await client.close();
    }
  }

  async function getThreadWithReplies(thread_id, res) {
    try {
      await client.connect();
      const database = client.db('MessageBoard');
      const threads = database.collection('threads');

      const options = {
        projection: { board_id : 0, 
                      delete_password : 0, 
                      reported: 0,
                      replies : {
                        thread_id: 0,
                        delete_password: 0,
                      },
                    }
      };

      const findThreadById = await threads.findOne( { _id : new ObjectId(thread_id) }, options );

      if (!findThreadById) {
        res.json("Thread doesn't exists");
        return true;
      } 

      //console.log(findThreadById);
      res.json(findThreadById);

    } finally {
      await client.close();
    }
  }

  async function createNewReply(body, board, res) {
    try {
      await client.connect();
      const database = client.db('MessageBoard');
      const boards = database.collection('boards');
      const threads = database.collection('threads');

      const findThreadById = await threads.findOne( {_id : new ObjectId(body.thread_id)} );

      if (!findThreadById) {
        res.json("Thread doesn't exists");
        return true;
      } 
      
      const index = findThreadById.replies.length;
      //console.log(index);

      const newReplyObj = { _id: index + 1,
                            text: body.text,
                            created_on : new Date(),
                            delete_password : body.delete_password, 
                            thread_id : body.thread_id,
                            reported : false, };
      
      //console.log(newReplyObj);

      const updatedThread = {
        $set: {
          bumped_on : newReplyObj.created_on,
        },
        $push: {
          replies : newReplyObj,
        },
      };

      const threadUpdated = await threads.updateOne({ _id: new ObjectId(body.thread_id) },
                                                      updatedThread);
      //console.log(findThreadById);
      res.redirect(`/b/${board}/${body.thread_id}/`);
      
    } finally {
      await client.close();
    }
  }

  async function reportThread(id, res) {
    try {
      await client.connect();
      const database = client.db('MessageBoard');
      const boards = database.collection('boards');
      const threads = database.collection('threads');

      const findThreadById = await threads.findOne( {_id : new ObjectId(id)});

      if (!findThreadById) {
        res.json("Thread doesn't exists");
        return true;
      }

      const updateDoc = {
        $set : {
          reported : true,
        },
      };

      const updateResult = await threads.updateOne( { _id : new ObjectId(id) }, updateDoc );

      //console.log(updateResult);

      res.json("reported");

    } finally {
      await client.close();
    }
  }

  async function deleteThread(query, res) {
    try {

      await client.connect();
      const database = client.db('MessageBoard');
      const boards = database.collection('boards');
      const threads = database.collection('threads');

      const findThreadById = await threads.findOne( {_id : new ObjectId(query.thread_id) });

      if (!findThreadById) {
        res.json("Thread doesn't exists");
        return true;
      } 
      const objToDelete = { _id : new ObjectId(query.thread_id), 
                            delete_password : query.delete_password };

      const deletedThread = await threads.deleteOne(objToDelete);

      if (deletedThread.deletedCount === 1) {
        res.json("success");
      } else {
        res.json("incorrect password");
      }

    } finally {
      await client.close();
    }
  }

  async function getBoardRecentThreads(board, res) {
    try {
      await client.connect();
      console.log(board);

      const database = client.db('MessageBoard');
      const boards = database.collection('boards');
      const threads = database.collection('threads');

      const board_id = await boards.findOne({ name : board });
      /*
      if (!board_id) {
        await client.close();
        res.json("Board doesn't exists");
      }
      */
      console.log("Board_id " + board_id);

      const resultThreads = await threads.aggregate([
        { $match : { board_id : board_id?._id }},
        { $sort : { "bumped_on" : -1}, },
        { $set : { replies: { $sortArray: {input: "$replies", sortBy: { created_on: -1 } }}} },
        
        { $project : { board_id : 0, 
          delete_password : 0, 
          reported: 0,
          replies: { reported: 0, delete_password: 0,},
        },},
        { $addFields: { replycount : { $size : '$replies' } } },
        { $set : { replies: { $slice : [ '$replies', 3 ] } } },
        { $limit : 10 },
  
      ]).toArray();
                                          
      //console.log(resultThreads);
      await client.close();
      res.json(resultThreads);

      //return true;

    } catch(err) {
      console.log(err);
    }
  }

  async function createNewThread(query, res, boardName) {
    try {
      await client.connect();
      const database = client.db('MessageBoard');
      const boards = database.collection('boards');
      const threads = database.collection('threads');

      //let searchQuery = { name : query.board };

      let searchQuery = { name : (query.board ? query.board : boardName) }
      //console.log(searchQuery, query, boardName);

      const board = await boards.findOne(searchQuery);
      //console.log("Board while creating thread " + board);
      let board_id;
      if (!board) {
        board_id = (await boards.insertOne({ name : boardName, })).insertedId;
      } else {
        board_id = board._id;
      }
      //console.log(board_id);
      const doc = {
        text : query.text,
        board_id : board_id,
        delete_password : query.delete_password,
        created_on : new Date(),
        bumped_on : new Date(),
        reported : false,
        replies : []
      }

      const result = await threads.insertOne(doc);
      //console.log(result);

      res.redirect(`/b/${searchQuery.name}/`);

    } finally {
      await client.close();
    }
    
  }

};
