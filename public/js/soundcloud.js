define(function() {
  return {
    signedInUser: function(avatar) {
      $('#header').append(
        $('<div></div>').attr('id', 'signedinuser')
        .append(
          $('<div></div>')
            .attr('class', 'disconnect')
            .on('click', () => {
              SC.initialize({ client_id: null })
              $('#landing-wrapper').show();
              $('#wrapper').css('background-image', 'url("/gfx/plexis-bg.jpg")');
              $('#searchsc').css('display', 'none');
            })
        ).append(
          $('<img></img>').attr('class', 'avatar')
            .attr({
              'src': avatar
            })
          )
      )
    },
    currUserInfo: function(avatar, username) {
      $('.username').text(username);
      $('.user_avatar').css('background-image', "url('" + avatar.replace("large", "t500x500") + "')");
    },

    getTracks: function(newUser, callback) {
      SC.get("/users/" + newUser.id + "/favorites").then(function(tracks) {
        callback(tracks);
      });
    },

    getFollowings: function(newUser, callback) {
      var data = [];
      SC.get("/users/" + newUser.id + "/followings", {
        limit: 200,
        linked_partitioning: 1
      }).then(function(users) {
        for (var u = 0; u < users.collection.length; u++) {
          data.push(users.collection[u]);
        }
        callback(data);
      });
    },

    unique: function(array, callback) {
      let data = [];

      const count = array =>
        array.reduce((a, b) => ({
          ...a,
          [b]: (a[b] || 0) + 1
        }), {})

      var artistsRanking = count(array.map((item) => item.id));

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


    getPagePlaylist: function() {
      var pagePlaylist = [];
      for (var i = 0; i < usersList.length; i++) {
        SC.get("/users/" + usersList[i].id + "/tracks").then(function(tracks) {
          tracks.sort(sortOn("favoritings_count"));
          tracks.sort(sortOn("comment_count"));
          tracks.sort(sortOn("reposts_count"));
          pagePlaylist.push(tracks[tracks.length - 1]);
        });
      }

      //  populatePlaylist(pagePlaylist);
    },

    setFollowButton: function (artistId, isFollowing) {
      if (isFollowing) {
        // show following icon, click to remove
        $('.follow').show()
         .attr('src', '/gfx/followers.png')
         .off().on('click', () => {
           SC.delete('/me/followings/' + artistId);
           this.setFollowButton(artistId, false);
         });
      } else {
        // show follower icon, click to follow
        $('.follow').show()
        .attr('src', '/gfx/follower.png')
        .off().on('click', () => {
          SC.put('/me/followings/' + artistId);
          this.updateFollowingList(artistId);
          this.setFollowButton(artistId, true);
        });
      }
    },

    updateFollowingList: function(artistId) {
      SC.get("/users/" + _plexis.mainUser.id + "/followings", {
        limit: 200,
        linked_partitioning: 1
      }).then((users) => {
          _plexis.mainUser.following = users.collection;
      });
    },

    getArtistTrack: function(user) {
      var topTrack = 0;
      SC.get("/users/" + user.id + "/tracks").then(function(tracks) {
        tracks.sort(function(a, b) {
          return (b.favoritings_count) - (a.favoritings_count)
        });
        tracks.sort(function(a, b) {
          return (b.comment_count) - (a.comment_count)
        });
        tracks.sort(function(a, b) {
          return (b.reposts_count) - (a.reposts_count)
        });
        for (var i = 0; i < tracks.length; i++) {
          if (tracks[i].duration < 720000) {
            topTrack = tracks[i];
            break;
          }
        }
        SC.oEmbed(topTrack.uri, {
          auto_play: true
        }).then(function(oEmbed) {
          $('#sc-widget').html(oEmbed.html);
          console.log('oEmbed response: ', oEmbed);
        });
      });
    },

    resolveSearchQuery: function(query) {
      $.ajax({
        url: 'https://api-v2.soundcloud.com/search/queries?q=' + query,
        client_id: 'm3kCd053xVXYtaEYQZ2e87SWSSuYnunA',
        method: 'GET',
        success: function(res) {
          console.log(res);
        }
      })
    },

    deezerTrack: function(query) {
      $.ajax({
        url: ' http://api.deezer.com/search/autocomplete?q=' + query,
        success: function(response) {
          console.log(response);
          var track = "http://www.deezer.com/plugins/player?format=classic&autoplay=true&playlist=true&width=700&height=115&color=007FEB&layout=dark&size=small&type=radio&id=artist-" + response.artists.data[0].id + "&appid=1";
          document.getElementById('sc-widget').style.visibility = "hidden";
          document.getElementById('deezer-widget').src = track;
        }
      });
    },

    followUser: function(user, curr) {
      SC.connect().then(function() {
        following = true;
        return SC.put('/me/followings/' + curr.id);
      }).then(function(user) {
        alert('You are now following ' + user.username);
      }).catch(function(error) {
        alert('Error: ' + error.message);
      });
      $("followbtn").attr("src", "/images/following.png");
    }
  }
})
