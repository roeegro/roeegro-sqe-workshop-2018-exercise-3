import assert from 'assert';
import {transform_code_to_graph} from '../src/js/code-analyzer';

let code1 = 'function foo(x, y, z){\n' +
    '   let a = x + 1;\n' +
    '   let b = a + y;\n' +
    '   let c = 0;\n' +
    '   \n' +
    '   while (a < z) {\n' +
    '       c = a + b;\n' +
    '       z = c * 2;\n' +
    '       a++;\n' +
    '   }\n' +
    '   \n' +
    '   return z;\n' +
    '}\n';
let output1 = ['digraph G { ',
    'n0 [label="let a = x + 1;",shape="diamond"]',
    'n1 [label="let b = a + y;",shape="diamond"]',
    'n2 [label="let c = 0;",shape="diamond"]',
    'n3 [label="a < z",shape="diamond"]',
    'n4 [label="c = a + b",shape="diamond"]',
    'n5 [label="z = c * 2",shape="diamond"]',
    'n6 [label="a++",shape="diamond"]',
    'n7 [label="return z;",shape="rectangle"]',
    'n1 -> n2 []',
    'n2 -> n3 []',
    'n3 -> n4 [label="true"]',
    'n3 -> n7 [label="false"]',
    'n4 -> n5 []',
    'n5 -> n6 []',
    'n6 -> n3 []',
    'n0 -> n1 []',
    '',
    '',
    '}'];
let output1_allMarked = ['digraph G { ',
    'n0 [label="let a = x + 1;",shape="diamond",color="green"]',
    'n1 [label="let b = a + y;",shape="diamond",color="green"]',
    'n2 [label="let c = 0;",shape="diamond",color="green"]',
    'n3 [label="a < z",shape="diamond",color="green"]',
    'n4 [label="c = a + b",shape="diamond",color="green"]',
    'n5 [label="z = c * 2",shape="diamond",color="green"]',
    'n6 [label="a++",shape="diamond",color="green"]',
    'n7 [label="return z;",shape="rectangle",color="green"]',
    'n1 -> n2 []',
    'n2 -> n3 []',
    'n3 -> n4 [label="true"]',
    'n3 -> n7 [label="false"]',
    'n4 -> n5 []',
    'n5 -> n6 []',
    'n6 -> n3 []',
    'n0 -> n1 []',
    '',
    '',
    '',
    '}'];
let output1_someMarked = ['digraph G { ',
    'n0 [label="let a = x + 1;",shape="diamond",color="green"]',
    'n1 [label="let b = a + y;",shape="diamond",color="green"]',
    'n2 [label="let c = 0;",shape="diamond",color="green"]',
    'n3 [label="a < z",shape="diamond",color="green"]',
    'n4 [label="c = a + b",shape="diamond"]',
    'n5 [label="z = c * 2",shape="diamond"]',
    'n6 [label="a++",shape="diamond"]',
    'n7 [label="return z;",shape="rectangle",color="green"]',
    'n1 -> n2 []',
    'n2 -> n3 []',
    'n3 -> n4 [label="true"]',
    'n3 -> n7 [label="false"]',
    'n4 -> n5 []',
    'n5 -> n6 []',
    'n6 -> n3 []',
    'n0 -> n1 []',
    '',
    '',
    '',
    '}'];
let code2 = 'function foo(x, y, z){\n' +
    '    let a = x + 1;\n' +
    '    let b = a + y;\n' +
    '    let c = 0;\n' +
    '    \n' +
    '    if (b < z) {\n' +
    '        c = c + 5;\n' +
    '    } else if (b < z * 2) {\n' +
    '        c = c + x + 5;\n' +
    '    } else {\n' +
    '        c = c + z + 5;\n' +
    '    }\n' +
    '    \n' +
    '    return c;\n' +
    '}';
let output2 = ['digraph G { ',
    'n0 [label="let a = x + 1;",shape="diamond"]',
    'n1 [label="let b = a + y;",shape="diamond"]',
    'n2 [label="let c = 0;",shape="diamond"]'
    , 'n3 [label="b < z",shape="diamond"]'
    , 'n4 [label="c = c + 5",shape="diamond"]'
    , 'n5 [label="return c;",shape="rectangle"]'
    , 'n6 [label="b < z * 2",shape="diamond"]'
    , 'n7 [label="c = c + x + 5",shape="diamond"]'
    , 'n8 [label="c = c + z + 5",shape="diamond"]'
    , 'n1 -> n2 []',
    'n2 -> n3 []',
    'n3 -> n4 [label="true"]',
    'n3 -> n6 [label="false"]',
    'n4 -> n5 []',
    'n6 -> n7 [label="true"]',
    'n6 -> n8 [label="false"]',
    'n7 -> n5 []',
    'n0 -> n1 []',
    '',
    '',
    '}'];
