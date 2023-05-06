export default function () {
  return {
    manipulateOptions: function manipulateOptions(_opts: any, parserOpts: any) {
      parserOpts.plugins.push('jsx');
    },
  };
}
