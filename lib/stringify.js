function issues(issue)
{
  var out = '#' + issue.id;
  if (issue.state) {
    out += ' ('+ issue.state + ')';
  }

  out +=  ': ' + issue.title;

  if (issue.description) {
    out += '\n\t' + issue.description.replace('\n','\n\t');
  }
  return  out;
}
module.exports.issues = issues;


function milestones(milestone)
{
  var out = '#' + milestone.id;
  if (milestone.state) {
    out += ' ('+ milestone.state + ')';
  }

  out +=  ': ' + milestone.title;

  if (milestone.due_date) {
    out += ' (' + milestone.due_date + ')';
  }

  if (milestone.description) {
    out += '\n\t' + milestone.description.replace('\n','\n\t');
  }
  return  out;
}
module.exports.milestones = milestones;


function users(user)
{
  var out = '#' + user.id;
  if (user.state) {
    out += ' ('+ user.state + ')';
  }

  out +=  ': ' + user.username + ' | ' + user.email;

  out += '\n\t';

  out += 'Role: ';
  switch (user.access_level) {
    case 20: out += 'Guest'; break;
    case 30: out += 'Reporter'; break;
    case 40: out += 'Developer'; break;
  }


  if (user.name) {
    out += ' | Name: ' + user.name;
  }

  return  out;
}
module.exports.users = users;
module.exports.members = users;


function projects(project)
{
  return project;
}
module.exports.projects = projects;
