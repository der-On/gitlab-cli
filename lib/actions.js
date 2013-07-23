var projects = [];
var users = [];
var client = null;

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


function init(_client, cb)
{
  client = _client;

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


function get(resource, data, cb)
{
  if (resource.project) {
    data.id = getProjectIdByResource(resource);
  }

  if (resource.id) {
    data[resource.type.substr(0, resource.type.length -1) + '_id'] = resource.id;

    client[resource.type].get(data, cb);
  }
  else {
    console.error('missing resource id');
    process.exit(1);
  }
}
module.exports.get = get;

function list(resource, data, cb)
{
  if (resource.project) {
    data.id = getProjectIdByResource(resource);
  }

  client[resource.type].list(data, cb);
}
module.exports.list = list;


function remove(resource, data, cb)
{
  if (resource.project) {
    data.id = getProjectIdByResource(resource);
  }

  client[resource.type].remove(data, cb);
}
module.exports.remove = remove;


function create(resource, data, cb)
{
  if (resource.project) {
    data.id = getProjectIdByResource(resource);
  }

  client[resource.type].create(data, cb);
}
module.exports.create = create;


function update(resource, data, cb)
{
  if (resource.project) {
    data.id = getProjectIdByResource(resource);
  }

  client[resource.type].update(data, cb);
}
module.exports.update = update;


function open(resource, data, cb)
{
  if (resource.project) {
    data.id = getProjectIdByResource(resource);
  }
  else {
    cb('missing project', null);
  }

  data.assignee_id = getUserIdByUsername(data.username);

  if (resource.type === 'issues') {
    if (resource.id) {
      data.issue_id = resource.id;
      data.state_event = 'reopen';

      update(resource, data, cb);
    }
    else {
      create(resource, data, cb);
    }
  }
  else {
    cb('you can only open issues', null);
  }
}
module.exports.open = open;


function close(resource, data, cb)
{
  if (resource.project) {
    data.id = getProjectIdByResource(resource);
  }
  else {
    cb('missing project', null);
  }

  data.assignee_id = getUserIdByUsername(data.username);

  if (resource.type === 'issues') {
    if (resource.id) {
      data.issue_id = resource.id;
      data.state_event = 'close';

      update(resource, data, cb);
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


/*
function comment(resource, data, cb)
{
  if (resource.project) {
    data.id = getProjectIdByResource(resource);
  }
  else {
    cb('missing project', null);
  }

  if (resource.type === 'issue') {
    if (resource.id) {
      data.issue_id = resource.id;
      data.state_event = 'close';

      update(resource, data, cb);
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
