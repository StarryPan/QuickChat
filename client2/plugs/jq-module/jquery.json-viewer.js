define(["jquery"], function ($) {

	var jsonV = {

		render: function (elem, options) {

			if (!elem || elem == '' || elem == undefined) {

				alert('json可视化失败，elem为空！');
				return false;
			}

			// 初始化配置
			options = options || {
                withLinks: true,
                collapsed: false,
                withQuotes: true
            };

			let json_str = $(elem).attr('json-data');

			if (!json_str || json_str == null || json_str == '') {

				alert('json可视化失败，获取Json数据失败！');
				return false;
			}

			var json_data = [];

			try {
				json_data = eval('(' + json_str + ')');

			} catch (error) {

				return alert('解析Json字符串失败: ' + error);
			}

			/* jQuery chaining */
			return $(elem).each(function () {

				/* Transform to HTML */
				var html = jsonV.json2html(json_data, options);
				if (jsonV.isCollapsable(json_data))
					html = '<a href class="json-toggle"></a>' + html;

				/* Insert HTML in target DOM element */
				$(this).html(html);

				/* Bind click on toggle buttons */
				$(this).off('click');
				$(this).on('click', 'a.json-toggle', function () {
					var target = $(this).toggleClass('collapsed').siblings('ul.json-dict, ol.json-array');
					target.toggle();
					if (target.is(':visible')) {
						target.siblings('.json-placeholder').remove();
					} else {
						var count = target.children('li').length;
						var placeholder = count + (count > 1 ? ' items' : ' item');
						target.after('<a href class="json-placeholder">' + placeholder + '</a>');
					}
					return false;
				});

				/* Simulate click on toggle button when placeholder is clicked */
				$(this).on('click', 'a.json-placeholder', function () {
					$(this).siblings('a.json-toggle').click();
					return false;
				});

				if (options.collapsed == true) {
					/* Trigger click to collapse all nodes */
					$(this).find('a.json-toggle').click();
				}
			});
		},

		/**
		 * Transform a json object into html representation
		 * @return string
		 */
		json2html: function (json, options) {
			var html = '';
			if (typeof json === 'string') {
				/* Escape tags */
				json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
				if (this.isUrl(json))
					html += '<a href="' + json + '" class="json-string">' + json + '</a>';
				else
					html += '<span class="json-string">"' + json + '"</span>';
			} else if (typeof json === 'number') {
				html += '<span class="json-literal">' + json + '</span>';
			} else if (typeof json === 'boolean') {
				html += '<span class="json-literal">' + json + '</span>';
			} else if (json === null) {
				html += '<span class="json-literal">null</span>';
			} else if (json instanceof Array) {
				if (json.length > 0) {
					html += '[<ol class="json-array">';
					for (var i = 0; i < json.length; ++i) {
						html += '<li>';
						/* Add toggle button if item is collapsable */
						if (this.isCollapsable(json[i])) {
							html += '<a href class="json-toggle"></a>';
						}
						html += this.json2html(json[i], options);
						/* Add comma if item is not last */
						if (i < json.length - 1) {
							html += ',';
						}
						html += '</li>';
					}
					html += '</ol>]';
				} else {
					html += '[]';
				}
			} else if (typeof json === 'object') {
				var key_count = Object.keys(json).length;
				if (key_count > 0) {
					html += '{<ul class="json-dict">';
					for (var key in json) {
						if (json.hasOwnProperty(key)) {
							html += '<li>';
							var keyRepr = options.withQuotes ?
								'<span class="json-string">"' + key + '"</span>' : key;
							/* Add toggle button if item is collapsable */
							if (this.isCollapsable(json[key])) {
								html += '<a href class="json-toggle">' + keyRepr + '</a>';
							} else {
								html += keyRepr;
							}
							html += ': ' + this.json2html(json[key], options);
							/* Add comma if item is not last */
							if (--key_count > 0)
								html += ',';
							html += '</li>';
						}
					}
					html += '</ul>}';
				} else {
					html += '{}';
				}
			}
			return html;
		},
		/**
		 * Check if arg is either an array with at least 1 element, or a dict with at least 1 key
		 * @return boolean
		 */
		isCollapsable: function (arg) {
			return arg instanceof Object && Object.keys(arg).length > 0;
		},

		/**
		 * Check if a string represents a valid url
		 * @return boolean
		 */
		isUrl: function (string) {
			var regexp = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
			return regexp.test(string);
		}

	};

	return jsonV;
});