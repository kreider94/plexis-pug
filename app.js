var http = require('http'),
  fs = require('fs'),
  express = require('express'),
  bodyParser = require('body-parser'),
  serveStatic = require('serve-static'),
  path = require('path'),
  app = express(),
  port = process.env.npm_package_config_port,
  assetsRoot = './gfx',
  docRoot = (process.env.NODE_ENV === 'production' || process.env.npm_package_config_prod) ? './dist' : './';

app.set('views', './views');
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(serveStatic(assetsRoot));
// Define route for main page
app.get('/', function (req, res) {
    res.render('home', { title: 'Plexis' } );
})


var httpServer = http.createServer(app).listen(8080);
console.info('Server running at http://localhost:8080/');
console.info('Serving documents from ' + docRoot);
console.info('Serving assets from ' + assetsRoot);

process.on("uncaughtException", function(err) {
  console.warn(err.stack);
});
