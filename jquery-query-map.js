(function ($) {
  /*
    Query.

    * The comparison operator is stuffed in the operands list because the CSS is beyond me.

    %ol.root

      %li.connective
        .control
        .expression
          .operator
          %ol
            %li.comparison
            %li.comparison
            %li.connective

      %li.comparison
        .control
        .expression
          %ol
            %li.field
            %li.operator
            %li.value
  */

  $.fn.query_map = function (options) {
    if (options.conditions == null || options.conditions == '') delete options.conditions;
    var blank = {comparison: {}, connective: {}};
    blank.comparison = {field: options.fields[0], comparison: options.comparisons[0], value: ''};
    blank.connective[options.connectives[0]] = [blank.comparison];
    options = $.extend({blank: blank, conditions: blank.connective}, options);

    return this.each(function () {
      var builder = $(this);
      var root    = $('<ol />').addClass('root');
      root.append.apply(root, operator(options));
      builder.append(root);
    });

    // TODO: There is probably a better way of building this in jQuery?
    function select(options) {
      var select = $('<select />');
      $.each(options, function (i, option) {
        select.append($('<option />').text(option));
      });
      return select;
    }

    // Connective or comparison.
    function operator (options) {
      var expression = connective(options);
      return expression.length > 0 ? expression : comparison(options);
    }

    function connective (options) {
      return $.map(options.connectives, function (name) {
        if (!options.conditions[name]) return;

        var op = $('<div />')
          .addClass('operator')
          .append(select(options.connectives).val(name), ' of the following rules:');

        var operands = $('<ol />').addClass('operands');
        $.each(options.conditions[name], function (i, condition) {
          operands.append.apply(operands, operator($.extend(options, {conditions: condition})));
        });

        var expression = $('<div />').addClass('expression').append(op, operands);
        return $('<li />').addClass('connective').append(control(options), expression);
      });
    }

    function comparison (options) {
      var conditions = options.conditions || {};
      var field      = $('<li />').addClass('field').append(select(options.fields).val(conditions.field));
      var operator   = $('<li />').addClass('operator').append(select(options.comparisons).val(conditions.comparison));
      var value      = $('<li />').addClass('value').append($('<input />').attr({type: 'text'}).val(conditions.value));
      var expression = $('<div />').addClass('expression').append($('<ol />').append(field, operator, value));
      return [$('<li />').addClass('comparison').append(control(options), expression)];
    }

    // TODO:
    // You can't remove the last condition in an connective.
    // You can't remove the root connective.
    function control (options) {
      var add = $('<button />').attr({type: 'button'}).text('+').click(function () {
        var comparison = operator($.extend(options, {conditions: options.blank.comparison}));
        var sibling    = $(this).closest('li');
        sibling.after.apply(sibling, comparison);
        return false;
      });
      var del = $('<button />').attr({type: 'button'}).text('-').click(function () {
        $(this).closest('li').remove();
        return false;
      });
      var sub = $('<button />').attr({type: 'button'}).text('…').click(function () {
        var connective = operator($.extend(options, {conditions: options.blank.connective}));
        var sibling    = $(this).closest('li');
        sibling.after.apply(sibling, connective);
        return false;
      });
      return $('<div />').addClass('control').append(add, del, sub);
    }
  };

  $.query_map = {
    create: function (builder, options) {
      return builder.query_map(options);
    },

    to_json: function (builder) {
      var conditions = {};
      var operands   = [];
      var connective = builder.is('.connective') ? builder : $(builder.find('.connective').get(0));

      connective.find('> .expression > ol > li').each(function () {
        var op = $(this);
        if (op.is('.connective')) {
          operands.push($.query_map.to_json(op));
        }
        else if (op.is('.comparison')) {
          operands.push({
            field:      op.find('.field select').val(),
            comparison: op.find('.operator select').val(),
            value:      op.find('.value input').val()
          });
        }
      })

      conditions[connective.find('> .expression > .operator select').val()] = operands;
      return conditions;
    }
  };
})(jQuery);
