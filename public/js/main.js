
requirejs.config({
    baseUrl: "/",
    paths: {
        d3js: '/js/d3.min',
        neo4j: '/js/neo4j-web.min',
        search: '/js/search',
        soundcloud: '/js/soundcloud',
        graph: '/js/graph',
        actions: '/js/actions',
        run: '/js/run'
    }
});

define(['/js/run.js'], function (run) {
    $(document).ready(function() {
        $('#login-sc').on('click', function() {
          run.waitForSoundcloud();
        });

        $('#searchsc').on('keypress', function (e) {
         var key = e.which;
         if(key == 13)
          {
            let searchval = $(this).val();
            run.searchbarResolve(searchval);
          }
        });
    });
});
