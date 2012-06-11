Ext.define( 'WebBuilder.widget.blocksList.CategoryView',
{
	extend : 'Ext.view.View',

	/**
	 * @required
	 * @cfg {Ext.data.Store} store
	 */
	data : null,

	itemSelector : Ext.baseCSSPrefix +'template-block',

	autoScroll : true,

	tpl : [
		'<tpl for=".">',
			'<div class="', Ext.baseCSSPrefix ,'template-block ', Ext.baseCSSPrefix ,'template-block-{ID}">',
				'<span class="', Ext.baseCSSPrefix ,'icon i-{[ this.getIconCls( values) ]}"></span>',
				'{[ values.title || values.codeName ]}',
			'</div>',
		'</tpl>',
		{
			getIconCls : function( block ) {
				return Ext.String.uncapitalize( block.codeName.split('\\').pop() );
			}
		}
	]
});