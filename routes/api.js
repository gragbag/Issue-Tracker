'use strict';

const { ObjectID, ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

module.exports = function (app) {

  

  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  app.use(bodyParser.urlencoded({extended: false}))

  const projectSchema = new mongoose.Schema({
    project_name: String
  });

  const issueSchema = new mongoose.Schema({
    project_id: String,
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
      
      project = await Project.findOne({project_name: project}, (err, data) => data);

      const project_id = project._id;

      req.query.project_id = project_id;

      const issues = await Issue.find(req.query, {__v: 0}, (err, data) => data);

      res.send(issues);

    })
    
    .post(async function (req, res){
      let project = req.params.project;
      const title = req.body.issue_title;
      const text = req.body.issue_text;
      const created_by = req.body.created_by;
      const assigned_to = req.body.assigned_to;
      const status_text = req.body.status_text;
      
      const project_id = await findProjectIdOrCreateNew(project);

      if (!title || !text || !created_by) {
        res.send({
          error: 'requred field(s) missing'
        })
      }

      const newIssue = await createIssue(project_id, title, text, created_by, assigned_to, status_text);

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

      if (!_id) {
        res.send({
          error: 'missing _id'
        })
      }

      delete req.body._id;

      Object.keys(req.body).forEach((k) => req.body[k] == "" && delete req.body[k]);

      if (Object.keys(req.body).length === 0) {
        res.send({
          error: 'no update field(s) sent',
          _id: _id
        })
      }

      if (!ObjectId.isValid(_id)) {
        res.send({ error: 'invalid _id'});
      }

      await Issue.findOneAndUpdate({_id: _id}, {$set: req.body}, (err, data) => {
        if (err) res.send({ error: 'could not update', _id: _id });
        else
          res.send({ result: 'successfully updated', _id: _id });
      });
    })
    
    .delete(function (req, res){
      let project = req.params.project;
      
      const _id = req.body._id;

      if (!_id) {
        res.send({error: 'missing _id'})
      }

      Issue.findByIdAndDelete(_id, (err, data) => {
        if (err) res.send({error: 'could not delete', '_id': _id});
        else res.send({ result: 'successfully deleted', '_id': _id });
      })
    });

    const findProjectIdOrCreateNew = async (name) => {
      let project_id = "";

      await Project.findOne({project_name: name}, async (err, data) => {
        if (err) console.log(err);

        if (!data) {
          const project = await createAndSaveProject(name);
          project_id = project._id;
        } else {
          project_id = data._id;
        }
      });

      return project_id;

    };

    const createAndSaveProject = async (name) => {
      const newProject = new Project({
        project_name: name
      });

      const returnedProject = await newProject.save();
      return returnedProject;
    }

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
    
      const returnedIssue = await newIssue.save();
      return returnedIssue;
    };

};


