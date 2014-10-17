var CssSelectorParser = require('css-selector-parser').CssSelectorParser;
var cssparse = require('css');

parser = new CssSelectorParser();
parser.registerSelectorPseudos('has');
parser.registerNestingOperators('>', '+', '~');
parser.registerAttrEqualityMods('^', '$', '*', '~');
parser.enableSubstitutes();

function cop() {

  var handlers = {};

  function walkEach(nodes) {
    return nodes.reduce(walk, {
      errors: [],
      warnings: []
    });
  }

  function walk(report, node) {
    if (!node.type) {
      return report;
    }

    function warn(msg) {
      report.warnings.push({
        msg: msg,
        position: node.position.start
      });
    }

    function error(msg) {
      report.errors.push({
        msg: msg,
        position: node.position.start
      });
    }

    var snitch = {
      warn: warn,
      error: error
    };

    var type = node.type;
    if (type in handlers) {
      handlers[type].forEach(function (handler) {
        handler.call(snitch, node);
      });
    }

    var result;
    switch (node.type) {
      case 'stylesheet':
        result = walkEach(node.stylesheet.rules);
        break;
      case 'rule':
        result = walkEach(node.declarations);
        break;
      case 'media':
        result = walkEach(node.rules);
        break;
      case 'declaration':
        break;
      case 'keyframes':
        result = walkEach(node.keyframes);
        break;
      case 'keyframe':
        result = walkEach(node.declarations);
        break;
      default:
        report.warnings.push({
          msg: 'unrecognized node of type ' + node.type,
          position: node.position.start
        });
    }

    if (result) {
      return {
        warnings: report.warnings.concat(result.warnings),
        errors: report.errors.concat(result.errors)
      };
    } else {
      return report;
    }
  }

  var plugin = function plugin(css) {
    var om = cssparse.parse(css);
    var report = walkEach(om.stylesheet.rules);
    return report;
  };

  plugin.on = function (type, handler) {
    if (!handlers[type]) {
      handlers[type] = [];
    }
    handlers[type].push(handler);
    return plugin;
  };

  return plugin;
}

module.exports = cop;
