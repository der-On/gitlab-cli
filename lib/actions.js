var projects = [];
var users = [];
var fs = require('fs');

// aliases file might not exist
try {
  var aliases = require('../config/aliases');
}
catch (error) {
  var aliases = {};
}

// dependencies
var client = null;
var argv = [];
var resource = {
  namespace: null,
  project: null,
  type: null,
  id: null
};
var options = {
  title: null,
  description: null,
  username: null,
  labels: [],
  filter: null
}

function getUserByUsername(username)
{
  var i, user;

  for(i = 0; i < users.length; i++) {
    user = users[i];
    if (user.username === username) {
      return user;
    }
  }

  return null;
}

function getUserIdByUsername(username)
{
  var user = getUserByUsername(username);
  if (user) {
    return user.id;
  }

  return null;
}


function getProjectByResource(resource)
{
  var i, project;

  for(i = 0; i < projects.length; i++) {
    project = projects[i];
    if (project.path_with_namespace === resource.namespace + '/' + resource.project) {
      return project;
    }
  }

  return null;
}

function getProjectIdByResource(resource)
{
  var project = getProjectByResource(resource);
  if (project) {
    return project.id;
  }

  return null;
}

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

function log(action, resource, options)
{
  if (resource.project) {
    console.log(getActionVerb(action) + ' ' + resource.type + ' in project "' + resource.project + '" ...');
  }
  else {
    console.log(getActionVerb(action) + ' all ' + resource.type + ' ...');
  }
}

function checkResource(resource, cb)
{
  if (typeof client[resource.type] !== 'object') {
    cb('resource type "' + resource.type + '" does not exist', null);
    return false;
  }
  else {
    return true;
  }
}

function init(_options, cb)
{
  client = _options.client || client;
  argv = _options.argv || argv;
  resource = _options.resource || resource;
  options = _options.options || options;

  client.users.list({}, function onUsersLoaded(error, _users) {
    if (error) {
      cb(error);
    }
    else {
      users = _users;
      loadProjects();
    }
  });

  function loadProjects()
  {
    client.projects.list({}, function onProjectsLoaded(error, _projects) {
      projects = _projects;

      cb(error);
    });
  }
}
module.exports.init = init;


function get(cb)
{
  log('get', resource, options);

  if (resource.project) {
    options.id = getProjectIdByResource(resource);
  }

  if (resource.id) {
    options[resource.type.substr(0, resource.type.length -1) + '_id'] = resource.id;

    client[resource.type].get(options, cb);
  }
  else {
    console.error('missing resource id');
    process.exit(1);
  }
}
module.exports.get = get;


function list(cb)
{
  log('list', resource, options);

  if (resource.project) {
    options.id = getProjectIdByResource(resource);
  }

  if (checkResource(resource, cb)) {
    client[resource.type].list(options, cb);
  }

}
module.exports.list = list;


function remove(cb)
{
  log('remove', resource, options);

  if (resource.project) {
    options.id = getProjectIdByResource(resource);
  }

  if (checkResource(resource, cb)) {
    client[resource.type].remove(options, cb);
  }
}
module.exports.remove = remove;


function create(cb)
{
  log('create', resource, options);

  if (resource.project) {
    options.id = getProjectIdByResource(resource);
  }

  if (checkResource(resource, cb)) {
    client[resource.type].create(options, cb);
  }
}
module.exports.create = create;


function update(cb)
{
  log('update', resource, options);

  if (resource.project) {
    options.id = getProjectIdByResource(resource);
  }

  if (checkResource(resource, cb)) {
    client[resource.type].update(options, cb);
  }
}
module.exports.update = update;


function open(cb)
{
  log('open', resource, options);

  if (resource.project) {
    options.id = getProjectIdByResource(resource);
  }
  else {
    cb('missing project', null);
  }

  options.assignee_id = getUserIdByUsername(options.username);

  if (resource.type === 'issues') {
    if (resource.id) {
      options.issue_id = resource.id;
      options.state_event = 'reopen';

      update(cb);
    }
    else {
      create(cb);
    }
  }
  else {
    cb('you can only open issues', null);
  }
}
module.exports.open = open;


function close(cb)
{
  log('close', resource, options);

  if (resource.project) {
    options.id = getProjectIdByResource(resource);
  }
  else {
    cb('missing project', null);
  }

  options.assignee_id = getUserIdByUsername(options.username);

  if (resource.type === 'issues') {
    if (resource.id) {
      options.issue_id = resource.id;
      options.state_event = 'close';

      update(cb);
    }
    else {
      cb('missing issue id', null);
    }
  }
  else {
    cb('you can only close issues', null);
  }
}
module.exports.close = close;

function saveAliases()
{
  var options = 'var aliases = ' + JSON.stringify(aliases, null, 2) + ';' +
             '\n' +
             'module.exports = aliases;';

  fs.writeFileSync( __dirname + '/../config/aliases.js', options, { ecncoding: 'utf8' });
}

function alias(cb)
{
  console.log('creating alias ...');

  var path = argv._[1] || '';
  var alias = argv._[2] || '';

  path.trim();
  alias.trim();

  if (path !== '' && alias !== '') {
    aliases[alias] = path;

    saveAliases();

    cb(null, null);
  }
  else {
    cb('resource path or alias missing or invalid', null);
  }
}
module.exports.alias = alias;


function removeAlias(cb)
{
  console.log('removing alias ...');

  var alias = argv._[1];
  alias.trim();

  if (alias !== '' && aliases[alias]) {
    delete aliases[alias];

    saveAliases();
    cb(null, null);
  }
  else {
    cb('alias does not exist or is invalid', null);
  }
}
module.exports['rm-alias'] = removeAlias;


function listAliases(cb)
{
  var aliases = '';
  for(var alias in aliases) {
    aliases += alias +':\t\t' + aliases[alias] + '\n';
  }
  cb(null, aliases);
}
module.exports['list-aliases'] = listAliases;

/*
function comment(resource, options, cb)
{
  if (resource.project) {
    options.id = getProjectIdByResource(resource);
  }
  else {
    cb('missing project', null);
  }

  if (resource.type === 'issue') {
    if (resource.id) {
      options.issue_id = resource.id;
      options.state_event = 'close';

      update(resource, options, cb);
    }
    else {
      cb('missing issue id', null);
    }
  }
  else {
    cb('you can only comment issues', null);
  }
}
module.exports.comment = comment;*/
