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
import unit3 from './unit3/index.js';
import unit4 from './unit4/index.js';
import unit5 from './unit5/index.js';

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
  // Later units keep their widgets in their own folder (each index.js exports { name: widget }).
  ...unit3,
  ...unit4,
  ...unit5,
};

export function mountWidget(name, el, params, api) {
  const w = WIDGETS[name];
  if (!w) throw new Error(`Unknown widget: ${name}`);
  return w(el, params || {}, api) || (() => {});
}
