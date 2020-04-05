define(['./queryexecuter.js', './soundcloud.js'], function (graph, soundcloud) {
  return {
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
          Plexis.mainUser = me;
          SC.get("/users/" + me.id + "/favorites", {
            limit: 200,
            linked_partitioning: 1
          }).then((tracks) => {
            Plexis.mainUser.likedTracks = tracks.collection;
            Plexis.mainUser.likedArtists = tracks.collection.map((track) => track.user);
            SC.get("/users/" + me.id + "/followings", {
              limit: 200,
              linked_partitioning: 1
            }).then((users) => {
              Plexis.mainUser.following = users.collection;
              this.ShowData(me);
            });
          });
        });
      }
    },

    ShowData: function(user) {
      Plexis.graph = graph;
      graph.deleteNodes();
      soundcloud.currUserInfo(user.avatar_url, user.username);
      var concatData = Plexis.mainUser.likedArtists.concat(Plexis.mainUser.following);
      soundcloud.unique(concatData, (data) => {
        var users = data.filter((item) => {
          return (item.followings_count > 10) && (item.reposts_count > 0) && (item.track_count > 0) && (item.followers_count > item.followings_count) && (item.followers_count !== 0)
        });
        Plexis.scUsers = users.sort(function(a,b) { return (b.ranking) - (a.ranking) } ).splice(0, 40);
        graph.createUserNodes(Plexis.scUsers, () =>
          // graph.createRelationships(Plexis.scUsers.splice(0, 40)).then(() =>
            graph.returnGraph()
          // )
        )
          // this.getExtraData());
      });
    },
    //
    // getExtraData: function () {
    //   for (var i = 0; i < Plexis.scUsers.length; i++) {
    //     const user = Plexis.scUsers[i];
    //     SC.get("/users/" + user.id + "/favorites").then((tracks) => {
    //       $.extend(user, {
    //         likedTracks: tracks,
    //         likedArtists: tracks.map((track) => track.user)
    //       })
    //       SC.get("/users/" + user.id + "/followings", {limit: 200, linked_partitioning: 1}, {
    //         limit: 200,
    //         linked_partitioning: 1
    //       }).then((users) => {
    //         $.extend(user, { following: users.collection });
    //         var concatData = user.likedArtists.concat(user.following);
    //         soundcloud.unique(concatData, (data) => {
    //           var users = data.filter((item) => {
    //             return (item.followings_count > 10) && (item.reposts_count > 0) && (item.track_count > 0) && (item.followers_count > item.followings_count) && (item.followers_count !== 0)
    //           });
    //           user.users = users.splice(0, 40);
    //           var waitForUsers = setInterval(() => {
    //             if (user.users) {
    //               clearInterval(waitForUsers);
    //               graph.createRelationships(user.users);
    //             }
    //           }, 200);
    //         })
    //       });
    //     });
    //   };
    // }
  }
})

