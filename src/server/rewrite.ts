import { parse } from '@babel/parser';

function override(source: string, start: number, end: number, replacement: string) {
  const head = source.slice(0, start);
  const tail = source.slice(end);
  return head + replacement + tail;
}

export function rewrite(source: string) {
  let src = source;
  const ast = parse(source, {
    sourceType: 'module',
  });

  const body = ast.program.body;

  body.forEach(node => {
    if (node.type === 'ImportDeclaration') {
      if (/^[^\.\/]/.test(node.source.value)) {
        const start = node.source.start;
        const end = node.source.end;
        src = override(src, start, end, `'/__modules/${node.source.value}'`);
      }
    }
  });
  return src;
}
