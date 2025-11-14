import {javascript} from '@codemirror/lang-javascript';
import {EditorView, basicSetup} from 'codemirror';
import {xml} from '@codemirror/lang-xml';
import {json} from '@codemirror/lang-json';

/**
 * @typedef {HTMLTextAreaElement & {
 *   $setValue: (insert: string) => void,
 *   $getValue: () => string
 * }} EnhancedTextArea
 */

/** @type {Map<HTMLTextAreaElement, EditorView>} */
const textareaToViewMap = new Map();

/**
 * @param {HTMLTextAreaElement} textarea
 * @param {any} extensions
 * @param {(content: string) => void} inputHandler
 * @returns {EditorView}
 */
export function editorFromTextArea (textarea, extensions, inputHandler) {
  /** @type {EditorView} */
  let view = /** @type {EditorView} */ (textareaToViewMap.get(textarea));

  /**
   * @param {string} [val]
   */
  const createView = (val) => {
    view = new EditorView({
      doc: val ?? textarea.value,
      extensions: [
        basicSetup,
        EditorView.updateListener.of((viewUpdate) => {
          // Check if the document content has changed
          if (viewUpdate.docChanged) {
            const newContent = viewUpdate.state.doc.toString();
            inputHandler(newContent);
            // You can perform actions here based on the new content
          }
        }),
        ...(extensions.javascript ? [javascript(extensions.javascript)] : []),
        ...(extensions.xml ? [xml(extensions.xml)] : []),
        ...(extensions.json ? [json()] : [])
      ]
    });

    textareaToViewMap.set(textarea, view);
    textarea.parentNode?.insertBefore(view.dom, textarea);
    textarea.style.display = 'none';
  };

  if (textarea.previousElementSibling?.matches('.cm-editor')) {
    const prevLang = /** @type {HTMLElement} */ (
      textarea.previousElementSibling.querySelector('.cm-content')
    ).dataset.language;
    if (prevLang && prevLang in extensions) {
      // console.log('same language');
      return view;
    }

    const val = /** @type {EnhancedTextArea} */ (textarea).$getValue();
    textarea.previousElementSibling.remove();
    view.destroy();
    createView(val);
    // console.log('different language');
  } else {
    createView();
    // console.log('new setup');
  }

  /** @type {EnhancedTextArea} */
  (textarea).$setValue = (insert) => {
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert
      }
    });
  };

  /** @type {EnhancedTextArea} */
  (textarea).$getValue = () => {
    return view.state.doc.toString();
  };

  if (textarea.form) {
    textarea.form.addEventListener('submit', () => {
      textarea.value = view.state.doc.toString();
    });
  }
  return view;
}