//
//   function createUserNodes(arr, done) {
//     var users = [];
//     arr.forEach(function(item, index) {
//       driver.session().writeTransaction(tx =>
//         tx.run(
//           "CREATE (u:User {id: " + item.id + ", username: '" + item.username + "', permalink: '" + item.permalink + "', avatar: '" + item.avatar_url + "', ranking: " + item.ranking + "})"
//         )
//       ).then(result => {
//         driver.session().close();
//         users.push(result)
//         if (result) {
//           console.log('Person created')
//         }
//         if (index = arr.length - 1)
//           done(users);
//       });
//     });
//   };
// })
//   function deleteNodes() {
//     driver.session().writeTransaction(tx =>
//       tx.run("MATCH (n) OPTIONAL MATCH (n)-[r]-() DELETE n,r")
//     ).then(result => {
//       driver.session().close();
//     })
//   };

  // common: function(user, arr, callback) {
  //   var origLen = arr.length,
  //     found, x, y;
  //
  //   var data = [];
  //   for (x = 0; x < usersList.length; x++) {
  //     found = undefined;
  //     for (y = 0; y < arr.length; y++) {
  //       if (usersList[x].id === arr[y].id) {
  //         found = true;
  //         data.push(arr[y]);
  //       }
  //     }
  //   }
  //   callback(data);
  // },
  //
  // function createRelationships(arr, user) {
  //   arr.forEach(function(item, index) {
  //     if (user.id != item.id) {
  //       this.driver.session().writeTransaction(tx =>
  //         tx.run(
  //           "MATCH (a:User {id: " + user.id + " } ),(b:User {id: " + item.id + " }) CREATE (a)-[r:LIKES{weight:2}]->(b) RETURN a,r,b"
  //         )
  //       ).then(result => {
  //         this.driver.session().close();
  //         if (result) console.log('relationship created');
  //       });
  //     }
  //     if (index != arr.length - 1) {
  //       setTimeout(checkNeo(index), 100);
  //     }
  //   });
  //   return this.driver.session().writeTransaction(tx =>
  //     tx.run("match (n) SET n.size = SIZE(()-[:LIKES]->(n)) return n.size")
  //   ).then(result => {
  //     this.driver.session().close();
  //   });
  // };

  // checkNeo: function(arr) {
  //   function checkGraph() {
  //     this.driver.session().writeTransaction(tx =>
  //       tx.run(
  //         "MATCH (a)-[r:LIKES]->(b) WITH count(b) as rels RETURN rels"
  //       )
  //     ).then(result => {
  //       this.driver.session().close();
  //       num = result[0];
  //       if (num != arr.length) {
  //         checkGraph();
  //       } else {
  //         graph.returnGraph();
  //       }
  //     });
  //   }
  // },
  //
  // returnGraph: function() {
  //   driver.session().writeTransaction(tx =>
  //     tx.run(
  //       "MATCH path = (n)-[r]->(m) RETURN *"
  //     )
  //   ).then(result => {
  //     //get links and nodes from results
  //     function idIndex(a, id) {
  //       for (var i = 0; i < a.length; i++) {
  //         if (a[i].id == id) return i;
  //       }
  //       return null;
  //     }
  //
  //     var nodes = [],
  //       links = [];
  //     result.results[0].data.forEach(function(row) {
  //       row.graph.nodes.forEach(function(n) {
  //         if (idIndex(nodes, n.id) == null)
  //           nodes.push({
  //             id: n.id,
  //             userid: n.properties.id,
  //             label: n.labels[0],
  //             title: n.properties.username,
  //             avatar: n.properties.avatar,
  //             ranking: n.properties.ranking,
  //             permalink: n.properties.permalink,
  //             size: n.properties.size
  //           });
  //       });
  //       links = links.concat(row.graph.relationships.map(function(r) {
  //         return {
  //           source: idIndex(nodes, r.startNode),
  //           target: idIndex(nodes, r.endNode),
  //           type: r.type,
  //           weight: 2,
  //           size: nodes.filter(item => { item.id === r.endNode }).pop().size
  //         };
  //       }));
  //     });
  //     viz = {
  //       nodes: nodes,
  //       links: links
  //     };
  //     nodelength = viz.nodes.length;
  //     linklength = viz.links.length;
  //     graph.makeNetwork(viz);
  //   });
  // },
  //
  // makeNetwork: function(network) {
  //   var w = window,
  //     d = w.document,
  //     de = d.documentElement,
  //     db = d.body || d.getElementsByTagName('body')[0],
  //     // x = w.innerWidth || de.clientWidth || db.clientWidth,
  //     // y = w.innerHeight || de.clientHeight || db.clientHeight;
  //     x = screen.width,
  //     y = screen.height * 0.83;
  //
  //   var avatars = [];
  //
  //   function getAvatars(nodes) {
  //     for (var i = 0; i < graph.nodes.length; i++) {
  //       avatars.push(graph.nodes[i].avatar);
  //     }
  //   }
  //
  //   $("svg").remove()
  //   var width = x,
  //     height = y;
  //
  //   var svg = d3.select("body").append("svg")
  //     .attr("id", "svg")
  //     .attr("width", x)
  //     .attr("height", y),
  //     width = x,
  //     height = y,
  //     g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
  //
  //   var nodes = network.nodes;
  //   links = network.links;
  //   //
  //   var simulation = d3.forceSimulation(graph.nodes)
  //     .force("charge", d3.forceManyBody().strength(-200))
  //     .force('collision', d3.forceCollide().radius(40))
  //     .force("link", d3.forceLink(links).distance(function(d) {
  //
  //         return 80 - (10 * d.size);
  //       })
  //       .strength(0.5).iterations(5))
  //     .force("center", d3.forceCenter())
  //     .force("x", d3.forceX())
  //     .force("y", d3.forceY())
  //     .stop();
  //
  //   var loading = svg.append("text")
  //     .attr("dy", "0.45em")
  //     .attr("text-anchor", "middle")
  //     .attr("font-family", "sans-serif")
  //     .attr("font-size", 10)
  //     .text("Simulating. One moment please…");
  //
  //   d3.timeout(function() {
  //     loading.remove();
  //     d3.select("middle").append("svg");
  //
  //     for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
  //       simulation.tick();
  //     }
  //
  //     var link = g.append("g")
  //       .attr("stroke", "#000")
  //       .attr("stroke-width", 1)
  //       .selectAll("line")
  //       .data(links)
  //       .enter().append("line")
  //       .attr("x1", function(d) {
  //         return d.target.x;
  //       })
  //       .attr("y1", function(d) {
  //         return d.target.y;
  //       })
  //       .attr("x2", function(d) {
  //         return d.source.x;
  //       })
  //       .attr("y2", function(d) {
  //         return d.source.y;
  //       })
  //       .classed('pathdash', false)
  //
  //     var node = g.selectAll('g.gnode')
  //       .data(nodes)
  //       .enter()
  //       .append('g')
  //       .classed('gnode', true)
  //
  //     var defs = node.append("defs").attr("id", "imgdefs")
  //     var image = node.append("pattern")
  //       .data(graph.nodes)
  //       .attr("id", "image")
  //       .attr("height", function(d) {
  //         if (d.ranking > 8) {
  //           return 2 + "em"
  //         }
  //         if (d.ranking < 4) {
  //           return d.ranking * 1.2 + "em";
  //         } else {
  //           return d.ranking * 0.9 + "em";
  //         }
  //       })
  //       .attr("width", function(d) {
  //         if (d.ranking > 8) {
  //           return 2 + "em"
  //         }
  //         if (d.ranking < 4) {
  //           return d.ranking * 1.2 + "em";
  //         } else {
  //           return d.ranking * 0.9 + "em";
  //         }
  //       })
  //
  //     image.append("image")
  //       .attr("height", function(d) {
  //         if (d.ranking > 8) {
  //           return 6 + "em"
  //         }
  //         if (d.ranking < 4) {
  //           return d.ranking * 1.2 + "em";
  //         } else {
  //           return d.ranking * 0.9 + "em";
  //         }
  //       })
  //       .attr("width", function(d) {
  //         if (d.ranking > 8) {
  //           return 6 + "em"
  //         }
  //         if (d.ranking < 4) {
  //           return d.ranking * 1.2 + "em";
  //         } else {
  //           return d.ranking * 0.9 + "em";
  //         }
  //       })
  //       .attr("xlink:href", function(d) {
  //         return d.avatar;
  //       })
  //
  //
  //     var visitedimage = node.append("pattern")
  //       .data(graph.nodes)
  //       .attr("id", "visimage")
  //       .attr("height", function(d) {
  //         if (d.ranking > 8) {
  //           return 6 + "em"
  //         }
  //         if (d.ranking < 4) {
  //           return d.ranking * 1.2 + "em";
  //         } else {
  //           return d.ranking * 0.9 + "em";
  //         }
  //       })
  //       .attr("width", function(d) {
  //         if (d.ranking > 8) {
  //           return 6 + "em"
  //         }
  //         if (d.ranking < 4) {
  //           return d.ranking * 1.2 + "em";
  //         } else {
  //           return d.ranking * 0.9 + "em";
  //         }
  //       })
  //     visitedimage.append("image")
  //       .attr("xlink:href", "http://db743fb57071f8e05cb3-4d10287819954fd6d08ae459de19af00.r20.cf1.rackcdn.com/global/imagelib/uncategorized/iip_600x600_checkdark-63f464723ca1a113c1a0a22acf62cd3ad4c59149.png")
  //       .style("visibility", "visible")
  //       .attr("align", "center")
  //       .attr("height", function(d) {
  //         if (d.ranking > 8) {
  //           return 6 + "em"
  //         }
  //         if (d.ranking < 4) {
  //           return d.ranking * 1.2 + "em";
  //         } else {
  //           return d.ranking * 0.9 + "em";
  //         }
  //       })
  //       .attr("width", function(d) {
  //         if (d.ranking > 8) {
  //           return 6 + "em"
  //         }
  //         if (d.ranking < 4) {
  //           return d.ranking * 1.2 + "em";
  //         } else {
  //           return d.ranking * 0.9 + "em";
  //         }
  //       })
  //
  //
  //     var circ = node.append("circle")
  //       .attr("class", "circc")
  //       .attr("id", function(d) {
  //         return "id" + d.index;
  //       })
  //       .attr("r", function(d) {
  //         if (d.ranking > 8) {
  //           return 3 + "em"
  //         }
  //         if (d.ranking < 4) {
  //           return d.ranking * 0.6 + "em";
  //         } else {
  //           return d.ranking * 0.45 + "em";
  //         }
  //       })
  //       .attr("cx", function(d) {
  //         return d.x;
  //       })
  //       .attr("cy", function(d) {
  //         return d.y;
  //       })
  //       .attr("fill", function(d) {
  //         return "url(#image)";
  //       })
  //       .style("opacity", 1)
  //       .style("box-shadow", 15)
  //       .on("mouseenter", function(user) {
  //         var selected = user.index;
  //         svg.selectAll("line").classed("hoverdash", function(d) {
  //           if (d.target.index == selected || d.source.index == selected) {
  //             return true;
  //           } else {
  //             return false;
  //           }
  //         })
  //         svg.selectAll("line").style("stroke-width", function(d) {
  //           if (d.target.index == selected || d.source.index == selected) {
  //             return 1;
  //           } else {
  //             return 0.2;
  //           }
  //         });
  //         $("#artbox").css("visibility", "visible");
  //         coordinates = d3.mouse(svg.node());
  //         var x = coordinates[0];
  //         var y = coordinates[1];
  //
  //         $('#artbox').css('position', 'absolute');
  //         $('#artbox').css('top', x); //or wherever you want it
  //         $('#artbox').css('left', y); //or wherever you want it
  //         $('#artname').html(user.title);
  //         var a = document.getElementById("artbox");
  //         a.style.position = "absolute";
  //         a.style.left = x + 300 + 'px';
  //         a.style.top = y + 100 + 'px';
  //         document.getElementById("artname").innerHTML = user.title;
  //       }).on("mouseleave", function(user) {
  //         document.getElementById("artbox").visibility = "hidden";
  //       }).on("mousedown", function(user) {
  //         svg.selectAll("line").classed("hoverdash", false);
  //       }).on("click", function(user) {
  //         var circid = $(this)[0].id;
  //         svg.select('#' + circid).attr("fill", "url(#visimage)");
  //         resolveArtist(user.permalink);
  //         var selected = user.index;
  //         svg.selectAll("line").style("stroke-width", function(d) {
  //           if (d.target.index == selected || d.source.index == selected) {
  //             return "5";
  //           } else {
  //             return "0.2";
  //           }
  //         })
  //         svg.selectAll("line").classed("pathdash", function(d) {
  //           if (d.target.index == selected || d.source.index == selected) {
  //             return true;
  //           } else {
  //             return false;
  //           }
  //         });
  //         //console.log(user);
  //
  //         visited.push(user);
  //         loadvisited(visited);
  //
  //         $("#visited").css("visibility", "visible");
  //         getArtistTrack(user);
  //         $('#artist-go').css("visibility", "visible");
  //         $('#artist-go').click(function() {
  //           $("#searchbar").val(user.permalink);
  //           search();
  //         });
  //         $('#artname').click(function() {
  //           $("#searchbar").val(user.permalink);
  //           $("#artbox").css("visibility", "hidden");
  //           search();
  //           $("#svg").click(function() {
  //             $('#artbox').css("visibility", "hidden");
  //           });
  //         })
  //
  //       });
  //     });
  //   }
  // }
