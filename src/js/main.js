
requirejs.config({
    baseUrl: "../node_modules/",
    paths: {
        d3js: 'd3/dist/d3.min',
        neo4j: 'neo4j-driver/lib/browser/neo4j-web.min',
        search: '../src/js/search',
        soundcloud: '../src/js/soundcloud',
        graph: '../src/js/graph',
        actions: '../src/js/actions',
        run: '../src/js/run'
    }
});

define(['/src/js/run.js'], function (run) {
    $(document).ready(function() {
        $('#login-sc').on('click', function() {
          run.waitForSoundcloud();
        });
    });
});
