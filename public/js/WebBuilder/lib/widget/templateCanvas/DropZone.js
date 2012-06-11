Ext.define( 'WebBuilder.widget.templateCanvas.DropZone', {
	extend : 'Ext.dd.DropZone',

	/**
	 * @cfg {WebBuilder.EditorStore} instancesStore
	 */
	instancesStore : null,

	/**
	 * ClassName of block nodes
	 *
	 * @required
	 * @cfg {String} blockCls
	 */
	blockCls : null,

	/**
	 * ClassName of slot nodes
	 *
	 * @required
	 * @cfg {String} slotCls
	 */
	slotCls : null,

	/**
	 * Slot highlight className
	 *
	 * @required
	 * @cfg {String} overCls
	 */
	overCls : null,

	/**
	 * Block instance id regexp
	 *
	 * @required
	 * @cfg {RegExp} instanceIdRe
	 */
	instanceIdRe : null,

	/**
	 * Slot id regexp
	 *
	 * @required
	 * @cfg {RegExp} slotIdRe
	 */
	slotIdRe : null,

	/**
	 * Drop position pointer DOM node
	 *
	 * @property {HTMLElement} insertPtrDom
	 */
	insertPtrDom : null,

	/**
	 * Constructor
	 *
	 * @param {Object} [config]
	 */
	constructor : function( config )
	{
		var me = this;

		me.callParent( arguments );

		me.insertPtrDom = Ext.DomHelper.createDom({
			tag : 'hr',
	    	cls : Ext.baseCSSPrefix +'insert-pointer'
		});

		me.lastDropBefore = null;
		me.lastDropParent = null;
	},

	/**
	 * Returns valid drop target (if exists)
	 *
	 * @param {Ext.EventObject} [e]
	 * @returns {HTMLElement}
	 */
	getTargetFromEvent : function( e )
	{
//		return Ext.fly( e.target ).hasCls( this.slotCls ) ? e.target : null;

		var me = this;

		if( e.target == me.insertPtrDom ) {
			return me.lastDropParent;

		} else {
			return e.getTarget( '.'+ me.slotCls );
		}



		var blockCls = '.'+ this.blockCls,
		    slotCls  = '.'+ this.slotCls,
		    target = e.target;

		// walk the DOM up and find drop target
		while( target ) {
			// drop inside of the slot
			if( Ext.DomQuery.is( target, slotCls ) ) {
				break;

			// drop outside of the slot
			} else if( Ext.DomQuery.is( target, blockCls ) ) {
				return false;
			}

			target = target.parentNode;
		}

		return target || false;
	},

	/**
	 * Slot mouseenter event handler
	 *
	 * @param {HTMLElement} [slotDom]
	 * @param {Ext.dd.DragSource} [dragSource]
	 * @param {Event} [e]
	 * @param {Object} [data]
	 */
	onNodeEnter : function( slotDom, dragSource, e, data )
	{
		// highlight entered slot
		Ext.fly( slotDom ).addCls( this.overCls );
	},

	/**
	 * Slot mouseover event handler
	 *
	 * @param {HTMLElement} [slotDom]
	 * @param {Ext.dd.DragSource} [dragSource]
	 * @param {Event} [e]
	 * @param {Object} [data]
	 * @returns {String}
	 */
	onNodeOver : function( slotDom, dragSource, e, data )
	{
		var me = this;

		// check for the locked slot
		if( Ext.fly( slotDom ).hasCls( 'x-locked' ) ) {
			return Ext.dd.DropZone.prototype.dropNotAllowed;
		}

		// check for the drop inside self
		if( data.blockDom ) {
			var blockDom = data.blockDom,
			    parent   = slotDom.parentNode;

			while( parent ) {
				if( parent == blockDom ) {
					return Ext.dd.DropZone.prototype.dropNotAllowed;
				}

				parent = parent.parentNode;
			}
		}

		// put drop position pointer
		var insertBefore = slotDom.firstChild,
		    y = e.innerXY[1]; // use iFrame inner coordinates

		while( insertBefore ) {
			// skip any non-block child
			if( Ext.fly( insertBefore ).hasCls( me.blockCls ) ) {
				var top    = insertBefore.offsetTop,
				    parent = insertBefore.offsetParent;

				while( parent ) {
					top   += parent.offsetTop;
					parent = parent.offsetParent;
				}

				if( top + ( insertBefore.clientHeight / 2 ) > y ) {
					break;
				}
			}

			insertBefore = insertBefore.nextSibling;
		}

		me.lastDropParent = slotDom;

		if( insertBefore ) {
			slotDom.insertBefore( me.insertPtrDom, insertBefore );

			me.lastDropBefore = insertBefore;

		} else {
			slotDom.appendChild( me.insertPtrDom );

			me.lastDropBefore = null;
		}


		return Ext.dd.DropZone.prototype.dropAllowed;
	},

	/**
	 * Slot mouseout event handler
	 *
	 * @param {HTMLElement} [slotDom]
	 * @param {Ext.dd.DragSource} [dragSource]
	 * @param {Event} [e]
	 * @param {Object} [data]
	 */
	onNodeOut : function( slotDom, dragSource, e, data )
	{
		var me = this;

		// remove slot highlight
		Ext.fly( slotDom ).removeCls( me.overCls );

		// remove drop position pointer
		if( me.insertPtrDom.parentNode == slotDom ) {
			slotDom.removeChild( me.insertPtrDom );
		}
	},

	/**
	 * Returns the block instance represented by the DOM node.
	 *
	 * @param {HTMLElement} [domNode]
	 * @returns {WebBuilder.BlockInstance}
	 */
	getBlockInstance : function( domNode )
	{
		// find parent block
		var parentDom = Ext.fly( domNode ).findParent( '.'+ this.blockCls );

		if( ! parentDom ) {
			return null;
		}

		// pick block id
		var match      = parentDom.id.match( this.instanceIdRe ),
		    instanceId = match && match[1];

		if( ! instanceId ) {
			return null;
		}

		return this.instancesStore.get( instanceId );
	},

	/**
	 * Returns ID of the slot represented by the DOM node
	 *
	 * @param {HTMLElement} [slotDom]
	 * @returns {Number}
	 */
	parseSlotId : function( slotDom )
	{
		var match = slotDom.id.match( this.slotIdRe );

		return match && match[1];
	},

	/**
	 * Block drop handler
	 *
	 * @param {HTMLElement} [slotDom]
	 * @param {Ext.dd.DragSource} [dragSource]
	 * @param {Event} [e]
	 * @param {Object} [data]
	 * @returns {Boolean}
	 */
	onNodeDrop : function( slotDom, dragSource, e, data )
	{
		// find new parent
		var targetInstance = this.getBlockInstance( slotDom );

		if( ! targetInstance ) {
			targetInstance = this.instancesStore.getRoot();
		}

		if( ! targetInstance ) {
			return false;
		}

		// find target slot ID
		var slotId = this.parseSlotId( slotDom );

		if( ! targetInstance.slots[ slotId ] ) {
			return false;
		}

		// ugly switch is needed here because we have more kind
		// of dragSources (blockList, canvas self), but Ext allows
		// only one DropZone instance per target
		var droppedInstance = null,
		    skipNode        = null;

		if( dragSource instanceof WebBuilder.widget.blocksList.DragZone ) {
			var block = data.block;

			// no block supplied
			if( block == null ) {
				return false;
			}

			droppedInstance = Ext.create( 'WebBuilder.BlockInstance', null, this.instancesStore.getBlockSetId(), block );
			droppedInstance.setTemplate( block.templates().getAt(0) );

		} else if( dragSource instanceof WebBuilder.widget.templateCanvas.DragZone ) {
			droppedInstance = this.getBlockInstance( data.blockDom );
			skipNode        = data.blockDom;

		} else {
			Ext.log({
				msg  : '['+ this.$className +'][onNodeDrop] Invalid drag source',
				dump : dragSource
			});

			return false;
		}

		// find insert position
		var slotChild = this.lastDropBefore,
		    position  = null;

		if( slotChild != null ) {
			position = 0;

			while( slotChild = slotChild.previousSibling ) {
				// node to skip, do not increment the position
				if( slotChild == skipNode ) {
					continue;
				}

				// block, increment the position
				if( Ext.fly( slotChild ).hasCls( this.blockCls ) ) {
					++position;
				}

			}
		}

		targetInstance.addChild( droppedInstance, slotId, position );

		return true;
	}
});
