Ext.define( 'WebBuilder.component.TemplateEditor',
{
	extend : 'Ext.container.Container',
	alias  : 'widget.templateeditor',

	mixins : {
		field : 'Ext.form.field.Field'
	},

	requires : [
		'Ext.layout.container.Border',
		'WebBuilder.widget.BlocksList',
		'WebBuilder.widget.SimpleCanvas',
		'WebBuilder.widget.RealCanvas',

		'WebBuilder.EditorStore',
		'extAdmin.Store',
		'WebBuilder.BlockInstance',
		'WebBuilder.model.Block'
	],

	uses : [
		'Ext.JSON',
		'extAdmin.patch.ExtObjectMap'
	],

	/**
	 * @required
	 * @cfg {extAdmin.Environment} env
	 */
	env : null,

	/**
	 * @cfg {extAdmin.Module/String} module
	 */
	module : '\\WebBuilder\\Administration\\TemplateManager\\TemplateEditor',

	/**
	 * @cfg {Array/String} blocksLoadAction
	 */
	blocksLoadAction : null,

	/**
	 * @cfg {Number} blockSetId
	 */
	blockSetId : null,

	/**
	 * Editor initialization
	 *
	 */
	initComponent : function()
	{
		var me = this;

		me.module = me.env.getModule( me.module );

		me.initStores();

		// init internal components
		var ddGroup = me.getId();

		me.list = Ext.create( 'WebBuilder.widget.BlocksList', {
			region      : 'east',
			split       : true,
			collapsible : true,
			width       : 150,

			module      : me.module,
			ddGroup     : ddGroup,
			blocksStore : me.blocksStore
		});

		me.canvas = Ext.create( 'WebBuilder.widget.RealCanvas', {
			region : 'center',

			module         : me.module,
			ddGroup        : ddGroup,
			instancesStore : me.instancesStore
		});

		Ext.apply( me, {
			layout : 'border',
			items  : [ me.canvas, me.list ]
		});

		me.callParent( arguments );
		me.initField();
	},

	initStores : function( cb, cbScope )
	{
		var me = this;

		me.blocksStore = extAdmin.Store.create({
			env        : me.env,
			loadAction : [ me.module.name, 'loadBlocks' ],
			model      : 'WebBuilder.model.Block',

			remoteSort   : false,
			remoteFilter : false,
			autoLoad     : true,

			listeners : {
				scope : me,
				load  : me.onBlocksLoad
			}
		});

		if( me.blockSetId == null ) {
			Ext.log({
				level : 'warn',
				msg   : '['+ me.$className +'] No blockSetId set.'
			});
		}

		me.instancesStore = Ext.create( 'WebBuilder.EditorStore', {
			blockStore : me.blocksStore,
			blockSetId : me.blockSetId,

			listeners : {
				scope  : me,
				change : me.handleInstancesStoreChange
			}
		});

		delete me.blockSetId;
	},

	/**
	 * Blocks store data load handler
	 *
	 * Initializes the real field value. This must be done after the blocks store load,
	 * so we have all the data for instances creation.
	 *
	 * @param {Ext.data.Store} [blocksStore]
	 * @param {WebBuilder.model.Block[]} [blocks]
	 */
	onBlocksLoad : function( blocksStore, blocks )
	{
		var me    = this,
		    value = me.getValue();

		// init real field value
		// this must be done after block load
		// so we have all data for instances creation

		if( value == null ) {
			me.clear();

		} else {
			me.setValue( value );
		}
	},

	/**
	 * Refreshes the field value with current instances store content
	 *
	 * @protected
	 */
	handleInstancesStoreChange : function()
	{
		var me    = this,
		    value = me.instancesStore.getRequestData();

		me.mixins.field.setValue.call( me, value );
	},

	/**
	 * Sets a data value into the field and runs the change detection and validation.
	 *
	 * @param {Object} value The value to set
	 * @return {WebBuilder.component.TemplateEditor} this
	 */
	setValue : function( value )
	{
		var me = this;

		// blocks store is not inited yet
		// just the value as the inner field value
		if( me.blocksStore.isLoading() === true ) {
			return me.mixins.field.setValue.apply( me, arguments );
		}

		// set the value to the instances store
		// it updates its internal values and
		// thru the 'change' event changes the local
		// inner field value
		me.instancesStore.setRequestData( value );

		return this;
	},

	/**
	 * Returns whether two field {@link #getValue values} are logically equal.
	 *
	 * @param {Object} value1 The first value to compare
	 * @param {Object} value2 The second value to compare
	 * @return {Boolean} True if the values are equal, false if inequal.
	 */
	isEqual: function( value1, value2 )
	{
		return false;

		// JSON can not be used anymore, because the instance data dependencies can create circular references
		// return Ext.JSON.encode( value1 ) === Ext.JSON.encode( value2 );
	},

	/**
	 * Returns the parameter(s) that would be included in a standard form submit for this field.
	 *
	 * @return {Object} A mapping of submit parameter names to values. It can also return null
	 * if there are no parameters to be submitted.
	 */
	getSubmitData: function()
	{
		// <debug>
			Ext.Error.raise({
				msg : '[WebBuilder.component.TemplateEditor][getSubmitData] has no default implementation, '+
				      'because it returns structured data. Please create your own implementation or use getModelData instead',
				templateEditor : this
			});
		// </debug>

		return null;
	},

	/**
	 * Sets the blockSet ID
	 *
	 * @param {Number} id
	 * @return {WebBuilder.component.TemplateEditor}
	 */
	setBlockSetId : function( id )
	{
		this.instancesStore.setBlockSetId( id );
		return this;
	},

	/**
	 * Returns the blockSet ID
	 *
	 * @returns {Number}
	 */
	getBlockSetId : function()
	{
		return this.instancesStore.getBlockSetId();
	},

	/**
	 * Clear current template content
	 *
	 * @return {WebBuilder.component.TemplateEditor}
	 */
	clear : function()
	{
		var me       = this,
		    block    = me.blocksStore.findRecord( 'codeName', '\\WebBuilder\\Blocks\\Core\\WebPage' ),
		    template = block.templates().first();

		me.setValue({
			blockID    : block.getId(),
			templateID : template.getId()
		});
	}
});