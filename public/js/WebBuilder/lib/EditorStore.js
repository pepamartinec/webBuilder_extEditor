Ext.define( 'WebBuilder.EditorStore', {
	requires : [ 'Ext.util.HashMap' ],

	uses : [
		'WebBuilder.BlockInstance',
		'WebBuilder.ConstantData',
		'WebBuilder.InheritedData'
	],

	mixins : {
		observable : 'Ext.util.Observable'
	},

	/**
	 * Instance of the block data store
	 *
	 * @cfg {Ext.data.Store} blockStore
	 */
	blockStore : null,

	/**
	 * The blockSet ID
	 *
	 * @cfg {Number} blockSetId
	 */
	blockSetId : null,

	/**
	 * Instances store
	 *
	 * @protected
	 * @property {Ext.util.HashMap} store
	 */
	store : null,

	/**
	 * Root instance
	 *
	 * @protected
	 * @property {WebBuilder.EditorStore.Instance} root
	 */
	root : null,

	/**
	 * @private
	 */
	suspendChangeEvt : 0,

// ====================== PUBLIC INTERFACE ====================== //

	/**
	 * Constructor
	 *
	 * @param {WebBuilder.EditorStore.Instance} rootInstance The root block instance
	 */
	constructor : function( config )
	{
		var me = this;

		me.blockStore = config.blockStore;

		me.mixins.observable.constructor.call( me, config );

		me.addEvents(
			'add',
			'remove',
			'templatechange',
			'datachange',
			'lockchange',
			'blocksetchange',
			'change'
		);

		me.store = Ext.create( 'Ext.util.HashMap' );
	},

	/**
	 * Sets the blockSet ID
	 *
	 * @param {Number} id
	 * @return {WebBuilder.component.TemplateEditor}
	 */
	setBlockSetId : function( id )
	{
		var me    = this,
		    oldId = me.blockSetId;

		me.startChange();

		me.blockSetId = id;

		me.fireEvent( 'blocksetchange', me, oldId, id );

		me.commitChange();

		// TODO implement the block instances 'lock' state change notification
		Ext.log({
			level : 'warn',
			msg   : '['+ me.$className +'][setBlockSetd] BlockSetId change notification is not implemented yet'
		});

		return me;
	},

	/**
	 * Returns the blockSet ID
	 *
	 * @returns {Number}
	 */
	getBlockSetId : function()
	{
		return this.blockSetId;
	},

	/**
	 * Removes all instances
	 *
	 * @return {WebBuilder.EditorStore} this
	 */
	clear : function()
	{
		return this.setRoot( null );
	},

	/**
	 * Returns the instance with given id.
	 *
	 * @param {String} [id]
	 * @returns {WebBuilder.EditorStore.Instance}
	 */
	get : function( id )
	{
		return this.store.get( id );
	},

	/**
	 * Returns the root instance.
	 *
	 * @returns {WebBuilder.EditorStore.Instance}
	 */
	getRoot : function()
	{
		return this.root;
	},

	/**
	 * Sets the instance as root
	 *
	 * @param {WebBuilder.EditorStore.Instance} [instance]
	 * @return {WebBuilder.EditorStore.Instance}
	 */
	setRoot : function( instance )
	{
		var me = this;

		// suspend change event
		// so clients do just bulk get 'change' notification
		me.startChange();

		// remove current root
		var oldRoot = me.root;

		me.clearInstances();

		if( oldRoot ) {
			// notify about removal
			me.fireEvent( 'remove', me, oldRoot, null, null, null );
		}

		if( instance ) {
			// remove new root from its original place
			instance.remove();

			// set new root
			me.root = instance;

			me.addInstance( instance );
			me.fireEvent( 'add', me, instance, null, null, null );
		}

		me.commitChange();

		return oldRoot;
	},

	/**
	 * Sets data sent from the server
	 *
	 * @param {Object} data
	 */
	setRequestData : function( data )
	{
		var me = this;

		// suspend the change event
		// so clients do just bulk get 'change' notification
		me.startChange();

		// create the block instances
		var instanceMap = {},
		    root        = me.setRequestData_createInstance( data, instanceMap );

		// setup the instance datas
		Ext.Object.each( instanceMap, me.setRequestData_setInstanceData, me );

		// save instances
		me.setRoot( root );

		me.commitChange();
	},

	/**
	 * @ignore
	 * @private
	 */
	setRequestData_createInstance : function( value, instanceMap )
	{
		if( value == null ) {
			return null;
		}

		var me    = this,
		    block = me.blockStore.getById( value.blockID );

		if( block == null ) {
			return null;
		}

		// create instance
		var instance = Ext.create( 'WebBuilder.BlockInstance', value.ID, value.blockSetID, block );

		// setup template
		var template = value.templateID && block.templates().getById( value.templateID );
		instance.setTemplate( template );

		// store data for later processing
		instanceMap[ instance.getId() ] = {
			instance : instance,
			data     : value.data
		};

		// create children
		if( value.slots ) {
			Ext.Object.each( value.slots, function( id, children ) {
				if( Ext.isIterable( children ) ) {
					Ext.Array.each( children, function( child, position ) {
						var childInstance = me.setRequestData_createInstance( child, instanceMap );

						instance.addChild( childInstance, id );
					});

				} else {
					Ext.Object.each( children, function( position, child ) {
						var childInstance = me.setRequestData_createInstance( child, instanceMap );

						instance.addChild( childInstance, id );
					});
				}
			});
		}

		return instance;
	},

	/**
	 * @ignore
	 * @private
	 */
	setRequestData_setInstanceData : function( instanceId, definition, instanceMap )
	{
		var instance = definition.instance,
		    data     = definition.data;

		// no data to setup
		if( data == null ) {
			return;
		}

		data = Ext.Object.map( data, function( property, value ) {
			if( Ext.isObject( value ) ) {
				var provider = instanceMap[ value['providerID'] ];

				if( provider == null ) {
					Ext.log({
						level : 'warn',
						msg   : 'Invalid data provider. Instance "'+ value['providerID'] +'" not found.'
					});

					return null;
				}

				return Ext.create( 'WebBuilder.InheritedData', property.instance, value['providerProperty'] );

			} else {
				return Ext.create( 'WebBuilder.ConstantData', value );
			}
		});

		instance.setData( data );
	},

	/**
	 * Returns the data
	 *
	 * @public
	 */
	getRequestData : function()
	{
	    return this.getRequestData_exportInstance( this.getRoot() );
	},

	/**
	 * @ignore
	 * @private
	 */
	getRequestData_exportInstance : function( instance )
	{
		if( instance == null ) {
			return null;
		}

		return {
			ID         : instance.getPersistentId(),
			tmpID      : instance.getId(),
			blockSetID : instance.blockSetId,
			blockID    : instance.block.getId(),
			data       : Ext.Object.map( instance.data, this.getRequestData_exportInstanceData, this ),
			templateID : instance.template && instance.template.getId(),
			slots      : instance.slots    && Ext.Object.map( instance.slots, this.getRequestData_exportInstanceSlot, this )
		};
	},

	/**
	 * @ignore
	 * @private
	 */
	getRequestData_exportInstanceData : function( property, data )
	{
		if( data instanceof WebBuilder.ConstantData ) {
			return data.getValue();

		} else if( data instanceof WebBuilder.InheritedData ) {
			return {
				providerID       : data.getProvider().getId(),
				providerProperty : data.getProperty()
			};

		} else {
			Ext.log({
				level : 'warn',
				msg   : '['+ this.$className +'][getRequestData] Invalid data "'+ data + '" for property "'+ property +'"'
			});

			return null;
		}
	},

	/**
	 * @ignore
	 * @private
	 */
	getRequestData_exportInstanceSlot : function( name, children )
	{
		return Ext.Array.map( children, this.getRequestData_exportInstance, this );
	},

// ====================== INNER MANIPULATION METHODS ====================== //

	/**
	 * Adds the instance and all its children.
	 *
	 * @protected
	 * @param {WebBuilder.EditorStore.Instance}
	 */
	addInstance : function( instance )
	{
		var me    = this,
		    store = me.store,
		    id    = instance.id;

		// add instance to store
		if( store.containsKey( id ) == false ) {
			store.add( id, instance );

		} else {
			Ext.log({
				level : 'warn',
				msg   : '['+ me.$className +'][addInstance] Instance is already present in this store',
				dump  : {
					store    : me,
					instance : instance
				}
			});
		}

		instance.store = me;

		// setup the instance blockSet
		if( instance.blockSetId == null ) {
			instance.blockSetId = me.blockSetId;
		}

		// solve the child data dependencies
		instance.solveDataDependencies();

		// add all instance children
		if( instance.slots != null ) {
			Ext.Object.each( instance.slots, me.addInstance_walkSlots, me );
		}
	},

	/**
	 * @ignore
	 */
	addInstance_walkSlots : function( slotId, slotItems ) {
		Ext.Array.forEach( slotItems, this.addInstance, this );
	},

	/**
	 * Removes the instance and all its children.
	 *
	 * @protected
	 * @param {WebBuilder.EditorStore.Instance}
	 */
	removeInstance : function( instance )
	{
		// remove children from store
		if( instance.slots ) {
			Ext.Object.each( instance.slots, this.removeInstance_walkSlot, this );
		}

		instance.store = null;

		// remove instance from store
		this.store.removeAtKey( instance.id );
	},

	/**
	 * @ignore
	 */
	removeInstance_walkSlot : function( name, children )
	{
		Ext.Array.forEach( children, this.removeInstance, this );
	},

	/**
	 * Removes all instances
	 *
	 * @protected
	 */
	clearInstances : function()
	{
		var me    = this,
		    store = me.store;

		// remove existing data
		if( me.root ) {
			me.removeInstance( me.root );

			me.root = null;
		}

		// check for orphaned instances
		if( store.getCount() > 0 ) {
			// this should never happen, because all instances
			// should be somewhere under the root and already
			// be removed with it

			// <debug>
				Ext.log({
					level : 'warn',
					msg   : '['+ me.$className +'][clear] Store contains orphaned instance.',
					store : store
				});
			// </debug>

			// remove orphaned instances one by one
			store.each( function( id, instance ) {
				me.removeInstance( instance );
			});
		}
	},

// ====================== INSTANCES NOTIFICATION INTERFACE ====================== //

	startChange : function()
	{
		++this.suspendChangeEvt;
	},

	commitChange : function()
	{
		--this.suspendChangeEvt;

		if( this.suspendChangeEvt === 0 ) {
			this.fireEvent( 'change', this );
		}
	},

	onAddChild : function( instance, child, slotId, position )
	{
		var me = this;

		// add to the store (including all children)
		me.addInstance( child );

		// notify about addition
		me.fireEvent( 'add', me, child, instance, slotId, position );
	},

	onRemoveChild : function( instance, child, slotId, position )
	{
		var me = this;

		// remove from store (including all children)
		me.removeInstance( child );

		// notify about removal
		me.fireEvent( 'remove', me, child, instance, slotId, position );
	},

	onTemplateChange : function( instance, oldTemplate )
	{
		this.fireEvent( 'templatechange', this, instance, oldTemplate );
	},

	onDataChange : function( instance, data )
	{
		this.fireEvent( 'datachange', this, instance, Ext.Object.getKeys( data ) );
	}
});