import * as esprima from 'esprima';
import * as esgraph from 'esgraph';
import * as escodegen from 'escodegen';
// import {build_map} from './symbolic-substitution';


const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse, {range: true});
};
const transform_code_to_graph = (codeToParse, args) => {
    let parsedCode = parseCode(codeToParse);
    let cfg = esgraph(parsedCode.body[0].body);
    cfg[2] = remove_entry_and_exit(cfg[2]);
    let dot_as_code = esgraph.dot(cfg, {counter: 0, source: codeToParse});
    dot_as_code = remove_last_node(dot_as_code, cfg[2].length);
    let dot_as_type = esgraph.dot(cfg);
    dot_as_code = connect_missing_vertices(cfg[2], dot_as_code);
    dot_as_code = design_shape_by_type(dot_as_code, dot_as_type, cfg[2].length);
    if (args === '') {
        let res = 'digraph G { \n' + dot_as_code + '\n}';
        return res.split('\n');
    } else {
        let map_param_with_arg = build_map(parsedCode.body[0], parseCode('[' + args + ']')); //first arg - func ast , second - ast of list of arguments.
        dot_as_code = mark_nodes(cfg[2], dot_as_code, map_param_with_arg);
        let res = 'digraph G { \n' + dot_as_code + '\n}';
        return res.split('\n');
    }
};


const remove_last_node = (dot_as_code, num_of_nodes) => {
    let dot_as_array = dot_as_code.split('\n');
    dot_as_array.splice(dot_as_array.length - 2, 2);
    let str = '';
    let vertices_list = dot_as_array.slice(num_of_nodes);
    let nodes_list = dot_as_array.slice(0, num_of_nodes);
    vertices_list.forEach((vertice) => vertice.endsWith('n-1 []') ? vertices_list.splice(vertices_list.indexOf(vertice), 1) : vertices_list);
    nodes_list.forEach((line) => str = str + line + '\n');
    vertices_list.forEach((line) => str = str + line + '\n');
    return str;
};
const mark_nodes = (nodes_hierarchy, graph, map_param_with_arg) => {
    let graph_as_array = graph.split('\n');
    let res = mark_rec(nodes_hierarchy, nodes_hierarchy[0], graph_as_array, map_param_with_arg);
    let output = '';
    res.forEach((line) => output = output + line + '\n');
    return output;
};
const mark_rec = (nodes_hierarchy, current_node, graph_as_array, map_param_with_arg) => {
    let newMap = map_param_with_arg;
    mark_green(graph_as_array, nodes_hierarchy.indexOf(current_node));
    if (current_node.astNode.type === 'VariableDeclaration') {
        current_node.astNode.declarations.forEach((decl) => newMap[decl.id.name] = eval(substitute(decl.init, newMap).toString()));
        if (his_parent_is_while(current_node)) {
            return mark_rec(nodes_hierarchy, current_node.next[(current_node.next.indexOf(current_node.true) + 1) % 2], graph_as_array, map_param_with_arg);
        } else {
            graph_as_array = mark_rec(nodes_hierarchy, current_node.next[0], graph_as_array, newMap);
            return graph_as_array;
        }
    } else if (current_node.astNode.type === 'ReturnStatement') {
        return graph_as_array;
    } else {
        graph_as_array = normal_node_mark(nodes_hierarchy, current_node, graph_as_array, newMap);
        return graph_as_array;
    }
};
const normal_node_mark = (nodes_hierarchy, current_node, graph_as_array, map_param_with_arg) => {
    if (his_parent_is_while(current_node))
        return graph_as_array;
    else if (current_node.parent.type === 'WhileStatement') {
        return while_mark(nodes_hierarchy, current_node, graph_as_array, map_param_with_arg);
    } else if (current_node.parent.type === 'IfStatement') {
        let replaced_string = replace_params(escodegen.generate(current_node.astNode), map_param_with_arg);
        if (eval(replaced_string)) {
            return mark_rec(nodes_hierarchy, current_node.true, graph_as_array, map_param_with_arg);
        } else
            return mark_rec(nodes_hierarchy, current_node.next[(current_node.next.indexOf(current_node.true) + 1) % 2], graph_as_array, map_param_with_arg);
    } else
        return mark_rec(nodes_hierarchy, current_node.next[0], graph_as_array, map_param_with_arg);
};
const while_mark = (nodes_hierarchy, current_node, graph_as_array, map_param_with_arg) => {
    let cond_as_string = escodegen.generate(current_node.astNode);
    let replaced_string = replace_params(cond_as_string, map_param_with_arg);
    if (eval(replaced_string)) {
        graph_as_array = mark_rec(nodes_hierarchy, current_node.true, graph_as_array, map_param_with_arg);
        return mark_rec(nodes_hierarchy, current_node.next[(current_node.next.indexOf(current_node.true) + 1) % 2], graph_as_array, map_param_with_arg);
    } else {
        return mark_rec(nodes_hierarchy, current_node.next[(current_node.next.indexOf(current_node.true) + 1) % 2], graph_as_array, map_param_with_arg);
    }
};

