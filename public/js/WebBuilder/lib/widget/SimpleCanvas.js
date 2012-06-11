Ext.define( 'WebBuilder.widget.SimpleCanvas', {
	extend : 'WebBuilder.widget.AbstractTemplateCanvas',

	initComponent : function()
	{
		var me = this;

		me.initInstanceTpl();
		me.initDocumentTpl();

		me.callParent();
	},

	initInstanceTpl : function()
	{
		var me = this,
		    tplDef, tpl, xTplDef;

		tplDef = [
				'<div id="template-block-instance-{id}" class="{blockCls}">',
					'<div class="{titleCls} {blockTitleCls}">',
					    '<span>{blockTitle} [{templateTitle}]</span>',
						'<div class="{blockToolsCls}">',
							'{% if( ! values.isLocked() ) { %}',
								'<div class="{blockToolCls} {configToolCls}"></div>',
							'{% } %}',
							'<div class="{blockToolCls} {removeToolCls}"></div>',
						'</div>',
					'</div>',
					'{% for( var codeName in values.slots ) { %}',
	 	     		'<div id="template-block-instance-{id}-slot-{[codeName]}" class="{slotCls}">',
		 				'<div class="{titleCls} {slotTitleCls}">{[codeName]}</div>',
		 				'{% for( var i = 0, l = values.slots[codeName].length; i < l; ++i ) { %}',
		 					'{[ this.apply( values.slots[codeName][i] ) ]}',
		 				'{% } %}',
		 			'</div>',
					'{% } %}',
				'</div>'
			];

		tpl = Ext.create( 'Ext.Template', tplDef );

		xTplDef = tpl.apply({
		    blockCls      : me.blockCls,
		    slotCls       : me.slotCls,
		    titleCls      : me.titleCls,
		    blockTitleCls : me.blockTitleCls,
		    slotTitleCls  : me.slotTitleCls,
		    blockToolsCls : me.blockToolsCls,
		    blockToolCls  : me.blockToolCls,
		    configToolCls : me.configToolCls,
		    removeToolCls : me.removeToolCls,

		    id            : '{id}',
		    codeName      : '{codeName}',
		    blockTitle    : '{block.data.title}',
		    templateTitle : '{template.data.title}'
		});

		me.instanceTpl = Ext.create( 'Ext.XTemplate', xTplDef );
	},

	initDocumentTpl : function()
	{
		var me = this;

		me.documentTpl = Ext.create( 'Ext.XTemplate',
			'<html>',
				'<head>',
					'<link rel="stylesheet" type="text/css" href="css/WebAdmin.css" />',
				'</head>',
				'<body>',
					'{[ this.renderInstance( values ) ]}',
				'</body>',
			'</html>',
			{
				renderInstance : Ext.Function.bind( me.instanceTpl.apply, me.instanceTpl )
			}
		);
	},

	/**
	 * Returns the template of given block instance
	 *
	 * @param {WebBuilder.BlockInstance} instance
	 * @return {Ext.Template}
	 */
	getInstanceTpl : function( instance )
	{
		return this.instanceTpl;
	},

	/**
	 * Returns the template of given block instance
	 *
	 * @param {WebBuilder.BlockInstance} instance
	 * @return {Ext.Template}
	 */
	getDocumentTpl : function( instance )
	{
		return this.documentTpl;
	}
});