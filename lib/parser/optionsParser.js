var defaults = require('../defaults');
var split = require('../utils').split;

function parse(argv)
{
  var options = defaults.options();

  var _filters = null;
  if (argv['f'] && argv.f.trim() !== '') {
    _filters = argv.f.trim();
  }
  if (argv['filters'] && argv.filters.trim() !== '') {
    _filters = argv.filters.trim();
  }

  if (_filters) {
    options.filters = {};

    _filters = _filters.split(',');
    _filters.forEach(function(_filter, i) {
      _filters[i] = split(_filter, '=', 2);

      if (_filters[i].length < 2) {
        _filters[i].push(null);
      }

      options.filters[_filters[i][0]] = _filters[i][1];
    });
  }

  if (argv['json']) {
    options.json = true;
  }

  if (argv['debug']) {
    options.debug = true;
  }

  if (argv['u'] || argv['user']) {
    options.username = argv.u || argv.user;
  }

  if (argv['accept-certs']) {
    options.acceptCerts = true;
  }

  if (argv['config']) {
    options.config = argv['config'];
  }
  else {
    options.config = '~/.config/gitlab-cli/default.js'
  }

  return options;
}
module.exports = parse;