const his_parent_is_while = (current_node) => {
    return current_node.next[0].parent.type === 'WhileStatement';
};

const substitute = (expr, table) => {
    let types = [Identifier_handler, BinaryExpression_handler, MemberExpression_handler];
    let types_names = ['Identifier', 'BinaryExpression', 'MemberExpression'];
    if (expr.type === 'Literal') {
        return expr.raw;
    } else {
        return (types[types_names.indexOf(expr.type)])(expr, table);
    }
};
const MemberExpression_handler = (expr, table) => {
    let array_name = expr.object.name;
    // let array_as_string = escodegen(table[array_name]);
    let index = substitute(expr.property);
    return table[array_name + '[' + index + ']'];
    // let array = array_as_string.toString().substring(1, array_as_string.toString().length - 1).split(',');
    // return array[index];

};
const BinaryExpression_handler = (expr, table) => {
    return substitute(expr.left, table) + ' ' + expr.operator + ' ' + substitute(expr.left, table);
};
const Identifier_handler = (expr, table) => {
    return table[expr.name];

};
const replace_params = (aString, params_and_args) => {
    let words = aString.split(' ');
    words = words.map((word) => params_and_args[word] !== undefined ? params_and_args[word] : word);
    let output = ' ';
    words.forEach((word) => output = output + ' ' + word);
    return output;
};
const mark_green = (graph_as_array, index) => {
    let splited = graph_as_array[index].split(',');
    splited[splited.length - 1] = splited[splited.length - 1].substring(0, splited[splited.length - 1].length - 1) + ',color="green"]';
    let edited_node = splited[0];
    splited.slice(1).forEach((part) => edited_node = edited_node + ',' + part);
    graph_as_array[index] = edited_node;
};
const build_map = (func_code, list_of_args) => {
    let returned_map = {};
    let params_names = func_code.params.map((parameter_ast) => parameter_ast.name);
    let the_list = list_of_args.body[0].expression.elements;
    let current_index = 0;
    the_list.forEach((arg) => {
        if (arg.type === 'ArrayExpression') {
            for (let i = 0; i < arg.elements.length; i++) {
                let name_in_map = params_names[current_index] + '[' + i + ']';
                returned_map[name_in_map] = escodegen.generate(arg.elements[i]);
            }
        } else {
            returned_map[params_names[current_index]] = escodegen.generate(the_list[the_list.indexOf(arg)]);
        }
        current_index++;
    });
    return returned_map;
};

const connect_missing_vertices = (nodes, graph) => {
    let graph_as_array = graph.split('\n');
    let vertices_array = graph_as_array.slice(nodes.length + 1, graph_as_array.length - 1);
    let connections_between_nodes = [];
    vertices_array.forEach((element) => connections_between_nodes.push((element.split('['))[0]));
    let toReturn = '';
    graph_as_array.forEach((element) => toReturn = toReturn + element + '\n');
    return toReturn;
};
const design_shape_by_type = (dot_as_code, dot_as_type, numOfVertices) => {
    let code = dot_as_code.split('\n');
    let edges_array = code.slice(numOfVertices + 1);
    code = code.slice(0, numOfVertices);
    let expr_type = dot_as_type.split('\n');
    expr_type = expr_type.slice(0, numOfVertices);
    for (let i = 0; i < expr_type.length; i++) {
        let spliced_def_and_atrCode = (code[i]).substr(3);
        let spliced_def_and_atrType = (expr_type[i]).substr(3);
        let type = (spliced_def_and_atrType.split('='))[1];
        let label_def = spliced_def_and_atrCode.substr(0, spliced_def_and_atrCode.length - 1);
        if (type.endsWith('Statement"]'))
            code[i] = label_def + ',shape="rectangle"]';
        else
            code[i] = label_def + ',shape="diamond"]';
    }
    edges_array[edges_array.length - 2] = 'n0 -> n1 []'; //fix an edge.
    return build_str_of_dot(edges_array, code);
};
const build_str_of_dot = (edges_array, code) => {
    let str = '';
    for (let i = 0; i < code.length; i++) {
        str = str + 'n' + i.toString() + ' ' + code[i] + '\n';
    }
    for (let i = 0; i < edges_array.length; i++) {
        str = str + edges_array[i] + '\n';
    }
    return str;
};
const remove_entry_and_exit = (nodes_list) => {
    nodes_list = nodes_list.slice(1, nodes_list.length - 1); //remove entry and exit nodes.
    nodes_list.forEach((node) => node.exception = null);
    nodes_list[nodes_list.length - 1].next = null; //remove line between return and exit
    nodes_list.forEach((node) => (node.next !== null && node.next[0].type === 'exit') ? node.next = node.next.slice(1) : node.next);
    return nodes_list;
};

export {transform_code_to_graph};
