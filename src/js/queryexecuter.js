define(['require', 'neo4j', 'd3/dist/d3.min'], function (require, neo4j, d3) {
  var neo4j = require('neo4j');
  return {
    driver: neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password123")),
    createUserNodes: async function(arr, done) {
      var main = Plexis.mainUser,
        promiseUsers = [];
      this.driver.session().writeTransaction(tx =>
        tx.run("CREATE (u:User {id: '" + main.id + "', username: '"+ main.username + "', permalink: '" + main.permalink + "', avatar: '"+ main.avatar_url +"', ranking: '"+ main.ranking+ "' })")
      );
      arr.forEach((item, index) => {
        const session = this.driver.session();
        var transaction =session.writeTransaction(tx =>
          tx.run("CREATE (u:User {id: '" + item.id + "', username: '"+ item.username + "', permalink: '" + item.permalink + "', avatar: '"+ item.avatar_url +"', ranking: '"+ item.ranking+ "' })")
        ).then(result => {
            console.log("user created");
          })
          .catch(error => {
            console.log(error)
          })
          .then(() => session.close());

        promiseUsers.push(transaction);
      });
      return done(await Promise.all(promiseUsers));
    },

    deleteNodes: function() {
      this.driver.session().writeTransaction(tx => {
        tx.run("MATCH (n) OPTIONAL MATCH (n)-[r]-() DELETE n,r")
      }).then(result => {
        this.driver.session().close();
      })
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
      user = Plexis.mainUser;
      arr.forEach((item, index) => {
        if (user.id != item.id) {
          this.driver.session().writeTransaction(tx =>
            tx.run("MATCH (a:User {id: " + user.id + " } ),(b:User {id: " + item.id + " }) CREATE (a)-[r:LIKES{weight:2}]->(b) RETURN a,r,b")
          ).then(result => {
            this.driver.session().close();
          });
        }
        // if (index != arr.length - 1) {
        //   // setInterval(this.checkNeo(index), 100);
        // }
        // return this.driver.session().writeTransaction(tx =>
        //   tx.run("match (n) SET n.size = SIZE(()-[:LIKES]->(n)) return n.size")
        // ).then(result => {
        //   this.driver.session().close();
        // });
      });
    },

    checkNeo: function(arr) {
      this.driver.session().writeTransaction(tx => {
        return tx.run(
          "MATCH (a)-[r:LIKES]->(b) WITH count(b) as rels RETURN rels"
        )
      }).then(result => {
        this.driver.session().close();
        this.returnGraph();
      });
    },

    returnGraph: function() {
      this.driver.session().writeTransaction(tx =>
        tx.run(
          // "MATCH path = (n)-[r]->(m) RETURN *"
          "MATCH (n) RETURN n"
        )
      ).then(result => {
        let data = {}; data.links = [];
        data.nodes = result.records.map((item) =>
          item._fields[0].properties
        );

        var canvas = d3.select("body").append("svg")
          .attr("id", "svg")
          .attr('width', window.innerWidth)
          .attr('height', window.innerHeight);

        var nodes;

        // canvas = canvas.append('g')
        // .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

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
          // Draw links.
          var defs = vis.insert("svg:defs")
               .data(["end"]);


          defs.enter().append("svg:path")
          var links = d3.layout.tree().links(data.nodes);

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
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })

          var defs = nodes.append("defs");
          defs.append('pattern')
            .attr("id", function(d) { return "image"+ d.id;}  )
            .attr("width", 1)
            .attr("height", 1)
            .append("svg:image")
            .attr("xlink:href", function(d) { return d.avatar;})
            .attr("width", 70)
            .attr("height", 70);

          nodes.append("svg:circle")
              .attr("cx", d => d.x)
              .attr("cy", d => d.y)
              .attr("fill",function(d) { return "url(#image"+ d.id +")" }  )
              .attr("r", 35)

          $('body').append(canvas);
          $('#middlelogo').hide();
        }

        function simulate() {
          // Remove all existing elements from the canvas.
          canvas.selectAll("*").remove();

          // Create a new force simulation and assign forces.
          var simulation = d3.forceSimulation(data.nodes)
            .force("charge", d3.forceManyBody().strength(-60))
            .force("center", d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2))
            .force('collision', d3.forceCollide().radius(function(d) {
              return d.radius
            }))
            .force(
              "link", d3.forceLink(data.links).strength(d => 0.5)
            )
            .force("manyBody", d3.forceManyBody());

          draw();
          simulation.on("tick", () => {
              canvas.selectAll("line").attr("d", function(d) {

              var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);
                    return   "M" + d.source.x + ","
                     + d.source.y
                     + "A" + dr + ","
                     + dr + " 0 0,1 "
                     + d.target.x + ","
                     + d.target.y;
           });
             canvas.selectAll('g.gnode').attr("transform", nodeTransform);

             function nodeTransform(d) {
               d.x =  Math.max(10, Math.min(window.innerWidth/2 - (35), d.x));
               d.y =  Math.max(10, Math.min(window.innerHeight/2 - (35), d.y));
               return "translate(" + d.x + "," + d.y + ")";
             }
           })
         }
              // // Update links.
              // canvas
              //     .selectAll("line")
              //     .attr("x1", d => d.source.x)
              //     .attr("x2", d => d.target.x)
              //     .attr("y1", d => d.source.y)
              //     .attr("y2", d => d.target.y);
              //
              // // Update nodes
              // canvas
              //     .selectAll("g.gnode")
              //     .attr("cx", d => d.x)
              //     .attr("cy", d => d.y);
              //
              // draw();
      })
    }
  }
})


          //
          // var avatars = [];
          //
          // function getAvatars(nodes) {
          //   for (var i = 0; i < data.nodes.length; i++) {
          //     avatars.push(data.nodes[i].avatar);
          //   }
          // }
          //
          // $("svg").remove()
          // var width = x,
          //   height = y;
          //
          // var svg = d3.select("body").append("svg")
          //   .attr("id", "svg")
          //   .attr("width", x)
          //   .attr("height", y),
          //   width = x,
          //   height = y,
          //   g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
          //
          // var simulation = d3.forceSimulation(data.nodes)
          //   .force("charge", d3.forceManyBody().strength(-200))
          //   .force('collision', d3.forceCollide().radius(40))
          //   .force("link", d3.forceLink(data.links).distance(function(d) {
          //       return 80 - (10 * 3);
          //     })
          //     .strength(0.5).iterations(5))
          //   .force("center", d3.forceCenter())
          //   .force("x", d3.forceX())
          //   .force("y", d3.forceY())
          //   .stop();
          //
          // var loading = svg.append("text")
          //   .attr("dy", "0.45em")
          //   .attr("text-anchor", "middle")
          //   .attr("font-family", "sans-serif")
          //   .attr("font-size", 10)
          //   .text("Simulating. One moment please…");
          //
          // d3.timeout(function() {
          //   loading.remove();
          //   d3.select("middle").append("svg");
          //
          //   for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
          //     simulation.tick();
          //   }
          //
          //   var link = g.append("g")
          //     .attr("stroke", "#000")
          //     .attr("stroke-width", 1)
          //     .selectAll("line")
          //     .data(links)
          //     .enter().append("line")
          //     .attr("x1", function(d) {
          //       return d.target.x;
          //     })
          //     .attr("y1", function(d) {
          //       return d.target.y;
          //     })
          //     .attr("x2", function(d) {
          //       return d.source.x;
          //     })
          //     .attr("y2", function(d) {
          //       return d.source.y;
          //     })
          //     .classed('pathdash', false)
          //
          //   var node = g.selectAll('g.gnode')
          //     .data(nodes)
          //     .enter()
          //     .append('g')
          //     .classed('gnode', true)
          //
          //   var defs = node.append("defs").attr("id", "imgdefs")
          //   var image = node.append("pattern")
          //     .data(data.nodes)
          //     .attr("id", "image")
          //     .attr("height",'1.5em')
          //     .attr("width", '1.5em')
          //
          //   image.append("image")
          //     .attr("height", "1.5em")
          //     .attr("width", "1.5em")
          //     .attr("xlink:href", function(d) {
          //       return d.avatar;
          //     })
          //
          //
          //   var visitedimage = node.append("pattern")
          //     .data(data.nodes)
          //     .attr("id", "visimage")
          //     .attr("height", "1.5em")
          //     .attr("width", "1.5em")
          //   visitedimage.append("image")
          //     .attr("xlink:href", "http://db743fb57071f8e05cb3-4d10287819954fd6d08ae459de19af00.r20.cf1.rackcdn.com/global/imagelib/uncategorized/iip_600x600_checkdark-63f464723ca1a113c1a0a22acf62cd3ad4c59149.png")
          //     .style("visibility", "visible")
          //     .attr("align", "center")
          //     .attr("height", "1.5em")
          //     .attr("width", "1.4em")
          //
          //
          //   var circ = node.append("circle")
          //     .attr("class", "circc")
          //     .attr("id", function(d) {
          //       return "id" + d.index;
          //     })
          //     .attr("r", "1.5em")
          //     .attr("cx", function(d) {
          //       return d.x;
          //     })
          //     .attr("cy", function(d) {
          //       return d.y;
          //     })
          //     .attr("fill", function(d) {
          //       return "url(#image)";
          //     })
          //     .style("opacity", 1)
          //     .style("box-shadow", 15)
          //     .on("mouseenter", function(user) {
          //       var selected = user.index;
          //       svg.selectAll("line").classed("hoverdash", function(d) {
          //         if (d.target.index == selected || d.source.index == selected) {
          //           return true;
          //         } else {
          //           return false;
          //         }
          //       })
          //       svg.selectAll("line").style("stroke-width", function(d) {
          //         if (d.target.index == selected || d.source.index == selected) {
          //           return 1;
          //         } else {
          //           return 0.2;
          //         }
          //       });
          //       $("#artbox").css("visibility", "visible");
          //       coordinates = d3.mouse(svg.node());
          //       var x = coordinates[0];
          //       var y = coordinates[1];
          //
          //       $('#artbox').css('position', 'absolute');
          //       $('#artbox').css('top', x); //or wherever you want it
          //       $('#artbox').css('left', y); //or wherever you want it
          //       $('#artname').html(user.title);
          //       var a = document.getElementById("artbox");
          //       a.style.position = "absolute";
          //       a.style.left = x + 300 + 'px';
          //       a.style.top = y + 100 + 'px';
          //       document.getElementById("artname").innerHTML = user.title;
          //     }).on("mouseleave", function(user) {
          //       document.getElementById("artbox").visibility = "hidden";
          //     }).on("mousedown", function(user) {
          //       svg.selectAll("line").classed("hoverdash", false);
          //     }).on("click", function(user) {
          //       var circid = $(this)[0].id;
          //       svg.select('#' + circid).attr("fill", "url(#visimage)");
          //       resolveArtist(user.permalink);
          //       var selected = user.index;
          //       svg.selectAll("line").style("stroke-width", function(d) {
          //         if (d.target.index == selected || d.source.index == selected) {
          //           return "5";
          //         } else {
          //           return "0.2";
          //         }
          //       })
          //       svg.selectAll("line").classed("pathdash", function(d) {
          //         if (d.target.index == selected || d.source.index == selected) {
          //           return true;
          //         } else {
          //           return false;
          //         }
          //       });
          //       //console.log(user);
          //
          //       visited.push(user);
          //       loadvisited(visited);
          //
          //       $("#visited").css("visibility", "visible");
          //       getArtistTrack(user);
          //       $('#artist-go').css("visibility", "visible");
          //       $('#artist-go').click(function() {
          //         $("#searchbar").val(user.permalink);
          //         search();
          //       });
          //       $('#artname').click(function() {
          //         $("#searchbar").val(user.permalink);
          //         $("#artbox").css("visibility", "hidden");
          //         search();
          //         $("#svg").click(function() {
          //           $('#artbox').css("visibility", "hidden");
          //         });
          //       })
          //
          //     });
          //   });
