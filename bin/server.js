var http            = require('http'),
    fs              = require('fs'),
    express         = require('express'),
    compression     = require('compression'),
    methodOverride  = require('method-override'),
    bodyParser      = require('body-parser'),
    serveStatic     = require('serve-static'),
    app             = express(),
    port            = process.env.npm_package_config_port,
    assetsRoot      = './assets',
    docRoot         = (process.env.NODE_ENV === 'production' || process.env.npm_package_config_prod) ? './dist' : './src';

app.disable('x-powered-by');


// Configure application
app.use(compression());
app.use(methodOverride());
// app.use(bodyParser());
app.use(serveStatic(docRoot));
app.use(serveStatic(assetsRoot));

// app.use(app.router);
// routes.initialize(app);
// REST API - Simple example of an API
//
app.get('/api/status', function(req, res, next) {
    db.status(function(obj){
        res.json({now: +new Date(), root: docRoot, assets: assetsRoot});
    });
});
//
// app.get(docRoot, function (req, res) {
//   console.log(req);
//   res.render('index');
// });

// Start server

var httpServer = http.createServer(app).listen(port);
console.info('Server running at http://localhost:' + port + '/');
console.info('Serving documents from ' + docRoot);
console.info('Serving assets from ' + assetsRoot);


// Prevent exceptions to bubble up to the top and eventually kill the server

process.on("uncaughtException", function (err) {
    console.warn(err.stack);
});
