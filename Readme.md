# huejs

> a nodejs module to control Philips Hue lamps

### VERY EARLY ALPHA STATE!

## Usage

```js
var huejs = require('huejs');

// only needed if a user name has not been configured yet
function prompt(ready) {
  // ask user to press link button, plus some feedback when they are ready
  ...
  ready()
}

huejs.init('myusername', prompt, function (lights) {
  lights[0].setState({ on: true });
});

```

`setState` takes the same arguments as described in section 1.6.2 of the [Hue API](http://developers.meethue.com/1_lightsapi.html)
