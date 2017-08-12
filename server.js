'use strict';

let fs = require('fs');
let express = require('express');
let app = express();
// let requestHeaderParser = require("./lib/requestHeaderParser.js");


app.use('/public', express.static(process.cwd() + '/public'));
  
app.route('/')
    .get(function(req, res) {
		  res.sendFile(process.cwd() + '/views/index.html');
    });

// Demo
app.get('/api/https://www.google.com', function(req, res) {
  res.send({"originalURL":"https://www.google.com", "shortURL":"https://shorten-my-url.glitch.me/8170"});
});

app.get('/8170', function(req, res) {
  res.redirect('https://www.google.com');
});

// API
app.get(/api[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/, function(req, res) {
  res.send('tested ok bro');
})

// Respond not found to all the wrong routes
app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('Not found');
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

