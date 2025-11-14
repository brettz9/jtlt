import {jml, body} from 'jamilih';
import {jtlt} from '../src/index-browser.js';

/**
 * @param {string} sel
 * @returns {HTMLTextAreaElement}
 */
const $t = (sel) => {
  return /** @type {HTMLTextAreaElement} */ (document.querySelector(sel));
};

/**
 * @returns {Promise<void>}
 */
async function processTemplates () {
  $t('#output').value = '';
  const source = $t('#source').value;

  let data;
  let isJson = false;
  data = new DOMParser().parseFromString(source, 'text/xml');

  if (data.documentElement.localName === 'parsererror' &&
    data.documentElement.namespaceURI ===
      // eslint-disable-next-line sonarjs/no-clear-text-protocols -- Namespace
      'http://www.mozilla.org/newlayout/xml/parsererror.xml'
  ) {
    try {
      data = JSON.parse(source);
    } catch (err) {
      $t('#output').value = 'Error parsing source as either XML or JSON\n\n' +
        new XMLSerializer().serializeToString(data) + '\n\n' +
      /** @type {Error} */ (err).message;
      return;
    }
    isJson = true;
  }

  let templates;
  try {
    // eslint-disable-next-line no-eval -- Todo: input to jsep?
    templates = eval($t('#jtltTemplates').value);
    if (!templates || !templates.length) {
      throw new Error('Bad templates');
    }
  } catch {
    $t('#output').value =
      'Error parsing jtlt templates; must be an array of templates.';
    return;
  }

  let result;
  try {
    result = isJson
      ? await jtlt({
        data,
        engineType: 'jsonpath',
        outputType: 'string',
        templates
      })
      : await jtlt({
        data,
        engineType: 'xpath',
        outputType: 'string',
        templates
      });
  } catch (err) {
    $t('#output').value = 'Error executing jtlt()\n\n' +
    /** @type {Error} */ (err).message;
    return;
  }

  $t('#output').value = result;
}

jml('section', [
  ['select', {$on: {
    click () {
      if (/** @type {HTMLSelectElement} */ (this).value === 'xml') {
        $t('#source').value = `<root></root>`;
        $t('#jtltTemplates').value = `[
  ['//*', function () {
    this.string('test123');
  }]
]`;
      } else if (/** @type {HTMLSelectElement} */ (this).value === 'json') {
        $t('#source').value = `{
  "a": 5,
  "b": {
    "c": 7
  }
}`;
        $t('#jtltTemplates').value = `[
  ['$.b', function (o) {
    this.string(o.c);
  }]
]`;
      }
      $t('#source').dispatchEvent(new Event('input'));
    }
  }}, [
    ['option', [
      '(Populate...)'
    ]],
    ['option', {value: 'xml'}, [
      'XML/XPath example 1'
    ]],
    ['option', {value: 'json'}, [
      'JSON/JSONPath example 1'
    ]]
  ]],
  ['br'], ['br'],
  ['textarea', {
    id: 'source',
    placeholder: 'Put XML or JSON source here...',
    $on: {
      async input () {
        await processTemplates();
      }
    }
  }],

  ['textarea', {
    id: 'jtltTemplates',
    placeholder: 'Put jtlt templates array here...',
    $on: {
      async input () {
        await processTemplates();
      }
    }
  }],

  ['textarea', {id: 'output', placeholder: 'Loading...'}]
], body);
