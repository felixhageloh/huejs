# TODO: mock hue bridge discovery and responses
describe 'huejs', ->
  huejs = require '../lib/huejs.coffee'

  it 'should connect to the hue bridge and return an array of lights', (done) ->
    prompt = (ready) ->
      console.log 'press link button'
      setTimeout ready, 5000

    hue = huejs.init 'huejstestuser', prompt, (lights) ->
      console.log lights
      done()
  , 20000

