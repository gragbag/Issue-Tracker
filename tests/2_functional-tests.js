const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let id_to_delete = ""

suite('Functional Tests', function() {
  test('Create an issue with every field: POST request to /api/issues/{project}', (done) => {
    chai
     .request(server)
     .keepOpen()
     .post('/api/issues/tester123')
     .send({
        issue_title: "test1",
        issue_text: "testing 1",
        created_by: "me1",
        assigned_to: "you1",
        status_text: 'working1'
     })
     .end((err, res) => {
        id_to_delete = res.body._id;
        assert.containsAllDeepKeys(res.body, {
            issue_title: "test1",
            issue_text: "testing 1",
            created_by: "me1",
            assigned_to: "you1",
            status_text: 'working1',
            open: true
        })
        done();
     })
  })

  test("Create an issue with only required fields: POST request to /api/issues/{project}", (done) => {
    chai
     .request(server)
     .keepOpen()
     .post('/api/issues/tester123')
     .send({
        issue_title: 'test2',
        issue_text: 'testing 2',
        created_by: 'me2'
     })
     .end((err, res) => {
        assert.containsAllDeepKeys(res.body, {
            issue_title: "test2",
            issue_text: "testing 2",
            created_by: "me2",
            assigned_to: "",
            status_text: "",
            open: true
        })
        done();
     })
  })

  test("Create an issue with missing required fields: POST request to /api/issues/{project}", (done) => {
    chai
     .request(server)
     .keepOpen()
     .post('/api/issues/tester123')
     .send({
        issue_title: 'missingFields3'
     })
     .end((err, res) => {
        assert.deepEqual(res.body, {
            error: 'required field(s) missing'
        });
        done();
     })
  })

  test("View issues on a project: GET request to /api/issues/{project}", (done) => {
    chai
     .request(server)
     .keepOpen()
     .get('/api/issues/tester123')
     .end((err, res) => {
        assert.isNotEmpty(res.body)
        done();
     })
  });

  test("View issues on a project with one filter: GET request to /api/issues/{project}}", (done) => {
    chai
     .request(server)
     .keepOpen()
     .get('/api/issues/tester123?open=true')
     .end((err, res) => {
        assert.isNotEmpty(res.body)
        done();
     })
  });

  test("View issues on a project with multiple filters: GET request to /api/issues/{project}", (done) => {
    chai
     .request(server)
     .keepOpen()
     .get('/api/issues/tester123?open=true&issue_title=test2')
     .end((err, res) => {
        assert.isNotEmpty(res.body)
        done();
     })
  });

  test("Update one field on an issue: PUT request to /api/issues/{project}", done => {
    chai
     .request(server)
     .keepOpen()
     .put('/api/issues/tester123')
     .send({
        _id: "6643e31f78e7462dcfee393e",
        issue_title: 'testing put with one field'
     })
     .end((err, res) => {
        assert.containsAllDeepKeys(res.body, {
            result: 'successfully updated'
        })
        done();
     })
  })

  test("Update multiple fields on an issue: PUT request to /api/issues/{project}", done => {
    chai
     .request(server)
     .keepOpen()
     .put('/api/issues/tester123')
     .send({
        _id: "6643e31f78e7462dcfee393e",
        issue_title: 'testing put with two fields',
        issue_text: 'did it work?'
     })
     .end((err, res) => {
        assert.containsAllDeepKeys(res.body, {
            result: 'successfully updated'
        })
        done();
     })
  })

  test("Update an issue with missing _id: PUT request to /api/issues/{project}", done => {
    chai
     .request(server)
     .keepOpen()
     .put('/api/issues/tester123')
     .send({
        issue_title: 'testing put with one field'
     })
     .end((err, res) => {
        assert.deepEqual(res.body, {
            error: 'missing _id'
        })
        done();
     })
  })

  test("Update an issue with no fields to update: PUT request to /api/issues/{project}", done => {
    chai
     .request(server)
     .keepOpen()
     .put('/api/issues/tester123')
     .send({
        _id: "6643e31f78e7462dcfee393e",
     })
     .end((err, res) => {
        assert.deepEqual(res.body, {
            error: 'no update field(s) sent',
            _id: "6643e31f78e7462dcfee393e"
        })
        done();
     })
  })

  test("Update an issue with an invalid _id: PUT request to /api/issues/{project}", done => {
    chai
     .request(server)
     .keepOpen()
     .put('/api/issues/tester123')
     .send({
        _id: "23100dcdfe2",
        issue_text: 'testing invalid _id'
     })
     .end((err, res) => {
        assert.deepEqual(res.body, {
            error: 'could not update',
            _id: "23100dcdfe2"
        })
        done();
     })
  })

  test("Delete an issue: DELETE request to /api/issues/{project}", done => {
    chai
     .request(server)
     .keepOpen()
     .delete('/api/issues/tester123')
     .send({
        _id: id_to_delete,
     })
     .end((err, res) => {
        assert.deepEqual(res.body, {
            result: 'successfully deleted',
            _id: id_to_delete
        })
        done();
     })
  })

  test("Delete an issue with an invalid _id: DELETE request to /api/issues/{project}", done => {
    chai
     .request(server)
     .keepOpen()
     .delete('/api/issues/tester123')
     .send({
        _id: "6643e29f11df762d3505362",
     })
     .end((err, res) => {
        assert.deepEqual(res.body, {
            error: 'could not delete',
            _id: "6643e29f11df762d3505362"
        })
        done();
     })
  })

  test("Delete an issue with missing _id: DELETE request to /api/issues/{project}", done => {
    chai
     .request(server)
     .keepOpen()
     .delete('/api/issues/tester123')
     .send({})
     .end((err, res) => {
        assert.deepEqual(res.body, {
            error: 'missing _id',
        })
        done();
     })
  })


});