let outpt2_marked = ['digraph G { ',
    'n0 [label="let a = x + 1;",shape="diamond",color="green"]',
    'n1 [label="let b = a + y;",shape="diamond",color="green"]',
    'n2 [label="let c = 0;",shape="diamond",color="green"]'
    , 'n3 [label="b < z",shape="diamond",color="green"]'
    , 'n4 [label="c = c + 5",shape="diamond"]'
    , 'n5 [label="return c;",shape="rectangle",color="green"]'
    , 'n6 [label="b < z * 2",shape="diamond",color="green"]'
    , 'n7 [label="c = c + x + 5",shape="diamond",color="green"]'
    , 'n8 [label="c = c + z + 5",shape="diamond"]'
    , 'n1 -> n2 []',
    'n2 -> n3 []',
    'n3 -> n4 [label="true"]',
    'n3 -> n6 [label="false"]',
    'n4 -> n5 []',
    'n6 -> n7 [label="true"]',
    'n6 -> n8 [label="false"]',
    'n7 -> n5 []',
    'n0 -> n1 []',
    '',
    '',
    '',
    '}'];

let code3 = 'function getFirst(array) {\n' +
    'return array[0];\n' +
    '}';
let code4 = 'function isFirstBiggerThen10(array) {\n' +
    'let toCheck = array[0] - 10;\n' +
    'if (toCheck > 0 ) {\n' +
    'return true;\n' +
    '}\n' +
    'else{\n' +
    'return false;\n' +
    '}\n' +
    '}';

let code5 = 'function isFirstBiggerThen10(array) {\n' +
    'let toCheck = array[0] ;\n' +
    'if (toCheck !== 0 ) {\n' +
    'return true;\n' +
    '}\n' +
    'else{\n' +
    'return false;\n' +
    '}\n' +
    '}';

let code6 = 'function five(something) {\n' +
    '    return 5;\n' +
    '}';
let output7 = ['digraph G { ',
    'n0 [label="return 5;",shape="rectangle",color="green"]',
    '',
    '',
    '',
    '}'];
let output4 = ['digraph G { ',
    'n0 [label="let toCheck = array[0] - 10;",shape="diamond",color="green"]',
    'n1 [label="toCheck > 0",shape="diamond",color="green"]',
    'n2 [label="return true;",shape="rectangle"]',
    'n3 [label="return false;",shape="rectangle",color="green"]',
    'n1 -> n2 [label="true"]',
    'n1 -> n3 [label="false"]',
    'n0 -> n1 []',
    '',
    '',
    '',
    '}'];

let output5 = ['digraph G { ',
    'n0 [label="let toCheck = array[0] - 10;",shape="diamond",color="green"]',
    'n1 [label="toCheck > 0",shape="diamond",color="green"]',
    'n2 [label="return true;",shape="rectangle"]',
    'n3 [label="return false;",shape="rectangle",color="green"]',
    'n1 -> n2 [label="true"]',
    'n1 -> n3 [label="false"]',
    'n0 -> n1 []',
    '',
    '',
    '',
    '}'];

let output6 = ['digraph G { ',
    'n0 [label="let toCheck = array[0] ;",shape="diamond",color="green"]',
    'n1 [label="toCheck !== 0",shape="diamond",color="green"]',
    'n2 [label="return true;",shape="rectangle"]',
    'n3 [label="return false;",shape="rectangle",color="green"]',
    'n1 -> n2 [label="true"]',
    'n1 -> n3 [label="false"]',
    'n0 -> n1 []',
    '',
    '',
    '',
    '}'];
let output3 = ['digraph G { ',
    'n0 [label="return array[0];",shape="rectangle",color="green"]',
    '',
    '',
    '',
    '}'];
describe('Transform test', () => {
    it('covert code with while to unmarked graph', () => {
        assert.deepEqual(transform_code_to_graph(code1, ''), output1);
    });
    it('covert code with while to fully marked graph', () => {
        assert.deepEqual(transform_code_to_graph(code1, '1,2,3'), output1_allMarked);
    });
    it('covert code with while to half marked graph', () => {
        assert.deepEqual(transform_code_to_graph(code1, '10,0,0'), output1_someMarked);
    });
    it('covert code with if to unmarked graph', () => {
        assert.deepEqual(transform_code_to_graph(code2, ''), output2);
    });
    it('covert code with if to marked graph', () => {
        assert.deepEqual(transform_code_to_graph(code2, '1,2,3'), outpt2_marked);
    });
    it('covert code that use array', () => {
        assert.deepEqual(transform_code_to_graph(code3, '[5,10,15]'), output3);
    });
    it('covert code that access to array', () => {
        assert.deepEqual(transform_code_to_graph(code4, '[5,10,15]'), output4);
    });
    it('covert code that access to array', () => {
        assert.deepEqual(transform_code_to_graph(code4, '[15,10,15]'), output5);
    });
    it('covert code that access to array', () => {
        assert.deepEqual(transform_code_to_graph(code5, '[0,10,15]'), output6);
    });
    it('covert code of one statement to graph of one statement', () => {
        assert.deepEqual(transform_code_to_graph(code6, '[0,10,15]'), output7);
    });


});
