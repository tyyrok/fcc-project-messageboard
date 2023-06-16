const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
//const Browser = require('zombie');

//Browser.site = 'http://localhost:3000/';

chai.use(chaiHttp);

let delete_password = '123';
let thread_id;
let prev_thread_id;
let reply_id;
let prev_reply_id;

suite('Functional Tests', function() {

    this.timeout(5000);

    test('#2 Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', (done) => {
        chai.request(server)
            //.keepOpen()
            .get('/api/threads/general')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.isArray(res.body);
                assert.isAtMost(res.body.length, 10);
                prev_thread_id = res.body[0]._id;
                
                done();
            });
    });
    test('#1 Creating a new thread: POST request to /api/threads/{board}', (done) => {
        chai.request(server)
            //.keepOpen()
            .post('/api/threads/general')
            .send({ "text" : "This is the test thread!",
                    "delete_password" : "123", })
            .end((err, res) => {
                assert.equal(res.status, 200);
                chai.request(server)
                    //.keepOpen()
                    .get('/api/threads/general')
                    .end((err, res) => {
                        assert.equal(res.status, 200);
                        assert.equal(res.type, "application/json");
                        if (res.body[0]._id != prev_thread_id) {
                            thread_id = res.body[0]._id;
                            prev_reply_id = res.body[0].replies[0]?._id;
                        }
                        assert.notEqual(res.body[0]._id, prev_thread_id);
                        done();
                    });
            });
    });
    
    test('#3 Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', (done) => {
        chai.request(server)
            //.keepOpen()
            .delete('/api/threads/general')
            .send({
                thread_id : thread_id,
                delete_password : 1,
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body, 'incorrect password')
                done();
            });
    });
    test('#4 Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', (done) => {
        chai.request(server)
            //.keepOpen()
            .delete('/api/threads/general')
            .send({
                thread_id : thread_id,
                delete_password : delete_password,
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body, 'success')
                done();
            });
    });
    test('#5 Reporting a thread: PUT request to /api/threads/{board}', (done) => {
        chai.request(server)
            //.keepOpen()
            .put('/api/threads/general')
            .send({
                thread_id : prev_thread_id,
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body, 'reported')
                done();
            });
    });
    test('#6 Creating a new reply: POST request to /api/replies/{board}', (done) => {
        chai.request(server)
            //.keepOpen()
            .post('/api/replies/general')
            .send({
                thread_id : prev_thread_id,
                text: "This is the new reply!",
                delete_password: delete_password,
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                chai.request(server)
                    //.keepOpen()
                    .get('/api/threads/general')
                    .end((err, res) => {
                        assert.equal(res.status, 200);
                        assert.equal(res.type, "application/json");
                        if (res.body[0].replies[0]._id != prev_reply_id) {
                            reply_id = res.body[0].replies[0]._id;
                        }
                        assert.notEqual(res.body[0].replies[0]._id, prev_reply_id);
                        done();
                    });

            });
    });
    test('#7 Viewing a single thread with all replies: GET request to /api/replies/{board}', (done) => {
        chai.request(server)
            //.keepOpen()
            .get('/api/replies/general')
            .query({
                thread_id: prev_thread_id
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body.replies[res.body.replies.length - 1]._id, reply_id);
                done();
            });
    });
    test('#8 Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', (done) => {
        chai.request(server)
            //.keepOpen()
            .delete('/api/replies/general')
            .send({
                thread_id : prev_thread_id,
                reply_id : reply_id,
                delete_password : 1,
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body, 'incorrect password')
                done();
            });
    });
    test('#9 Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', (done) => {
        chai.request(server)
            //.keepOpen()
            .delete('/api/replies/general')
            .send({
                thread_id : prev_thread_id,
                reply_id : reply_id,
                delete_password : delete_password,
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body, 'success')
                done();
            });
    });
    test('#10 Reporting a reply: PUT request to /api/replies/{board}', (done) => {
        chai.request(server)
            //.keepOpen()
            .put('/api/replies/general')
            .send({
                thread_id : prev_thread_id,
                reply_id : prev_reply_id,
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body, 'reported')
                done();
            });
    });
});
