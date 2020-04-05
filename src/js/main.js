

requirejs.config({
    baseUrl: "../node_modules/",
    paths: {
        d3js: 'd3/dist/d3.min',
        neo4j: 'neo4j-driver/lib/browser/neo4j-web.min',
        search: '../src/js/search.js',
        soundcloud: '../src/js/soundcloud.js',
        graph: '../src/js/queryexecuter.js',
        actions: '../src/js/actions.js',
        run: '../src/js/run.js'
    }
});

define(['/src/js/run.js'], function (run) {
    $(document).ready(function() {
        $('#login-sc').on('click', function() {
          run.waitForSoundcloud();
        });
    });
});
