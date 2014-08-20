var defaults = require('../defaults');
var split = require('../utils').split;

function parseMessage(argv, data)
{
  if (argv['m']) {
    var message = split(argv.m, "\n", 2);

    if (message.length >= 1) {
      data.title = message[0].trim();
    }
    if (message.length === 2) {
      data.description = message[1].trim();
    }
  }

  return data;
}

function parseLabels(argv, data)
{
  var labels = [];

  if (argv['l'] && argv.l.trim() !== '') {
    labels = argv.l.trim().split(',');
  }
  else if (argv['labels'] && argv.labels.trim() !== '') {
    labels = argv.labels.trim().split(',');
  }

  if (labels.length > 0) {
    data.labels = [];

    labels.forEach(function(label, i) {
      data.labels.push(label.trim());
    });
  }

  return data;
}

function parseData(argv, data)
{
  if (argv['data']) {
    var _data = argv['data'].trim();
    _data = _data.split(',');

    _data.forEach(function(__data, i) {
      _data[i] = split( __data, '=', 2);

      if (_data[i].length < 2) {
        _data[i].push(null);
      }

      data[_data[i][0]] = _data[i][1];
    });
  }

  return data;
}

function parseDataJson(argv, data)
{
  if (argv['data-json']) {
    var _data = argv['data-json'].trim();

    try {
      JSON.parse(_data);

      for(var key in _data) {
        data[key] = _data[key];
      }
    }
    catch (error) {

    }
  }

  return data;
}

function parseUser(argv, data)
{
  if (typeof(argv['u']) === 'string' && argv.u.trim() !== '') {
    data.username = argv.u.trim();
  }
  else if(typeof(argv['user']) === 'string' && argv.user.trim() !== '') {
    data.username = argv.user.trim();
  }

  if (data.username === null || data.username === 'me') {
    data.username = config.username;
  }

  return data;
}

function parse(argv)
{
  var data = defaults.data();

  parseMessage(argv, data);
  parseLabels(argv, data);
  parseUser(argv, data);
  parseData(argv, data);
  parseDataJson(argv, data);

  return data;
}
module.exports = parse;