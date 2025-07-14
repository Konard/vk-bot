const second = 1;

const ms = second / 1000;
const millisecond = ms;
const ns = millisecond / 1000;
const nanosecond = ns;

const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const month = 30 * day;
const year = 365 * day;
const decade = 10 * year;
const century = 100 * year;
const millennium = 1000 * year;

module.exports = {
  nanosecond,
  ns,
  millisecond,
  ms,
  second,
  minute,
  hour,
  day,
  week,
  month,
  year,
  decade,
  century,
  millennium,
};
