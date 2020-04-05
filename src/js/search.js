var searchUser;
var localUser;

function search() {
    // get the search form value

  var formData = document.getElementById("searchbar").value;
  formData = formData.replace(/\s/g, '');
    var id;

    var tracklength;
    var followlength;

    function getForm(data, callback) {
        SC.get('/resolve', {
            client_id: 'm3kCd053xVXYtaEYQZ2e87SWSSuYnunA',
            url: 'https://soundcloud.com/' + data
        }).then(function(user) {
            searchUser = user;
            callback(user);
        });
    }

    function getNewUserInfo(user, callback) {
        likes = [];
        followingList = [];
        SC.get("/users/" + user.id + "/favorites").then(function(tracks) {
          tracklength = tracks.length;
            for (var i = 0; i < tracks.length; i++) {
                likes.push(tracks[i]);
            }
        });

        SC.get("/users/" + user.id + "/followings", {
            limit: 200,
            linked_partitioning: 1
        }).then(function(users) {
          followlength = users.collection.length;
            for (var u = 0; u < users.collection.length; u++) {
                followingList.push(users.collection[u]);
            }
        });
        callback(user);
    }


    function checkArrs(){
      if(tracklength != likes.length || followlength != followingList.length){
        setTimeout(checkArrs,100);
      }else{
        ShowData(searchUser);
      }
    }

    getForm(formData, function(user) {
        getNewUserInfo(user, function(final) {
          checkArrs();
        });
    });
}
