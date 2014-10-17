var CssSelectorParser = require('css-selector-parser').CssSelectorParser;
var chalk = require('chalk');

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

  var plugin = function plugin(om, rework) {
    var num = 0;
    var report = walkEach(om.rules);
    renderReport(report);
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

function out(s) {
  process.stdout.write(s);
}

function renderReport(r) {
  out('\n');
  r.warnings.forEach(function (warning) {
    out(chalk.yellow('Warning: ' + warning.msg + '\n'));
    out('Line ' + warning.position.line + ', Column ' + warning.position.column + '\n\n');
  });
  r.errors.forEach(function (error) {
    out(chalk.red('Error: ' + error.msg + '\n'));
    out('Line ' + error.position.line + ', Column ' + error.position.column + '\n\n');
  });
  out(chalk.bold(r.warnings.length + ' warnings, ' + r.errors.length + ' errors\n\n'));
  if (r.errors.length) {
    process.exit(1);
  }
}

module.exports = cop;
