/**
 * @param {string} txt
 */
export function write (txt) {
  document.body.append(txt, document.createElement('br'));
}

/**
 * @param {string} txt
 */
export function validate (txt) {
  try {
    JSON.parse(txt);
  } catch (e) {
    write('error validating JSON:' + e);
  }
}

/**
 * @param {string} txt
 */
export function validateAndWrite (txt) {
  validate(txt);
  write(txt);
}
