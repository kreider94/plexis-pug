define(function () {
  return {
    currUserInfo: function(avatar,username){
      var pic = document.getElementById('curruser');
      var largeavatar = avatar.replace("large", "t500x500");
      pic.style.backgroundImage = "url('" + largeavatar + "')";
      document.getElementById('currname').innerHTML = username;
    },

    getTracks: function(newUser, callback){
        var data=[];
        SC.get("/users/" + newUser.id + "/favorites").then(function (tracks) {
            for (var i = 0; i < tracks.length; i++) {
                data.push(tracks[i]);
            }
            callback(data);
        });
    },

    getFollowings: function(newUser, callback){
        var data =[];
        SC.get("/users/" + newUser.id + "/followings",{limit: 200, linked_partitioning: 1}).then(function (users) {
            for (var u = 0; u < users.collection.length; u++) {
                data.push(users.collection[u]);
            }
            callback(data);
        });
    },

    unique: function(array, callback) {
      let data = [];

      const count = array =>
        array.reduce((a, b) => ({ ...a,
          [b]: (a[b] || 0) + 1
        }), {})

      var artistsRanking = count(array.map((item) => item.id ));

      for (var i = 0; i < array.length; i++) {
        var item = array[i],
            index = Object.keys(artistsRanking).indexOf(item.id.toString());
        if (index > -1 && data.indexOf(item) === -1) {
          item.ranking = artistsRanking[item.id];
          data.push(item);
        }
      }

      callback(data);
    },


    getPagePlaylist: function(){
      var pagePlaylist = [];
      for (var i = 0; i < usersList.length; i++) {
        SC.get("/users/" + usersList[i].id + "/tracks").then(function (tracks) {
           tracks.sort(sortOn("favoritings_count"));
           tracks.sort(sortOn("comment_count"));
           tracks.sort(sortOn("reposts_count"));
           pagePlaylist.push(tracks[tracks.length-1]);
          });
        }

      //  populatePlaylist(pagePlaylist);
    },

    getArtistTrack: function(user){
      var topTrack = 0;
      var id = user.userid
      SC.get("/users/" + id + "/tracks").then(function (tracks) {
         tracks.sort(sortOn("favoritings_count"));
         tracks.sort(sortOn("comment_count"));
         tracks.sort(sortOn("reposts_count"));
         tracks.reverse();
         for (var i = 0; i < tracks.length; i++) {
           if(tracks[i].duration < 720000){
             topTrack = tracks[i];
             break;
           }
         }
         if(topTrack != 0){
           document.getElementById('deezer-widget').src = "";
           document.getElementById('sc-widget').src = "https://w.soundcloud.com/player/?url=http://api.soundcloud.com/tracks/" + topTrack.id;
           document.getElementById('sc-widget').style.visibility = "visible";
        }else{
            deezerTrack(user.title);
        }
      })
    },

    deezerTrack: function(query) {
        $.ajax({
            url: ' http://api.deezer.com/search/autocomplete?q=' + query,
            success: function (response) {
              console.log(response);
              var track = "http://www.deezer.com/plugins/player?format=classic&autoplay=true&playlist=true&width=700&height=115&color=007FEB&layout=dark&size=small&type=radio&id=artist-" + response.artists.data[0].id + "&appid=1";
              document.getElementById('sc-widget').style.visibility = "hidden";
              document.getElementById('deezer-widget').src = track;
            }
        });
    },

    followUser: function(user,curr){
      SC.connect().then(function() {
        following = true;
        return SC.put('/me/followings/' + curr.id);
      }).then(function(user){
          alert('You are now following ' + user.username);
        }).catch(function(error){
          alert('Error: ' + error.message);
        });
      $("followbtn").attr("src","/images/following.png");
    }
  }
})
