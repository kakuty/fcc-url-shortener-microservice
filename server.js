// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var mongodb = require('mongodb');
var api = require('./api/url-shortener')

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

mongodb.MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
  if(err) {
    throw new Error('Database failed to connect!')
  }
  
  var collection = process.env.COLLECTION || 'urls';
  db.createCollection(collection, { capped : true, size : 5242880, max : 5000 } )
  
  app.get("/", function (request, response) {
    response.sendFile(__dirname + '/views/index.html');
  });
  
  app.get('/new', function(req, res) {
    res.set('Content-Type', 'application/json');
    res.send({
      error: 'Wrong url format, make sure you have a valid protocol and real site.'
    })
  })
  
  api(app, db, collection)
  
  // listen for requests :)
  var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

})
