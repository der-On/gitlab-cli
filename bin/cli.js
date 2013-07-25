#!/usr/bin/env node

var optimist = require('optimist');
var gitlab = require('node-gitlab');
var actions = require('../lib/actions') || {};
var stringify = require('../lib/stringify');
var defaults = require('../lib/defaults');
var optionsParser = require('../lib/parser/optionsParser');
var dataParser = require('../lib/parser/dataParser');
var resourceParser = require('../lib/parser/resourceParser');

var argv = optimist.argv;
var fs = require('fs');

var deps = {}; // dependencies passed around

var usage = fs.readFileSync( __dirname + '/../usage.txt', { encoding: 'utf8' });
optimist.usage(usage);

// help wanted or missing arguments, exit
if (argv['h'] || argv['help'] || argv._.length < 1) {
  console.log(usage);
  process.exit(1);
}

// load environment
var env = argv.env || 'default';
var config = require('../config/' + env);

// aliases file might not exist
try {
  var aliases = require('../config/aliases');
}
catch (error) {
  var aliases = {};
}


// get action
var action = argv._[0] || '';
action = action.trim();

// missing action
if (action === '') {
  console.error('no action specified');
  process.exit(1);
}

// unknown action
if (typeof actions[action] !== 'function') {
  console.error('unknown action');
  process.exit(1);
}

// get resource
deps.resource = resourceParser(argv, aliases);

// get data
deps.data = dataParser(argv);

// get options
deps.options = optionsParser(argv);

// resolve "me" in username
if (deps.options.username === "me") {
  deps.options.username = config.username;
}

// copy labels from data to options
deps.options.labels = deps.data.labels;

// copy prefixed id from resource to data
if (deps.resource.id && !deps.data.id) {
  deps.data[deps.resource.type.substr(0, deps.resource.type.length - 1) + '_id'] = deps.resource.id;
}

if (deps.options.debug) {
  console.log('[DEBUG] initalized gitlab-cli');
  console.log(deps);
}

// create gitlab client
var client = gitlab.create({
  api: config.url + '/api/v3',
  privateToken: config.privateToken
});
client.username = config.username;

// init actions
actions.init({
  client: client,
  argv: argv,
  resource: deps.resource,
  data: deps.data,
  options: deps.options }, onInit);

function inFilters(item)
{
  var i, key, filter;

  if (deps.options.filters) {

    for(key in deps.options.filters) {
      if (item[key]) {
        if (item[key] == deps.options.filters[key]) {
          return true;
        }
      }
    }

    return false;
  }
  else {
    return true;
  }
}

function hasLabels(item)
{
  var i, label;
  if (deps.options.labels && deps.options.labels.length > 0) {
    if (item.labels) {
      for(i = 0; i < deps.options.labels.length; i++) {
        label = deps.options.labels[i];

        if (hasLabel(item, label)) {
          return true;
        }
      }
      return false;
    }
    else {
      return false;
    }
  }
  else {
    return true;
  }
}

function hasLabel(item, label)
{
  for(var i = 0; i < item.labels.length; i++) {
    if (item.labels[i] === label) {
      return true;
    }
  }
  return false;
}

function onInit(error) {
  if (error) {
    console.error(error);
  }
  else {
    // everything seems to be ok, so let's rock!
    actions[action](function(error, data) {
      if (error) {
        if (typeof error === 'object') {
          console.error('error: ' + error.data.resBody.message || '');
        }
        else {
          console.error('error: ' + error);
        }
      }
      else {
        if (data) {
          if (typeof data === 'object') {
            if (typeof data.length === 'number') {
              data.forEach(function(item, i) {
                if (inFilters(item) && hasLabels(item)) {
                  if (deps.options.json === false && stringify[deps.resource.type]) {
                    console.log(stringify[deps.resource.type](item));
                  }
                  else {
                    console.log(item);
                  }
                  console.log("-------------------------------------");
                }
              });
            }
            else if (inFilters(data) && hasLabels(data)) {
              if (deps.options.json === false && stringify[deps.resource.type]) {
                console.log(stringify[deps.resource.type](data));
              }
              else {
                console.log(data);
              }
            }
          }
          else {
            console.log(data);
          }
        }
        console.log('done');
      }
    });
  }
}