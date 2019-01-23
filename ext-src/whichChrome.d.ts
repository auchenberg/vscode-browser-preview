declare module 'which-chrome' {
  let chromepaths: {
    Chrome: string;
    Chromium: string;
  };
  export default chromepaths;

  /**
   * The version of the editor.
   */

  export var Chrome: string;
  export var Chromium: string;
}
