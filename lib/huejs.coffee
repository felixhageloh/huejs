request  = require 'request'
ssdp     = require 'node-ssdp'

url           = null
user          = null
currentLights = []

exports.init = (username, onAuthorize, callback) ->
  user = username
  console.log 'looking for Hue bridge ...'

  onSuccess = (lights) ->
    console.log "found #{lights.length} lights"

    currentLights = for light, i in lights
      light.setState = setState(i)
      light

    callback currentLights

  findBridgeIp (ip) ->
    url = "http://#{ip}/api/#{user}/"
    console.log 'found Hue bridge at '+ip
    console.log 'getting lights info ...'
    getLights ip, onSuccess, (err) ->
      throw err unless err == "unauthorized user"
      setUpUser ip, onAuthorize, -> getLights ip, onSuccess

exports.setState = (index, state, callback) ->
  setState(index)(state, callback)

exports.lights = ->
  currentLights

# private

setState = (index) -> (state, callback) ->
  unless currentLights[index]?
    console.log 'no light with index '+index
  else
    request.put
      url: url+'lights/'+(index+1)+'/state/'
      body: JSON.stringify(state)
      json: true
    , callback


findBridgeIp = (callback) ->
  client = new ssdp()
  ips    = []

  client.on "response", (msg, rinfo) ->
    ip = rinfo.address
    return if ips.indexOf(ip) > -1

    ips.push ip
    console.log 'checking', ip

    request.get "http://#{ip}/debug/clip.html", (_, response) ->
      if response? and response.statusCode == 200
        client.removeAllListeners()
        callback(ip)
      else
        console.log 'no bridge found on', ip

  client.search('urn:schemas-upnp-org:device:InternetGatewayDevice:1')

getLights = (ip, success, error) ->
  request.get "http://#{ip}/api/#{user}/lights", json: true, (_, __, lightsInfo) ->
    if (err = checkForError lightsInfo)
      error err
    else
      lights = (light for idx, light of lightsInfo)
      success lights

checkForError = (bridgeResponse) ->
  if bridgeResponse[0]?.error?
    bridgeResponse[0].error.description
  else
    null

authorizationTries = 0
setUpUser = (ip, authorizePrompt, callback) ->
  console.log '\nauthorizing with bridge.'

  authorizePrompt ->
    authorizationTries++
    process.stdout.write 'please wait ...'
    newUser ip, (err, response, body) ->
      if response? and body[0]?['success']?['username']?
        console.log 'SUCCESS\n'
        callback()
      else
        console.log 'ERROR\n', body
        if authorizationTries < 3
          setUpUser ip, authorizePrompt, callback
        else
          console.log 'giving up.'
          process.exit 1

newUser = (ip, callback) ->
  request.post
    url: "http://#{ip}/api"
    body: JSON.stringify({"devicetype":"leap controller", "username":user})
    json: true
  , callback
