Ext.define( 'WebBuilder.widget.templateCanvas.DragZone', {
	extend : 'Ext.dd.DragZone',

	/**
	 * ClassName of block nodes
	 *
	 * @required
	 * @cfg {String} blockCls
	 */
	blockCls : null,

	/**
	 * ClassName of block title node
	 *
	 * @required
	 * @cfg {String} blockTitleCls
	 */
	blockTitleCls : null,

	/**
	 * ClassName applied on dragged node
	 *
	 * @cfg {String} dragCls
	 */
	dragCls : null,

	/**
	 * Returns data of dragged block
	 *
	 * @param {Event} [e]
	 * @returns {Object}
	 */
	getDragData: function( e )
	{
		var sourceDom = e.getTarget( '.'+ this.blockTitleCls );

		if( sourceDom ) {
			var blockDom = Ext.fly( sourceDom ).findParent( '.'+ this.blockCls ),
			    blockEl  = Ext.fly( blockDom );

			// mark block as dragged
			if( this.dragCls ) {
				blockEl.addCls( this.dragCls );
			}

			var ddel = blockDom.cloneNode( true );
			ddel.id = Ext.id();

			return {
				ddel     : ddel,
				blockDom : blockDom,
				repairXY : blockEl.getXY()
			};
		}
	},

	/**
	 * Drag end handler
	 *
	 * @param {Event} [e]
	 */
	endDrag : function( e )
	{
		// remove drag mark
		if( this.dragCls ) {
			Ext.fly( this.dragData.blockDom ).removeCls( this.dragCls );
		}
	},

	/**
	 * Returns repair position
	 *
	 * @returns {Array}
	 */
	getRepairXY : function()
	{
		return this.dragData.repairXY;
	}
});
