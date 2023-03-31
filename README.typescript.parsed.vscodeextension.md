const vscode = require('vscode');
const ts = require('typescript');

function activate(context) {
  console.log('Your extension is now active!');

  let disposable = vscode.commands.registerCommand('extension.parseTypeScript', () => {
    let editor = vscode.window.activeTextEditor;

    if (editor) {
      let document = editor.document;

      if (document.languageId === 'typescript') {
        let sourceFile = ts.createSourceFile(document.fileName, document.getText(), ts.ScriptTarget.Latest, true);

        let importDeclarations = [];

        function visit(node) {
          if (node.kind === ts.SyntaxKind.ImportDeclaration) {
            importDeclarations.push(node.getText());
          }

          ts.forEachChild(node, visit);
        }

        visit(sourceFile);

        // Do something with the importDeclarations array here
      }
    }
  });

  context.subscriptions.push(disposable);
}

exports.activate = activate;

function deactivate() {
  console.log('Your extension has been deactivated!');
}

exports.deactivate = deactivate;
