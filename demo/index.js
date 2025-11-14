import {nbsp, jml, body} from 'jamilih';
import {jtlt} from '../src/index-browser.js';
import {editorFromTextArea} from './codemirror.js';

/**
 * @returns {Promise<void>}
 */
async function templateProcessor () {
  await processTemplates();
}
/**
 * @param {string} sel
 * @returns {HTMLInputElement}
 */
const $i = (sel) => {
  return /** @type {HTMLInputElement} */ (document.querySelector(sel));
};
/**
 * @param {string} sel
 * @returns {import('./codemirror.js').EnhancedTextArea}
 */
const $t = (sel) => {
  return /** @type {import('./codemirror.js').EnhancedTextArea} */ (
    document.querySelector(sel)
  );
};

/**
 * @returns {Promise<void>}
 */
async function processTemplates () {
  $t('#output').value = '';
  const source = $t('#source').$getValue();

  let data;
  let isJson = false;
  data = new DOMParser().parseFromString(source, 'text/xml');

  if (
    // Firefox
    (data.documentElement.localName === 'parsererror' &&
    data.documentElement.namespaceURI ===
      // eslint-disable-next-line sonarjs/no-clear-text-protocols -- Namespace
      'http://www.mozilla.org/newlayout/xml/parsererror.xml') ||
    // Chrome
    data.querySelector('parsererror')
  ) {
    try {
      data = JSON.parse(source);
      editorFromTextArea($t('#source'), {
        json: {}
      }, templateProcessor);
    } catch (err) {
      $t('#output').value = 'Error parsing source as either XML or JSON\n\n' +
        new XMLSerializer().serializeToString(data) + '\n\n' +
      /** @type {Error} */ (err).message;
      return;
    }
    isJson = true;
  } else {
    editorFromTextArea($t('#source'), {
      xml: {}
    }, templateProcessor);
  }

  let templates;
  try {
    // eslint-disable-next-line no-eval -- Todo: input to jsep?
    templates = eval($t('#jtltTemplates').$getValue());
    if (!templates || !templates.length) {
      throw new Error('Bad templates');
    }
  } catch {
    $t('#output').value =
      'Error parsing jtlt templates; must be an array of templates.';
    return;
  }

  let result;

  if ($i('#forQuery').checked) {
    try {
      result = isJson
        ? await jtlt({
          data,
          engineType: 'jsonpath',
          outputType: 'string',
          forQuery: templates
        })
        : await jtlt({
          data,
          engineType: 'xpath',
          xpathVersion: 3.1,
          outputType: 'string',
          forQuery: templates
        });
    } catch (err) {
      $t('#output').value = 'Error executing jtlt()\n\n' +
      /** @type {Error} */ (err).message;
      return;
    }
  } else {
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
          xpathVersion: 3.1,
          outputType: 'string',
          templates
        });
    } catch (err) {
      $t('#output').value = 'Error executing jtlt()\n\n' +
      /** @type {Error} */ (err).message;
      return;
    }
  }

  $t('#output').value = result;
}

jml('section', [
  ['select', {$on: {
    click () {
      if (/** @type {HTMLSelectElement} */ (this).value === 'xml') {
        $t('#source').$setValue(`<root></root>`);
        $t('#jtltTemplates').$setValue($i('#forQuery').checked
          ? `['//*', function () {
  this.string('test123');
}]`
          : `[
  ['//*', function () {
    this.string('test123');
  }]
]`);
      } else if (/** @type {HTMLSelectElement} */ (this).value === 'json') {
        $t('#source').$setValue(`{
  "a": 5,
  "b": {
    "c": 7
  }
}`);
        $t('#jtltTemplates').$setValue($i('#forQuery').checked
          ? `['$.b', function (o) {
  this.string(o.c);
}]`
          : `[
  {
    path: '$',
    template () {
      this.applyTemplates('$.b');
    }
  },
  ['$.b', function (o) {
    this.string(o.c);
  }]
]`);
      }
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
  nbsp.repeat(2),
  ['label', [
    ['input', {
      id: 'forQuery', type: 'checkbox',
      checked: Boolean(localStorage.getItem('forQuery')),
      $on: {
        async click (e) {
          if (/** @type {HTMLInputElement} */ (e.target).checked) {
            localStorage.setItem('forQuery', 'true');
          } else {
            localStorage.removeItem('forQuery');
          }
          await processTemplates();
        }
      }
    }],
    'Use `forQuery` instead of templates'
  ]],
  ['br'], ['br'],
  ['textarea', {
    id: 'source',
    placeholder: 'Put XML or JSON source here...'
  }],

  ['textarea', {
    id: 'jtltTemplates',
    placeholder: 'Put jtlt templates array here...'
  }],

  ['textarea', {id: 'output', placeholder: 'Loading...'}]
], body);

editorFromTextArea($t('#jtltTemplates'), {
  javascript: {typescript: true}
}, templateProcessor);
editorFromTextArea($t('#source'), {
  xml: {}
}, templateProcessor);
