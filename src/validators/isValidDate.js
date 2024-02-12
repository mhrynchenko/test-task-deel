const { isValid, parseISO } = require('date-fns');

const isValidDate = value => {
  if (!isValid(parseISO(value))) {
    throw new Error('Invalid date');
  }
  return true;
};
module.exports = { isValidDate };
