import $ from 'jquery';
import {transform_code_to_graph} from './code-analyzer';

import * as d3graphviz from 'd3-graphviz';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let args = $('#argumentsPlaceHolder').val();
        let toPrint = transform_code_to_graph(codeToParse , args);
        let str = '';
        toPrint.forEach ((line) => line !== ''? str = str + '\n' + line : line );
        d3graphviz.graphviz('#this').renderDot(str);
    });
});
