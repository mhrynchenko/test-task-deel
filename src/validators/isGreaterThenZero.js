const isGreaterThanZero = value => {
  if (value <= 0) {
    throw new Error('Number must be greater than 0');
  }
  return true;
};

module.exports = { isGreaterThanZero };
