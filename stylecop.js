#! /usr/bin/env node

var chalk = require('chalk');
var fs = require('fs');
var stylecop = require('./index.js');
var path = require('path');
var opts = require('nomnom').parse();

var linterpath = opts[0];
var csspath = opts[1];


try {
  var processor = require(path.join(process.cwd(), linterpath));
} catch (e) {
  console.error(e);
  process.stderr.write(chalk.red('Failed to load linter\n'));
  process.exit(1);
}

var cop = stylecop();
processor(cop);

var csspath = path.join(process.cwd(), csspath);

var report = cop(fs.readFileSync(csspath).toString('utf8'));
renderReport(report);

if (report.errors.length) {
  process.exit(1);
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
}
