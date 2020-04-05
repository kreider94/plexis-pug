var nodelength;
var linklength;

function runAjax(query, callback) {
    $.ajax({
        type: 'POST',
        url: 'http://localhost:7474/db/data/transaction/commit',
        dataType: "jsonp",
        crossDomain: true,
        contentType: "application/json;charset=UTF-8",
        headers: {
            "Authorization": "Basic bmVvNGo6cGFzc3dvcmQxMjM=",
            'Accept': 'application/json',
            'Content-Type': 'JSON',
            'X-Custom-Header': 'value',
            "Access-Control-Allow-Origin": "*",
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'POST, GET',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        data: query,
        success: function(data) {
          console.log(data);
            callback(data);
        }
    });
}

function deleteNodes() {

    var delnodes = {
        statements: [{
            statement: "MATCH (n) OPTIONAL MATCH (n)-[r]-() DELETE n,r"
        }]
    }

    var datadel = JSON.stringify(delnodes);

    function callbackTester(callback) {
        callback();
    };

    callbackTester (function(){
      runAjax(datadel,function(output){
        return output;
      })
    });
}

function requery(query) {

    var que = {
        statements: [{
            statement: query
        }]
    }

    var datastr = JSON.stringify(que);

    function callbackTester(callback) {
        callback();
    };

    callbackTester (function(){
      runAjax(datastr,function(output){
        return output;
      })
    });
}


function common(user, arr, callback) {
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
}

function comparray(user, arr, callback) {
    var results = [];

    common(user, arr, function(results) {
        callback(results);
    })
}

function runCypherQuery(arr, callback) {
    var data = arr;
    var query = [];

    for (var i = 0; i < arr.length; i++) {
        query[i] = "CREATE (u:User {id: " + arr[i].id + ", username: '" + arr[i].username + "', permalink: '" + arr[i].permalink + "', avatar: '" + arr[i].avatar_url + "', ranking: " + arr[i].ranking + "})"
        requery(query[i]);
    }
    callback(data);
}

function createRelationships(arr, user) {
    // match user with every element in array where element exists in database
    var query = [];
    count = 0;
    for (var i = 0; i < arr.length; i++) {
        if (user.id != arr[i].id) {
            query[i] = "MATCH (a:User {id: " + user.id + " } ),(b:User {id: " + arr[i].id + " }) CREATE (a)-[r:LIKES{weight:2}]->(b) RETURN a,r,b";
            requery(query[i]);
            count++
        }
    }
    requery("match (n) SET n.size = SIZE(()-[:LIKES]->(n)) return n.size");
    if(count != arr.length){
      setTimeout(checkNeo(count), 100);
    }
}

function checkNeo(arr){

  var getrelcount = {
      statements: [{
          statement: "MATCH (a)-[r:LIKES]->(b) WITH count(b) as rels RETURN rels"
      }]
  }

  var check = JSON.stringify(getrelcount);
  var num;

  function callbackTester(callback) {
      callback();
  };

  callbackTester (function(){
    runAjax(check,function(output){
      return num = output.results[0];
    })
  });

  if(num != arr.length){
    setTimeout(callbackTester,100);
  }else{
    returnGraph();
  }
}

function returnGraph() {

    var resgraph = {
        statements: [{
            statement: "MATCH path = (n)-[r]->(m) RETURN *",
            "resultDataContents": ["graph"]
        }]
    }

    var resg = JSON.stringify(resgraph);

    function callbackTester(callback) {
        callback();
    };

    callbackTester (function(){
      runAjax(resg,function(output){
        return reslt = output;
      })
    });

     //get links and nodes from results
    function idIndex(a, id) {
        for (var i = 0; i < a.length; i++) {
            if (a[i].id == id) return i;
        }
        return null;
    }

    function getNode(a,p){
      for (var i = 0; i < a.length; i++) {
        if (a[i].id == p){
          return a[i].size;
        }
      }
    }

    var nodes = [],
        links = [];
    reslt.results[0].data.forEach(function(row) {
        row.graph.nodes.forEach(function(n) {
            if (idIndex(nodes, n.id) == null)
                nodes.push({
                    id: n.id,
                    userid: n.properties.id,
                    label: n.labels[0],
                    title: n.properties.username,
                    avatar: n.properties.avatar,
                    ranking: n.properties.ranking,
                    permalink: n.properties.permalink,
                    size: n.properties.size
                });
        });
        links = links.concat(row.graph.relationships.map(function(r) {
            return {
                source: idIndex(nodes, r.startNode),
                target: idIndex(nodes, r.endNode),
                type: r.type,
                weight: 2,
                size: getNode(nodes, r.endNode)
            };
        }));
    });
    viz = {
        nodes: nodes,
        links: links
    };
    nodelength = viz.nodes.length;
    linklength = viz.links.length;
    makeNetwork(viz);
};
