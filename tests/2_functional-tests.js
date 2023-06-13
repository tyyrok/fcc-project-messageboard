const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Browser = require('zombie');

Browser.site = 'http://localhost:3000/';

chai.use(chaiHttp);

let delete_password = '123';
let thread_id;
let reply_id;

suite('Functional Tests', function() {

    this.timeout(2000);

    test('#1 Creating a new thread: POST request to /api/threads/{board}', (done) => {
        chai.request(server)
            .keepOpen()
            .post('/api/threads/general')
            .send({ "text" : "This is the test thread!",
                    "delete_password" : "123", })
            .end((err, res) => {
                assert.equal(res.status, 200);

                //Need to write callback zombie to check if a thread is created and save thread_id in thread_id
                done();
            });
    });
    test('#2 Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', (done) => {
        chai.request(server)
            .keepOpen()
            .get('/api/threads/general')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.isArray(res.body);
                assert.isAtMost(res.body.length, 10);
                done();
            });
    });
    test('#3 Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', (done) => {
        chai.request(server)
            .keepOpen()
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
            .keepOpen()
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
            .keepOpen()
            .put('/api/threads/general')
            .send({
                thread_id : thread_id,
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
            .keepOpen()
            .post('/api/threads/general')
            .send({
                thread_id : thread_id,
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");

                ///need to write zombie callback for getting infof and check if a new replu is created or not?
                done();
            });
    });
    test('#7 Viewing a single thread with all replies: GET request to /api/replies/{board}', (done) => {
        chai.request(server)
            .keepOpen()
            .get('/api/threads/general')
            .query({
                thread_id: thread_id
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "html");
                
                ///need to write zombie callback for checking a single thread with all replies?
                done();
            });
    });
    test('#8 Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', (done) => {
        chai.request(server)
            .keepOpen()
            .delete('/api/threads/general')
            .send({
                thread_id : thread_id,
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
            .keepOpen()
            .delete('/api/threads/general')
            .send({
                thread_id : thread_id,
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
    test('#10 Reporting a thread: PUT request to /api/threads/{board}', (done) => {
        chai.request(server)
            .keepOpen()
            .put('/api/threads/general')
            .send({
                thread_id : thread_id,
                reply_id : reply_id,
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body, 'reported')
                done();
            });
    });
});
