module.exports = function(cop) {
  cop.on('rule', function (rule) {
    if (rule.declarations.length === 0) {
      this.error('empty rule');
    }
  });
};
