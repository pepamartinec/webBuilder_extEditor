Ext.define( 'WebBuilder.widget.BlocksList',
{
	extend : 'Ext.container.Container',

	requires : [
		'Ext.layout.container.Accordion',
		'Ext.panel.Panel',
		'Ext.layout.container.Fit',
		'WebBuilder.widget.blocksList.CategoryView',
		'WebBuilder.model.BlocksCategory',
		'WebBuilder.widget.blocksList.DragZone'
	],

	/**
	 * @required
	 * @cfg {extAdmin.Module} module
	 */
	module : null,

	/**
	 * @required
	 * @cfg {Ext.data.Store} blocksStore
	 */
	blocksStore : null,

	/**
	 * @cfg {String} ddGroup
	 */
	ddGroup : undefined,

	componentCls : Ext.baseCSSPrefix+ 'blocks-list',

	/**
	 * Component initialization
	 *
	 */
	initComponent : function()
	{
		var me = this;

		Ext.apply( me, {
			layout : {
				type    : 'accordion',
				animate : true
			},

			items : []
		});

		me.callParent( arguments );

		/**
		 * @property {Ext.data.Store} categoriesStore
		 */
		me.categoriesStore = me.module.createStore({
			loadAction : 'loadBlocksCategories',
			model      : 'WebBuilder.model.BlocksCategory',

			remoteSort   : false,
			remoteFilter : false,
			autoLoad     : true,

			listeners : {
				scope  : me,
				single : true,
				load   : me.onCategoriesLoad
			}
		});
	},

	onRender : function()
	{
		var me = this;

		// init dragZone
		me.dragZone = Ext.create( 'WebBuilder.widget.blocksList.DragZone', me.getEl(), {
			ddGroup     : me.ddGroup,
			blocksStore : me.blocksStore
		});

		me.callParent( arguments );
	},

	/**
	 * Categories store 'load' event handler
	 *
	 * Bind refresh event & render view
	 *
	 * @private
	 * @param {Ext.data.Store} categoriesStore
	 * @param {WebBuilder.model.BlocksCategory[]} categories
	 */
	onCategoriesLoad : function( categoriesStore, categories )
	{
		var me = this;

		me.refreshPanels();

		me.mon( me.categoriesStore, 'refresh', me.refreshPanels, me );
		me.mon( me.blocksStore,     'refresh', me.refreshPanels, me );
	},

	/**
	 * Renders panels according to current categories & blocks
	 *
	 */
	refreshPanels : function()
	{
		var me = this;

		// remove current panels
		me.removeAll();

		// cancel refresh when one of stores is refreshing data
		if( me.categoriesStore.isLoading() || me.blocksStore.getCount() == 0 ) {
			return;
		}

		// group blocks by categories
		var blocksData = {};

		me.blocksStore.each( function( block ) {
			var categoryId = block.get('categoryID');

			if( blocksData[ categoryId ] == null ) {
				blocksData[ categoryId ] = [];
			}

			blocksData[ categoryId ].push( block.getData() );
		});

		// create panels with new data
		me.categoriesStore.each( function( category ) {
			var view = Ext.create( 'WebBuilder.widget.blocksList.CategoryView', {
				ddGroup : me.ddGroup,
				data    : blocksData[ category.getId() ] || []
			});

			var panel = Ext.create( 'Ext.panel.Panel', {
				layout : 'fit',
				title  : category.get('title'),
				items  : [ view ]
			});

			me.add( panel );
		});
	}
});