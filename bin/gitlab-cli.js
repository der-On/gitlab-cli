#!/usr/bin/env node

var optimist = require('optimist');
var gitlab = require('node-gitlab');
var actions = require('../lib/actions');

var argv = optimist.argv;
var fs = require('fs');

var usage = fs.readFileSync( __dirname + '/../lib/usage.txt', { encoding: 'utf8' });
optimist.usage(usage);

// help wanted or missing arguments, exit
if (argv['help'] || argv._.length < 2) {
  console.log(usage);
  process.exit(1);
}

// load environment
var env = argv.env || 'default';
var config = require('../config/' + env);

// create gitlab client
var client = gitlab.create({
  api: config.url + '/api/v3',
  privateToken: config.privateToken
});
client.username = config.username;

// get action and resource
var action = argv._[0];
var resource = argv._[1].split('/', 4);

// missing actino
if (action.trim() === '') {
  console.error('no action specified');
  process.exit(1);
}

// unknown action
if (typeof actions[action] !== 'function') {
  console.error('unknown action');
  process.exit(1);
}

resource.forEach(function(part, i) {
  if (part.trim() === '') {
    console.error('invalid resource path');
    process.exit(1);
  }
});

// normalize resource
resource = {
  namespace: (resource.length >= 2) ? resource[0] : null,
  project: (resource.length >= 3) ? resource[1] : null,
  type: (resource.length >= 3) ?
          (resource[2].substr(-1,1) == 's') ? resource[2] : resource[2] + 's'
          : (resource.length === 1) ? resource[0] : resource[1],
  id: resource[3] || null
};

// normalize data
var data = {
  title: null,
  description: null,
  labels: [],
  username: null
};

// parse message
if (argv['m']) {
  var message = argv.m.split("\n",2);
  if (message.length >= 1) {
    data.title = message[0].trim();
  }
  if (message.length === 2) {
    data.description = message[1].trim();
  }
}

// parse labels
if (argv['l'] && argv.t.trim() !== '') {
  data.labels = argv.l.trim().split(',');
}
else if (argv['labels'] && argv.tags.trim() !== '') {
  data.labels = argv.labels.trim().split(',');
}

data.labels.forEach(function(label, i) {
  data.labels[i] = label.trim();
});

// parse user
if (argv['u'] && argv.u.trim() !== '') {
  data.username = argv.u.trim();
}
else if(argv['user'] && argv.user.trim() !== '') {
  data.username = argv.user.trim();
}

if (data.username === null || data.username === 'me') {
  data.username = config.username;
}

// init actions
actions.init(client, function(error) {
  if (error) {
    console.error(error);
  }
  else {
    function getActionVerb(action)
    {
      var verb = action;
      var lastChar = action.substr(-1, 1);

      if (lastChar === 'e') {
        verb = action.substr(0, action.length - 1);
      }
      else if (action === 'get') {
        verb = action + 't';
      }

      verb += 'ing';

      return verb;
    }

    // everything seems to be ok, so let's rock!
    actions[action](resource, data, function(error, data) {
      if (resource.project) {
        console.log(getActionVerb(action) + ' ' + resource.type + ' in project "' + resource.project + '" ...');
      }
      else {
        console.log(getActionVerb(action) + ' all ' + resource.type + ' ...');
      }

      if (error) {
        console.error(error);
      }
      else {
        console.log(data);
      }
    });
  }
});