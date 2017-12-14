#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
var home = require('home');
var optimist = require('optimist');
var gitlab = require('node-gitlab');
var actions = require('../lib/actions') || {};
var stringify = require('../lib/stringify');
var optionsParser = require('../lib/parser/optionsParser');
var dataParser = require('../lib/parser/dataParser');
var resourceParser = require('../lib/parser/resourceParser');

var argv = optimist.argv;

var deps = {}; // dependencies passed around

var usage = fs.readFileSync( __dirname + '/../usage.txt', { encoding: 'utf8' });
optimist.usage(usage);

if (argv.env) {
  console.log('The --env option is not used anymore. Please use --config instead.');
  process.exit(1);
}

// help wanted or missing arguments, exit
if (argv['h'] || argv['help'] || argv._.length < 1) {
  console.log(usage);
  process.exit(1);
}

// load environment
var configPath = (typeof argv.config === 'string') ? argv.config : '~/.config/gitlab-cli/default.js';
try {
  var configFullPath = home.resolve(configPath);
} catch(error) {

}

if (!configFullPath || !fs.existsSync(configFullPath)) {
  console.log('Configuration file could not be found under: ' + configPath + '\nPlease create it from the example under config/default.sample.js');
  process.exit(1);
}
var config = require(configFullPath);

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

// get data
deps.data = dataParser(argv);

// get resource
deps.resource = resourceParser(argv, aliases, deps.data);

// get options
deps.options = optionsParser(argv);

// accept self-signed or unauthorized certificates
if (deps.options.acceptCerts) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

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

              data = data.filter(function(item) {
                return (inFilters(item) && hasLabels(item));
              });

              if (deps.options.json) {
                console.log(JSON.stringify(data, null, 2));
              }
              else {
                data.forEach(function(item, i) {

                  if (stringify[deps.resource.type]) {
                    console.log(stringify[deps.resource.type](item));
                  }
                  else {
                    console.log(JSON.stringify(item, null, 2));
                  }
                  console.log("-------------------------------------");
                });
              }
            }
            else if (inFilters(data) && hasLabels(data)) {
              if (deps.options.json === false && stringify[deps.resource.type]) {
                console.log(stringify[deps.resource.type](data));
              }
              else {
                console.log(JSON.stringify(data, null, 2));
              }
            }
          }
          else {
            console.log(data);
          }
        }
        if (!deps.options.json) console.log('done');
      }
    });
  }
}
