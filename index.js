// Generated by CoffeeScript 1.6.3
var authorizationTries, checkForError, currentLights, findBridgeIp, getLights, newUser, request, setState, setUpUser, ssdp, url, user;

request = require('request');

ssdp = require('node-ssdp');

url = null;

user = null;

currentLights = [];

exports.init = function(username, onAuthorize, callback) {
  var onSuccess;
  user = username;
  console.log('looking for Hue bridge ...');
  onSuccess = function(lights) {
    var i, light;
    console.log("found " + lights.length + " lights");
    currentLights = (function() {
      var _i, _len, _results;
      _results = [];
      for (i = _i = 0, _len = lights.length; _i < _len; i = ++_i) {
        light = lights[i];
        light.setState = setState(i);
        _results.push(light);
      }
      return _results;
    })();
    return callback(currentLights);
  };
  return findBridgeIp(function(ip) {
    url = "http://" + ip + "/api/" + user + "/";
    console.log('found Hue bridge at ' + ip);
    console.log('getting lights info ...');
    return setUpUser(ip, onAuthorize, function() {
      return getLights(ip, onSuccess);
    });
  });
};

exports.setState = function(index, state, callback) {
  return setState(index)(state, callback);
};

exports.lights = function() {
  return currentLights;
};

setState = function(index) {
  return function(state, callback) {
    if (currentLights[index] == null) {
      return console.log('no light with index ' + index);
    } else {
      return request.put({
        url: url + 'lights/' + (index + 1) + '/state/',
        body: JSON.stringify(state),
        json: true
      }, callback);
    }
  };
};

findBridgeIp = function(callback) {
  var client, ips;
  client = new ssdp();
  ips = [];
  client.on("response", function(msg, rinfo) {
    var ip;
    ip = rinfo.address;
    if (ips.indexOf(ip) > -1) {
      return;
    }
    ips.push(ip);
    console.log('checking', ip);
    return request.get("http://" + ip + "/debug/clip.html", function(_, response) {
      if ((response != null) && response.statusCode === 200) {
        client.removeAllListeners();
        return callback(ip);
      } else {
        return console.log('no bridge found on', ip);
      }
    });
  });
  return client.search('urn:schemas-upnp-org:device:InternetGatewayDevice:1');
};

getLights = function(ip, success, error) {
  return request.get("http://" + ip + "/api/" + user + "/lights", {
    json: true
  }, function(_, __, lightsInfo) {
    var err, idx, light, lights;
    if ((err = checkForError(lightsInfo))) {
      return error(err);
    } else {
      lights = (function() {
        var _results;
        _results = [];
        for (idx in lightsInfo) {
          light = lightsInfo[idx];
          _results.push(light);
        }
        return _results;
      })();
      return success(lights);
    }
  });
};

checkForError = function(bridgeResponse) {
  var _ref;
  if (((_ref = bridgeResponse[0]) != null ? _ref.error : void 0) != null) {
    return bridgeResponse[0].error.description;
  } else {
    return null;
  }
};

authorizationTries = 0;

setUpUser = function(ip, authorizePrompt, callback) {
  console.log('\nauthorizing with bridge.');
  return authorizePrompt(function() {
    authorizationTries++;
    process.stdout.write('please wait ...');
    return newUser(ip, function(err, response, body) {
      var _ref, _ref1;
      if ((response != null) && (((_ref = body[0]) != null ? (_ref1 = _ref['success']) != null ? _ref1['username'] : void 0 : void 0) != null)) {
        console.log('SUCCESS\n');
        return callback();
      } else {
        console.log('ERROR\n', body);
        if (authorizationTries < 3) {
          return setUpUser(ip, authorizePrompt, callback);
        } else {
          console.log('giving up.');
          return process.exit(1);
        }
      }
    });
  });
};

newUser = function(ip, callback) {
  return request.post({
    url: "http://" + ip + "/api",
    body: JSON.stringify({
      "devicetype": "leap controller",
      "username": user
    }),
    json: true
  }, callback);
};
