export function convert(bytes, decimal = 2) {
  var units = ["K", "M", "G", "T"];
  for (var i = 1; bytes / Math.pow(1024, i) >= 1; i++) {}
  return (bytes / Math.pow(1024, i - 1)).toFixed(decimal) + units[i - 1];
}
