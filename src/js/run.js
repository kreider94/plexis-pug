define(['./soundcloud.js', 'require', 'neo4j', 'd3/dist/d3.min', './run.js'], function (soundcloud, require, neo4j, d3, run) {
  var neo4j = require('neo4j');
  return {
    driver: neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password123")),
    waitForSoundcloud: function() {
      window.Plexis = {}
      if (typeof SC == "undefined") {
        setTimeout(waitForSoundcloud, 500);
      } else {
        SC.initialize({
          client_id: "m3kCd053xVXYtaEYQZ2e87SWSSuYnunA",
          client_secret: "Ur0s170Mz0aorJO700TOSY7qwdTWbv6i",
          redirect_uri: "http://plexis.org/callback.html"
        });

        SC.connect().then(() => {
          return SC.get("/me");
        }).then((me) => {
          this.populateUserProfile(me, "mainUser");
        });
      }
    },

    showData: function(user, userType) {
      Plexis.graph = this;
      soundcloud.currUserInfo(user.avatar_url, user.username);
      var concatData = Plexis.likedArtists.concat(Plexis.following);
      soundcloud.unique(concatData, (data) => {
        var users = data.filter((item) => {
          return (item.followings_count > 10) && (item.track_count > 0) && (item.followers_count > item.followings_count) && (item.followers_count !== 0)
        });
        Plexis.scUsers = users.sort(function(a,b) { return (b.ranking) - (a.ranking) } ).splice(0, 30);
        this.deleteNodes(() => {
          this.createUserNodes(Plexis.scUsers, () =>
            this.returnGraph())
        })
      });
    },

    populateUserProfile: function(user, userType) {
      Plexis[userType] = user;
      SC.get("/users/" + user.id + "/favorites", {
        limit: 200,
        linked_partitioning: 1
      }).then((tracks) => {
        Plexis.likedTracks = tracks.collection;
        Plexis.likedArtists = tracks.collection.map((track) => track.user);
        SC.get("/users/" + user.id + "/followings", {
          limit: 200,
          linked_partitioning: 1
        }).then((users) => {
          Plexis.following = users.collection;
          this.showData(user, userType);
        });
      });
    },

    createUserNodes: async function(arr, done) {
      var main = Plexis.mainUser,
        promiseUsers = [];
      arr.forEach((item, index) => {
        const session = this.driver.session();
        var transaction = session.writeTransaction(tx =>
            tx.run("CREATE (u:User {id: '" + item.id + "', username: '" + item.username + "', permalink: '" + item.permalink + "', avatar: '" + item.avatar_url + "', ranking: '" + item.ranking + "' })")
          ).then(result => {
            console.log("user created");
          })
          .catch(error => {
            console.log(error)
          })
          .then(() => session.close());

        promiseUsers.push(transaction);
      })
      return done(await Promise.all(promiseUsers));
    },

    deleteNodes: function(done) {
      $('svg').remove();
      this.driver.session().writeTransaction(tx => {
        tx.run("MATCH (n) DELETE n")
      }).then(result => {
        this.driver.session().close();
      }).then(done());
    },

    common: function(user, arr, callback) {
      var origLen = arr.length,
        found, x, y;

      var data = [];
      for (x = 0; x < usersList.length; x++) {
        found = undefined;
        for (y = 0; y < arr.length; y++) {
          if (usersList[x].id === arr[y].id) {
            found = true;
            data.push(arr[y]);
          }
        }
      }
      callback(data);
    },

    createRelationships: function(arr) {
      var user = Plexis.mainUser;
      arr.forEach((item, index) => {
        if (user.id != item.id) {
          this.driver.session().writeTransaction(tx =>
            tx.run("MATCH (a:User {id: " + user.id + " } ),(b:User {id: " + item.id + " }) CREATE (a)-[r:LIKES{weight:2}]->(b) RETURN a,r,b")
          ).then(result => {
            this.driver.session().close();
          });
        }
      })
    },

    returnGraph: function() {
      this.driver.session().writeTransaction(tx =>
        tx.run(
          "MATCH (n) RETURN n"
        )
      ).then(result => {
        let data = {};
        data.links = [];
        data.nodes = result.records.map((item) =>
          item._fields[0].properties
        );
        var canvas = d3.select("body").append("svg")
          .attr("id", "svg")
          .attr('width', window.innerWidth)
          .attr('height', window.innerHeight);

        var nodes;

        canvas = canvas.append('g')
          .attr("transform", "translate(" + window.innerWidth / 2 + "," + window.innerHeight / 2 + ")");

        for (let i = 0; i < data.nodes.length; i++) {
          for (let j = i + 1; j < data.nodes.length; j++) {
            let link = {
              source: data.nodes[i],
              target: data.nodes[j],
              weight: 5
            };
            data.links[i] = link;
          }
        }

        simulate();

        function draw() {
          canvas.append("g")
            .selectAll("line")
            .data(data.links)
            .enter()
            .append("line")
            .attr("x1", d => d.source.x)
            .attr("x2", d => d.target.x)
            .attr("y1", d => d.source.y)
            .attr("y2", d => d.target.y);

          nodes = canvas.selectAll('g.gnode')
            .data(data.nodes)
            .enter()
            .append('g')
            .classed('gnode', true)
            .attr("transform", function(d) {
              return "translate(" + d.x + "," + d.y + ")";
            })
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)

          var defs = nodes.append("defs");
          defs.append('pattern')
            .attr("id", function(d) {
              return "image" + d.id;
            })
            .attr("width", 1)
            .attr("height", 1)
            .append("svg:image")
            .attr("xlink:href", function(d) {
              return d.avatar;
            })
            .attr("width", 70)
            .attr("height", 70)

          nodes.append("svg:circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("fill", function(d) {
              return "url(#image" + d.id + ")"
            })
            .attr("r", 35)
            .on('click', function(d) {
              Plexis.graph.navigateToProfile(d);
            })

          function mouseover() {
            d3.select(this).select("circle").transition()
              .duration(750)
              .attr("r", 50);
            d3.select(this).select("image").transition()
              .duration(750)
              .attr("width", 100)
              .attr("height", 100)
            draw();
          }

          function mouseout() {
            d3.select(this).select("circle").transition()
              .duration(750)
              .attr("r", 35);
            d3.select(this).select("image").transition()
              .duration(750)
              .attr("width", 70)
              .attr("height", 70)
            draw();
          }
          // $('body').append(canvas);
          $('#middlelogo').hide();
        }

        function simulate() {
          // Remove all existing elements from the canvas.
          canvas.selectAll("*").remove();

          var simulation = d3.forceSimulation(data.nodes)
            .force("charge", d3.forceManyBody().strength(-200))
            .force('collision', d3.forceCollide().radius(25))
            .force("link", d3.forceLink(data.links).distance(20))
            .force("center", d3.forceCenter())
            .force("x", d3.forceX())
            .force("y", d3.forceY())

          d3.timeout(function() {
            // loading.remove();
            d3.select("middle").append("svg");

            for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
              simulation.tick();
            }
            draw();
          })
        }
      })
    },
    navigateToProfile: function(node) {
      var user = Plexis.scUsers.filter(function(item) {
        return item.id.toString() === node.id
      });

      if (user)
        this.populateUserProfile(user.pop(), 'secondaryUser');
    }
  }
})
