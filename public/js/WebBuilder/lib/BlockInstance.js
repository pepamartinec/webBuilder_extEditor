Ext.define( 'WebBuilder.BlockInstance', {

	uses : [
		'WebBuilder.ConstantData',
		'WebBuilder.InheritedData'
	],

	statics : {
		idCounter : 0,

		genId : function()
		{
			return ( ++this.idCounter ).toString();
		}
	},

	id         : null,
	blockSetId : null,
	store      : null,
	parent     : null,
	block      : null,
	template   : null,
	slots      : null,
	data       : null,

	/**
	 * Constructor
	 *
	 * @param {Number} [id]
	 * @param {Number} [blockSetId]
	 * @param {WebBuilder.model.Block} [block]
	 * @param {WebBuilder.model.BlockTemplate} [template=null]
	 */
	constructor : function( id, blockSetId, block, template )
	{
		var me = this;

		// assign ID & block
		me.id         = id || ( 'blockInstance-'+ me.self.genId() );
		me.blockSetId = blockSetId;
		me.block      = block;

		// create data
		me.data = {};

		block.requires().each( function( dataRequirement ) {
			me.data[ dataRequirement.get('property') ] = null;
		});

		// assign template
		if( template ) {
			me.setTemplate( template );

		} else {
			me.setTemplate( block.templates().getAt(0) );
		}
	},

	/**
	 * Returns local instance ID
	 *
	 * @return {Number}
	 */
	getId : function()
	{
		return this.id;
	},

	/**
	 * Returns server-side instance ID
	 *
	 * @return {Number/Null}
	 */
	getPersistentId : function()
	{
		return Ext.isNumber( this.id ) ? this.id : null;
	},

	/**
	 * Checks whether the instance is locked
	 *
	 * @return {Boolean}
	 */
	isLocked : function()
	{
		return this.blockSetId !== null && this.store !== null && this.blockSetId != this.store.getBlockSetId();
	},

	/**
	 * Checks whether the instance is root
	 *
	 * @return {Boolean}
	 */
	isRoot : function()
	{
		return this.parent == null;
	},

	/**
	 * Checks whether the instance has undefined value
	 * at any mandatory config
	 *
	 * @return {Boolean}
	 */
	hasUndefinedConfig : function()
	{
		var config = this.block.get('config');

		if( ! config ) {
			return false;
		}

		var data               = this.data,
			hasUndefinedConfig = false;

		Ext.Object.each( config, function( name, def ) {
			if( def.required && data[ name ] == null ) {
				hasUndefinedConfig = true;
				return false;
			}
		});

		return hasUndefinedConfig;
	},

	/**
	 * Tries to solve block data dependencies
	 *
	 */
	solveDataDependencies : function()
	{
		var me     = this,
		    data = me.getData(),
		    property, value;

		me.block.requires().each( function( requiredProperty ) {
			property = requiredProperty.get('property');
			value    = data[ requiredProperty.get('property') ];

			// do not override constant data
			if( value instanceof WebBuilder.ConstantData ) {
				return;
			}

			// find provider
			data[ property ] = me.findDataProvider( requiredProperty.getId() );
		});

		me.setData( data );
	},

	/**
	 * Finds possible data provider in the instance parents
	 *
	 * @protected
	 * @param {Number} requiredPropertyID
	 * @return {WebBuilder.BlockInstance/Null}
	 */
	findDataProvider : function( requiredPropertyID )
	{
		var parent = this.parent,
		    provider;

		while( parent ) {
			provider = parent.block.provides().findRecord( 'requiredPropertyID', requiredPropertyID );

			if( provider ) {
				return Ext.create( 'WebBuilder.InheritedData', parent, provider.get('property') );
			}

			parent = parent.parent;
		}

		return null;
	},

	/**
	 * Start the store change transaction
	 *
	 * @protected
	 */
	storeChangeStart : function()
	{
		if( this.store ) {
			this.store.startChange();
		}
	},

	/**
	 * Commits the store change transaction
	 *
	 * @protected
	 * @param {String} [event]
	 * @param {Array} [args]
	 */
	storeChangeCommit : function( event, args )
	{
		if( this.store == null ) {
			return;
		}

		args = Array.prototype.slice.call( args, 0 );
		args.unshift( this );

		this.store[ 'on'+ Ext.String.capitalize( event ) ].apply( this.store, args );
		this.store.commitChange();
	},

	/**
	 * Adds the child instance
	 *
	 * @param {WebBuilder.BlockInstance} [instance]
	 * @param {String} [slotId]
	 * @param {Number} [position]
	 * @return {WebBuilder.BlockInstance}
	 */
	addChild : function( instance, slotId, position )
	{
		var me   = this,
		    slot = me.slots[ slotId ];

		if( slot == null ) {
			Ext.log({
				level : 'warn',
				msg   : '['+ me.$className +'][addChild] Invalid slot ID "'+ slotId +'".',
				dump  : me
			});

			return me;
		}

		me.storeChangeStart();

		// remove instance from its original parent first
		instance.remove();

		// insert instance into target slot
		if( Ext.isEmpty( position ) ) {
			slot.push( instance );

		} else {
			Ext.Array.insert( slot, position, [ instance ] );
		}

		// link self as parent
		instance.parent = me;

		// notify store
		me.storeChangeCommit( 'addChild', arguments );

		return me;
	},

	/**
	 * Removes the child instance
	 *
	 * @param {WebBuilder.BlockInstance} [instance]
	 * @return {WebBuilder.BlockInstance}
	 */
	removeChild : function( instance )
	{
		var me = this;

		me.storeChangeStart();

		var slotId      = null,
		    instanceIdx = -1;

		var Array = Ext.Array,
		    slots = me.slots,
		    slotInstances;

		// search for child in every slot
		for( slotId in slots ) {
			if( slots.hasOwnProperty( slotId ) === false ) {
				continue;
			}

			slotInstances = slots[ slotId ];
			instanceIdx   = Array.indexOf( slotInstances, instance );

			// child found
			if( instanceIdx !== -1 ) {
				Array.erase( slotInstances, instanceIdx, 1 );
				break;
			}
		}

		// child not found in any slot
		if( instanceIdx === -1 ) {
			Ext.log({
				level : 'warn',
				msg   : '['+ me.$className +'][removeChild] The child was not found within this node.',
				dump  : me
			});
		}

		// remove parent link
		instance.parent = null;

		// notify store
		me.storeChangeCommit( 'removeChild', [ instance, slotId, instanceIdx ] );

		return instance;
	},

	/**
	 * Removes self from the current parent
	 *
	 * @returns {WebBuilder.BlockInstance}
	 */
	remove : function()
	{
		var me = this;

		// remove self from parent
		if( me.parent ) {
			me.parent.removeChild( me );
		}

		return me;
	},

	/**
	 * Changes the instance template
	 *
	 * @param {WebBuilder.model.BlockTemplate} [template]
	 * @returns {WebBuilder.BlockInstance}
	 */
	setTemplate : function( template )
	{
		var me = this;

		if( template === me.template ) {
			return me;
		}

		me.storeChangeStart();

		var oldTemplate = me.template,
		    oldSlots    = me.slots || {};

		me.template = template;
		me.slots    = {};

		template.slots().each( function( slot ) {
			me.slots[ slot.get('codeName') ] = [];
		});

		Ext.Object.each( oldSlots, function( id, children ) {
			var codeName = id,
//			    oldSlot  = oldTemplate.slots().findRecord( 'codeName', codeName ),
			    newSlot  = template.slots().findRecord( 'codeName', codeName );

			// transfer children between equally named slots
			if( newSlot ) {
				me.slots[ newSlot.get('codeName') ] = children;

			// remove children of slots that name does not match
			// TODO is this the right way?
			// other options are
			//  - move to some (random) slot (only applicable when new template has some slots)
			//  - notify user and let him choose what to do (remove, assign somewhere else)
			//  - some advanced alg. to determine target slot
			} else {
				Ext.Array.forEach( children, function( instance ) {
					instance.remove();
				});
			}
		});

		// notify store
		me.storeChangeCommit( 'templateChange', [ oldTemplate, oldSlots ] );

		return me;
	},

	/**
	 * Changes the instance data
	 *
	 * @param {Object} data
	 * @returns {WebBuilder.BlockInstance}
	 */
	setData : function( data )
	{
		var me = this;

		me.storeChangeStart();

		var myData = me.data;
		for( var idx in data ) {
			if( data.hasOwnProperty( idx ) === false ) {
				continue;
			}

			if( myData.hasOwnProperty( idx ) === false ) {
				continue;
			}

			myData[ idx ] = data[ idx ];
		}

		// notify store
		me.storeChangeCommit( 'dataChange', arguments );

		return me;
	},

	/**
	 * Returns the instance data
	 *
	 * @returns {Object}
	 */
	getData : function()
	{
		return Ext.Object.merge( {}, this.data );
	}
});