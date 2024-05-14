'use strict';

const { ObjectID, ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

module.exports = function (app) {

  

  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  app.use(bodyParser.urlencoded({extended: false}))

  const projectSchema = new mongoose.Schema({
    project_name: String,
  });

  const issueSchema = new mongoose.Schema({
    project_id: {type: ObjectId, ref: 'Project'},
    issue_title: {
      type: String,
      required: true
    },
    issue_text: {
      type: String,
      required: true
    },
    created_by: {
      type: String,
      required: true
    },
    assigned_to: String,
    status_text: String,
    open: Boolean,
    created_on: Date,
    updated_on: Date
  });

  let Project = mongoose.model('Project', projectSchema);
  let Issue = mongoose.model('Issue', issueSchema);

  app.route('/api/issues/:project')
  
    .get(async function (req, res){
      let project = req.params.project;
      let projectData = await Project.findOne({project_name: project});

      if (!projectData) {
        return res.send({error: 'Project not found'});
      }

      const project_id = projectData._id;

      req.query.project_id = project_id;

      const issues = await Issue.find(req.query, {__v: 0});

      res.send(issues);

    })
    
    .post(async function (req, res){
      let project = req.params.project;
      const title = req.body.issue_title;
      const text = req.body.issue_text;
      const created_by = req.body.created_by;
      let assigned_to = req.body.assigned_to;
      let status_text = req.body.status_text;

      if (!title || !text || !created_by) {
        return res.send({
          error: 'required field(s) missing'
        })
      }

      if (!assigned_to) {
        assigned_to = "";
      }

      if (!status_text) {
        status_text = "";
      }

      let projectData = await findProjectIdOrCreateNew(project);

      const newIssue = await createIssue(projectData._id, title, text, created_by, assigned_to, status_text);

      res.send({
        issue_title: title,
        issue_text: text,
        created_by: created_by,
        assigned_to: assigned_to,
        status_text: status_text,
        created_on: newIssue.created_on,
        updated_on: newIssue.updated_on,
        open: newIssue.open,
        _id: newIssue._id
      });


    })
    
    .put(async function (req, res){
      let project = req.params.project;
      
      const _id = req.body._id;
      const project_id = await Project.findOne({project_name: project}, (err, data) => data);

      if (!_id || !project_id) {
        return res.send({
          error: 'missing _id'
        })
      }

      delete req.body._id;

      Object.keys(req.body).forEach((k) => req.body[k] == "" && delete req.body[k]);

      if (Object.keys(req.body).length === 0) {
        return res.send({
          error: 'no update field(s) sent',
          _id: _id
        })
      }

      if (!ObjectId.isValid(_id)) {
        return res.send({ error: 'could not update', '_id': _id });
      }

      req.body.updated_on = new Date();

      let updatedIssue = await Issue.findOneAndUpdate({_id: _id, project_id: project_id}, {$set: req.body});

      if (!updatedIssue) {
        return res.send({ error: 'could not update', _id: _id });
      }

      res.send({ result: 'successfully updated', _id: _id });
    })
    
    .delete(async function (req, res){
      let project = req.params.project;
      const _id = req.body._id;

      if (!_id) {
        return res.send({error: 'missing _id'})
      }

      if (!ObjectId.isValid(_id)) {
        return res.send({error: 'could not delete', '_id': _id});
      }
      
      let projectData = await Project.findOne({project_name: project});

      if (!projectData) {
        return res.send({error: 'could not delete', '_id': _id});
      }

      const project_id = projectData._id;

      const deletedIssue = Issue.findOneAndDelete({_id: _id, project_id: project_id});

      if (!deletedIssue) {
        return res.send({error: 'could not delete', '_id': _id});
      }

      res.send({ result: 'successfully deleted', '_id': _id });
    });

    //
    //HELPER METHODS
    const findProjectIdOrCreateNew = async (name) => {

      let project = await Project.findOne({project_name: name});
      if (!project) {
        project = new Project({project_name: name});
        await project.save();
      }

      return project;

    };

    const createIssue = async (project_id, title, text, created_by, assigned_to, status_text) => {

      const newIssue = new Issue({
        project_id: project_id,
        issue_title: title,
        issue_text: text,
        created_by: created_by,
        assigned_to: assigned_to,
        status_text: status_text,
        open: true,
        created_on: new Date(),
        updated_on: new Date()
      })
    
      return await newIssue.save();
    };

};


