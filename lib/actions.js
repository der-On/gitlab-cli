var projects = [];
var users = [];
var fs = require('fs');
var defaults = require('./defaults');

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
var resource = defaults.resource();
var options = defaults.options();
var data = defaults.data();

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

function getProjectsByNamespace(namespace, projects)
{
  var _projects = [];

  projects.forEach(function(project, i) {
    if (project.path_with_namespace.substr(0, namespace.length) === namespace) {
      _projects.push(project);
    }
  });

  return _projects;
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

function log(action)
{
  if (resource.project) {
    console.log(getActionVerb(action) + ' ' + resource.type + ' in project "' + resource.project + '" ...');
  }
  else {
    console.log(getActionVerb(action) + ' all ' + resource.type + ' ...');
  }
}

function checkResource(cb)
{
  if (typeof client[resource.type] !== 'object') {
    cb('resource type "' + resource.type + '" does not exist', null);
    return false;
  }
  else {
    return true;
  }
}

function resolveProjectId()
{
  if (resource.project) {
    data.id = getProjectIdByResource(resource);
  }

  return data;
}

function checkResourceId(cb)
{
  var check = (data[resource.type.substr(0, resource.type.length - 1) + '_id']) ? true : false;

  if (!check) {
    cb('missing resource id', null);
  }
  return check;
}

function checkProjectId(cb)
{
  if (data.id) {
    return true;
  }
  else {
    cb('missing project', null);
    return false;
  }
}

function init(deps, cb)
{
  client = deps.client || client;
  argv = deps.argv || argv;
  resource = deps.resource || resource;
  data = deps.data || data;
  options = deps.options || options;

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
  log('get');

  resolveProjectId();

  if (checkResourceId(cb)) {
    client[resource.type].get(data, cb);
  }
}
module.exports.get = get;


function list(cb)
{
  log('list');

  resolveProjectId();

  if (checkResource(cb)) {
    client[resource.type].list(data, function(error, data) {
      if (data) {
        if (resource.type === 'projects' && resource.namespace) {
          data = getProjectsByNamespace(resource.namespace, data);
        }
      }

      cb(error, data);
    });
  }
}
module.exports.list = list;

function create(cb)
{
  log('create', resource);

  resolveProjectId();

  if (checkResource(cb)) {
    // projects have 'names' not 'titles'
    if (resource.type === 'projects' && data.title && !data.name) {
      data.name = data.title;
    }
    client[resource.type].create(data, cb);
  }
}
module.exports.create = create;


function update(cb)
{
  log('update');

  resolveProjectId();

  if (checkResourceId(cb) && checkResource(cb)) {
    client[resource.type].update(data, cb);
  }
}
module.exports.update = update;


function remove(cb)
{
  log('remove');

  resolveProjectId();

  if (checkResourceId(cb) && checkResource(cb)) {
    client[resource.type].remove(data, cb);
  }
}
module.exports.remove = remove;


function open(cb)
{
  log('open');

  resolveProjectId();

  if (!checkProjectId(cb)) {
    return;
  }

  data.assignee_id = getUserIdByUsername(options.username);

  if (resource.type === 'issues') {
    if (checkResourceId(function(){})) {
      data.state_event = 'reopen';

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
  log('close');

  resolveProjectId();

  if (!checkProjectId(cb)) {
    return;
  }

  data.assignee_id = getUserIdByUsername(options.username);

  if (resource.type === 'issues') {
    if (checkResourceId(cb)) {
      data.state_event = 'close';

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
  var out = 'var aliases = ' + JSON.stringify(aliases, null, 2) + ';' +
             '\n' +
             'module.exports = aliases;';

  fs.writeFileSync( __dirname + '/../config/aliases.js', out, { ecncoding: 'utf8' });
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