import { parse } from '@babel/parser';

/**
 * 字符串某段覆盖
 *
 * @author yuzhanglong
 * @param source 源字符串
 * @param start 需要替换的字符串开始点
 * @param end 需要替换的字符串结束点
 * @param replacement 替换内容
 * @date 2021-06-20 22:24:29
 */
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
      if (/^[^./]/.test(node.source.value)) {
        const start = node.source.start;
        const end = node.source.end;
        src = override(src, start, end, `'/__modules/${node.source.value}'`);
      }
    }
  });
  return src;
}
