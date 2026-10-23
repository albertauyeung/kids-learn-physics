// Widget registry: content refers to widgets by name. New physics topics register new widgets here.

import sorter from './sorter.js';
import walker from './walker.js';
import race from './race.js';
import journey from './journey.js';
import motionMapper from './motion-mapper.js';
import railDelivery from './rail-delivery.js';
import velocityLine from './velocity-line.js';
import travelator from './travelator.js';
import twoCarts from './two-carts.js';
import river from './river.js';
import slopeReader from './slope-reader.js';

export const WIDGETS = {
  sorter,
  walker,
  race,
  journey,
  'motion-mapper': motionMapper,
  'rail-delivery': railDelivery,
  'velocity-line': velocityLine,
  travelator,
  'two-carts': twoCarts,
  river,
  'slope-reader': slopeReader,
};

export function mountWidget(name, el, params, api) {
  const w = WIDGETS[name];
  if (!w) throw new Error(`Unknown widget: ${name}`);
  return w(el, params || {}, api) || (() => {});
}
