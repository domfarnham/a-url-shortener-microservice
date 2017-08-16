'use strict';

const fs = require('fs');
const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
// Set database URL
const dbURL = "";
// Connect to database first
MongoClient.connect(dbURL, function(err, db) {
  assert.equal(null, err);
  console.log("Successfully connected to MongoDB.");
  
  // Retrives the next code number to be used for a short URL
  // Utilises a dedicated counters collection containing a single doc to update and retrieve
  // the next code number in sequence 
  const getNextCodeValue = function(sequenceName, callback) {
    db.collection("counters").findAndModify(
      {_id: sequenceName },
      [],
      {$inc:{sequence_value:1}},
      {new:true},
      function(err, doc) {
        if (err) {
          console.log(err);
          callback(err, null)
        } else {
          callback(null, doc.value.sequence_value);
        }
      }
    );
  };
  
  const insertURLDocIntoDatabase = function(document) {
    db.collection("shortenMyURL").insertOne(document, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("insertert document into db");
      }
    });
  };
  
  const searchDBForExisting = function(queryValue, callback) {
    let query;
    if (/\d{4}/.test(queryValue)) {
      query = {code: queryValue};
    } else {
      query = {originalURL: queryValue};
    }
    db.collection("shortenMyURL").find(query).toArray(function (err, documents) {
      if(err) {
        console.log("A db query error occured");
        callback("A db query error occured", null)
      }
      let response;
      if (documents.length > 0) {
        response = documents[0];
      } else {
        response = "Not Found";
      }
      callback(null, response);
    });
  };
  
  app.use('/public', express.static(process.cwd() + '/public'));
  
  app.get('/', (function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }));

  // API
  app.get(/api[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/, function(req, res) {
    searchDBForExisting(req.url.slice(5), function(err, answer) {
      let newURLDoc = {
        originalURL: req.url.slice(5)
      };
      if (answer === "Not Found") {
        // Get new code
        getNextCodeValue("urlCode", function(err, code) {
          newURLDoc.code = code;
          // Insert document into db
          insertURLDocIntoDatabase(newURLDoc);
          // return json to user
          res.send({"originalURL": newURLDoc.originalURL, "shortURL": "https://shorten-my-url.glitch.me/" + newURLDoc.code});
        });
      } else {
        // return json to user, using the code provided in the answer variable
        newURLDoc.code = answer.code;
        res.send({"originalURL": newURLDoc.originalURL, "shortURL": "https://shorten-my-url.glitch.me/" + newURLDoc.code});
      }
    });
  });

  // Redirect Service
  app.get(/[0-9]{4}/, function(req, res) {
    searchDBForExisting(parseInt(req.url.slice(1)), function(err, answer) {
      if (answer === "Not Found") {
        res.send({"error":"This url is not in the database."});
      } else if (answer.code === parseInt(req.url.slice(1))) {
        res.redirect(answer.originalURL);
      } else {
        res.send("Something went wrong!")
      }
    });
  });

  // Respond not found to all the wrong routes
  app.use(function(req, res, next){
    res.status(404);
    res.type('txt').send('Not found. Were you looking for the API? Read the home page carefully!');
  });

  // Error Middleware
  app.use(function(err, req, res, next) {
    if(err) {
      res.status(err.status || 500)
        .type('txt')
        .send(err.message || 'SERVER ERROR');
    }  
  })

  app.listen(process.env.PORT, function () {
    console.log('Node.js listening on port ' + process.env.PORT);
  });
  
});

