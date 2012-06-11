Ext.define( 'WebBuilder.widget.blocksList.DragZone', {
	extend : 'Ext.dd.DragZone',

	/**
	 * @required
	 * @cfg {Ext.data.Store} blocksStore
	 */
	blocksStore : null,

	blockIdRe : new RegExp( Ext.baseCSSPrefix +'template-block-(\\d+)' ),

	/**
	 * Returns data of the dragged item
	 *
	 * @param {Event} [e]
	 * @returns {Object}
	 */
	getDragData: function( e ) {
		var sourceDom = e.getTarget( '.'+ Ext.baseCSSPrefix +'template-block' );

		// not a valid block view
		if( sourceDom == null ) {
			return;
		}

		var match = sourceDom.className.match( this.blockIdRe ),
	        id    = match && parseInt( match[1] );

		// missing block id
		if( id == null || isNaN( id ) ) {
			Ext.log({
				level : 'warn',
				msg   : '['+ this.$className +'][getDragData] Dragged item matched sourceEl selector, but has no block id',
				dump  : sourceDom
			});
			return;
		}

		var block = this.blocksStore.getById( id );

		// invalid block id
		if( block == null ) {
			Ext.log({
				level : 'warn',
				msg   : '['+ this.$className +'][getDragData] Dragged item matched sourceEl selector, but has an invalid block id',
				dump  : sourceDom
			});
			return;
		}

		// create dragged ghost
		var d = sourceDom.cloneNode( true );
		    d.id = Ext.id();

		return {
			ddel     : d,
			block    : block,
			repairXY : Ext.fly( sourceDom ).getXY()
		};
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
