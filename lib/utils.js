function split(string, delimiter, limit)
{
  var _parts = string.split(delimiter, limit);
  var parts = string.split(delimiter);

  if (parts.length > limit) {
    for(var i = limit - 1; i < parts.length; i++) {
      _parts[limit - 1] += parts[i];
      if (i < parts.length - 1) {
        _parts[limit - 1] += delimiter;
      }
    }
  }

  return _parts;
}
module.exports.split = split;