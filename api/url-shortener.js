'use strict';

module.exports = function (app, db, collection) {
  app
    .get("/new/:url*", function (request, response) {
      var myUrl = request.url.slice(5);
      if (isValidURL(myUrl)) {
        genShortUrl(myUrl, db, response, saveUrl)
      } else {
        response.set('Content-Type', 'application/json');
        response.send({error: "Wrong url format, make sure you have a valid protocol and real site."})
      }
    });

  app.get('/:encoded_id', function (req, res) {
    // route to redirect the visitor to their original URL given the short URL
    var shortUrl = process.env.APP_URL + req.params.encoded_id;
    findUrl(shortUrl, db, res);
  });
  
  function genShortUrl(oriUrl, db, res, callback) {
    db.collection(collection).find().toArray(function(err, data) {
      if (err) return callback(err);
      
      var urls = data.map(function(obj) {
        return obj.short_url;
      })
      
      var shortenedUrl;
      // Generate link and check for uniqueness
      do {
        var randNum = Math.floor(100000 + Math.random() * 900000);
        shortenedUrl = process.env.APP_URL + randNum.toString().substring(0,5);
      } while(urls.indexOf(shortenedUrl) != -1);
      
      var urlObj = {
        original_url: oriUrl,
        short_url: shortenedUrl
      }
      
      callback(null, urlObj, db, res)
    })
  }
  
  function saveUrl(err, urlObj, db, res) {
    if(err) throw err;
    
    db.collection(collection).save(urlObj, function(err, result) {
      if(err) throw err;
      
      res.set('Content-Type', 'application/json');
      res.send({
        original_url: urlObj.original_url,
        short_url: urlObj.short_url
      })
    })
  }
  
  function findUrl(shortUrl, db, res) {
    db.collection(collection).findOne({short_url: shortUrl}, function(err, result) {
      if(err) throw err;
      
      if(result) {
         res.redirect(result.original_url);
      } else {
        res.send({
        "error": "This url is not on the database."
      });
      }
    })
  }
  
  function isValidURL(str) {
    var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d' +
        '\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d' +
        '?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-' +
        '\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:' +
        '\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
    var url = new RegExp(urlRegex, 'i');
    return str.length < 2083 && url.test(str);
  }
}