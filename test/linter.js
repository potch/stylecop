
module.exports = function(cop) {
  cop.on('selector.rule', function (rule) {
    if (rule.tagName &&
        !rule.classNames &&
        !rule.attrs &&
        rule.nestingOperator === null) {
      this.error('generic descendant tag selector: ' + rule.tagName);
    }
  });

  cop.on('rule', function (rule) {
    if (rule.declarations.length === 0) {
      this.error('empty rule');
    }
  });
};
