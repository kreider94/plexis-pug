function setRanking(arr, callback) {
    for (var i = 0; i < arr.length; i++) {
        arr[i].ranking = 0;
    }
    callback(arr);
}

function sortOn(property) {
    return function(a, b) {
        if (a[property] < b[property]) {
            return -1;
        } else if (a[property] > b[property]) {
            return 1;
        } else {
            return 0;
        }
    };
}

function increaseRanking(arr, callback) {
    for (i = 0; i < arr.length; i++) {
        if (arr[i].followers_count > 10000) {
            arr[i].ranking++;
        }
    }
    callback(arr);
}

//remove users with low following count
function removeLowFollowers(array, callback) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].followers_count < array[i].followings_count || array[i].followers_count === 0) {
            array.splice(i, 1);
        }
    }
    callback(array);
}

function removeLowFollowing(array, callback) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].followings_count < 10) {
            array.splice(i, 1);
        }
    }
    callback(array);
}

//decrease if ranking is 0
function removeLowReposts(array, callback) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].reposts_count === 0) {
            array.splice(i, 1);
        }
    }
    callback(array);
}

function removeLowTrackCount(array, callback) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].track_count === 0) {
            array.splice(i, 1);
        }
    }
    callback(array);
}
