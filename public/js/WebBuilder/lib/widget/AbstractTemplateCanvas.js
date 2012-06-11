Ext.define( 'WebBuilder.widget.AbstractTemplateCanvas', {
	extend : 'Ext.Component',

	requires : [
		'extAdmin.patch.DropZoneTargetInitialization',

		'WebBuilder.widget.templateCanvas.DragZone',
		'WebBuilder.widget.templateCanvas.DropZone',
		'WebBuilder.widget.ConfigPopup'
	],

	/**
	 * @required
	 * @cfg {extAdmin.Module} module
	 */
	module : null,

	/**
	 * @required
	 * @cfg {WebBuilder.EditorStore} instancesStore
	 */
	instancesStore : null,

	/**
	 * @cfg {String} ddGroup
	 */
	ddGroup : 'template-canvas',

	/**
	 * ClassName of canvas root element
	 *
	 * @cfg {String} canvasCls
	 */
	canvasCls : Ext.baseCSSPrefix +'template-canvas',

	/**
	 * ClassName of block nodes
	 *
	 * @cfg {String} blockCls
	 */
	blockCls : Ext.baseCSSPrefix +'block',

	/**
	 * ClassName of block title node
	 *
	 * @cfg {String} blockTitleCls
	 */
	blockTitleCls : Ext.baseCSSPrefix +'block-title',

	/**
	 * ClassName of block tools container node
	 *
	 * @cfg {String} blockToolsCls
	 */
	blockToolsCls : Ext.baseCSSPrefix +'tools',

	/**
	 * ClassName of block tool node
	 *
	 * @cfg {String} blockToolCls
	 */
	blockToolCls : Ext.baseCSSPrefix +'tool',

	/**
	 * ClassName of config tool icon
	 *
	 * @cfg {String} configToolCls
	 */
	configToolCls : Ext.baseCSSPrefix +'config',

	/**
	 * ClassName of remove tool icon
	 *
	 * @cfg {String} removeToolCls
	 */
	removeToolCls : Ext.baseCSSPrefix +'remove',

	/**
	 * ClassName of slot nodes
	 *
	 * @cfg {String} slotCls
	 */
	slotCls : Ext.baseCSSPrefix +'slot',

	/**
	 * ClassName of slot title nodes
	 *
	 * @cfg {String} slotTitleCls
	 */
	slotTitleCls : Ext.baseCSSPrefix +'slot-title',

	/**
	 * ClassName of title nodes
	 *
	 * @cfg {String} titleCls
	 */
	titleCls : Ext.baseCSSPrefix +'title',

	/**
	 * ClassName of the empty slot nodes
	 *
	 * @cfg {String} slotCls
	 */
	emptyCls : Ext.baseCSSPrefix +'empty',

	/**
	 * Slot highlight className
	 *
	 * @cfg {String} overCls
	 */
	overCls : Ext.baseCSSPrefix +'over',

	/**
	 * ClassName applied on dragged node
	 *
	 * @cfg {String} dragCls
	 */
	dragCls : Ext.baseCSSPrefix +'drag',

	/**
	 * @private
	 * @property {RegExp} instanceIdRe
	 */
	instanceIdRe : new RegExp( 'template-block-instance-((?:blockInstance-)?\\d+)' ),

	/**
	 * @private
	 * @property {RegExp} slotIdRe
	 */
	slotIdRe : new RegExp( 'template-block-instance-(?:blockInstance-)?\\d+-slot-(\\w+)' ),

	/**
	 * Drop position pointer DOM node
	 *
	 * @property {HTMLElement}
	 */
	insertPtrDom : {
    	tag : 'hr',
    	cls : Ext.baseCSSPrefix +'insert-pointer'
    },

	html : {
		tag : 'iframe',
		src : 'about:blank',

		width  : '100%',
		height : '100%',
		frameborder : '0'
	},

	/**
	 * Component initialization
	 *
	 * @protected
	 */
	initComponent : function()
	{
		var me = this;

		me.callParent();

        Ext.apply( me.renderSelectors, {
            iframeEl : 'iframe'
        });

        // create insert position pointer instance
        me.insertPtrDom = Ext.DomHelper.createDom( me.insertPtrDom );

        // create config popup
        me.configPopup = Ext.create( 'WebBuilder.widget.ConfigPopup', {
        	env         : me.module.env,
        	closeAction : 'hide'
        });
	},

	/**
	 * Component cleanup
	 *
	 * @protected
	 */
	beforeDestroy : function()
	{
		var me = this;

		me.cleanupIframe();
		me.configPopup.destroy();

		me.callParent();
	},

	/**
	 * Events initialization
	 *
	 * @protected
	 */
	initEvents : function()
	{
		var me = this;

		me.callParent();

		// iFrame
		me.iframeEl.on( 'load', me.initIframe, me );
		me.iframeEl.on( 'unload', me.cleanupIframe, me );
		me.iframeEl.set({ 'src' : 'about:blank' });

		// instances store
		me.mon( me.instancesStore, 'add', me.handleInstanceAdd, me );
		me.mon( me.instancesStore, 'remove', me.handleInstanceRemove, me );
		me.mon( me.instancesStore, 'templatechange', me.handleInstanceTemplateChange, me );

		me.initIframe();
		var store = me.instancesStore,
	    root  = store.getRoot();

		if( root ) {
			me.handleInstanceAdd( store, root );
		}
	},

	/**
	 * iFrame initialization
	 *
	 * @protected
	 */
	initIframe : function()
	{
		var me  = this,
		    doc = me.iframeEl.dom.contentDocument;

		me.headEl = Ext.get( doc.head );
		me.bodyEl = Ext.get( doc.body );

		// mark canvas root
		me.bodyEl.addCls( me.canvasCls );
		me.bodyEl.addCls( me.blockCls );

		// add iFrame to document.getElementById chain
		extAdmin.addElementGetter( doc.getElementById, doc );

		// init D&D
		Ext.EventManager.on( doc, 'mousemove', me.handleIframeMouseMove, me );
		Ext.EventManager.on( doc, 'mouseup',   me.handleIframeMouseUp,   me );
		Ext.EventManager.on( doc, 'click',     me.handleIframeClick,     me );

		me.dragZone = Ext.create( 'WebBuilder.widget.templateCanvas.DragZone', me.bodyEl, {
			ddGroup : me.ddGroup,

			blockCls      : me.blockCls,
			blockTitleCls : me.blockTitleCls,
			dragCls       : me.dragCls
		});

		me.dropZone = Ext.create( 'WebBuilder.widget.templateCanvas.DropZone', me.iframeEl, {
			ddGroup        : me.ddGroup,
			instancesStore : me.instancesStore,

			blockCls     : me.blockCls,
			slotCls      : me.slotCls,
			emptyCls     : me.emptyCls,
			overCls      : me.overCls,
			insertPtrDom : me.insertPtrDom,
			instanceIdRe : me.instanceIdRe,
			slotIdRe     : me.slotIdRe
		});
	},

	/**
	 * Iframe cleanup
	 *
	 * @protected
	 */
	cleanupIframe : function()
	{
		var me = this;

		if( me.iframeEl ) {
			var doc = me.iframeEl.dom.contentDocument;

			Ext.EventManager.un( doc, 'mousemove', me.handleIframeMouseMove );
			Ext.EventManager.un( doc, 'mouseup',   me.handleIframeMouseUp   );
			Ext.EventManager.un( doc, 'click',     me.handleIframeClick   );

			extAdmin.removeElementGetter( doc.getElementById );
		}
	},

	handleIframeMouseMove : function( event )
	{
		var iframeXY = this.iframeEl.getXY(),
		    eventXY  = event.getXY();

		// fake event position & relay to DD manager
		event.innerXY = eventXY;
		event.xy      = [ iframeXY[0] + eventXY[0], iframeXY[1] + eventXY[1] ];
		Ext.dd.DragDropManager.handleMouseMove( event );

		// styling helpers
		var blockDom = event.getTarget( '.'+ this.blockCls );

		if( blockDom != this.lastOverBlock ) {
			if( this.lastOverBlock ) {
				Ext.fly( this.lastOverBlock ).removeCls( this.overCls );
				this.lastOverBlock = null;
			}

			if( blockDom ) {
				Ext.fly( blockDom ).addCls( this.overCls );
				this.lastOverBlock = blockDom;
			}
		}

		// restore original position
		delete event.innerXY;
		event.xy = eventXY;
	},

	handleIframeMouseUp : function( event )
	{
		var iframeXY = this.iframeEl.getXY(),
		    eventXY  = event.getXY();

		// fake event position & relay to DD manager
		event.innerXY = eventXY;
		event.xy      = [ iframeXY[0] + eventXY[0], iframeXY[1] + eventXY[1] ];
		Ext.dd.DragDropManager.handleMouseUp( event );

		// restore original position
		event.xy = eventXY;
	},

	handleIframeClick : function( event )
	{
		// check tool click
		var me     = this,
		    target = Ext.fly( event.target );

		if( target.hasCls( me.blockToolCls ) ) {
			var blockDom = target.findParent( '.'+ me.blockCls ),
		        instance = me.getBlockInstance( blockDom );

			if( instance ) {
				// CONFIG
				if( target.hasCls( me.configToolCls ) ) {
					me.configPopup.setInstance( instance );
					me.configPopup.show();

				// REMOVE
				} else if( target.hasCls( me.removeToolCls ) ) {
					instance.remove();
				}
			}
		}
	},

	/**
	 * Handler for insertion of the block instance from store
	 *
	 * @param {WebBuilder.EditorStore} [store]
	 * @param {WebBuilder.BlockInstance} [instance]
	 * @param {WebBuilder.BlockInstance} [parentBlock]
	 * @param {Number} [parentSlotId]
	 * @param {Number,Null} [position]
	 */
	handleInstanceAdd : function( store, instance, parentBlock, parentSlotId, position )
	{
		var me = this;

		if( parentBlock ) {
			var instanceTpl  = me.getInstanceTpl( instance ),
			    slotDom      = me.findSlotDom( parentBlock, parentSlotId ),
			    insertBefore = null;

			if( position !== null ) {
				insertBefore = slotDom.firstChild;

				while( insertBefore && position > 0 ) {
					if( Ext.fly( insertBefore ).hasCls( this.blockCls ) ) {
						--position;
					}

					insertBefore = insertBefore.nextSibling;
				}
			}

			if( insertBefore ) {
				instanceTpl.insertBefore( insertBefore, instance );

			} else {
				instanceTpl.append( slotDom, instance );
			}

			Ext.fly( slotDom ).removeCls( me.emptyCls );

		} else {
			var iframeDoc = this.iframeEl.dom.contentDocument,
			    docTpl    = me.getDocumentTpl( instance );

			iframeDoc.open();
			iframeDoc.write( docTpl.apply( instance ) );
			iframeDoc.close();
		}

		if( instance.hasUndefinedConfig() ) {
			me.configPopup.setInstance( instance );
			me.configPopup.show();
		}
	},

	/**
	 * Returns the template of given block instance
	 *
	 * @param {WebBuilder.BlockInstance} instance
	 * @return {Ext.Template}
	 */
	getInstanceTpl : extAdmin.abstractFn,

	/**
	 * Returns the template of canvas document (including the root HTML node)
	 *
	 * @param {WebBuilder.BlockInstance} instance
	 * @return {Ext.Template}
	 */
	getDocumentTpl : extAdmin.abstractFn,

	/**
	 * Handler for removal of the block instance from store
	 *
	 * @param {WebBuilder.EditorStore} [store]
	 * @param {WebBuilder.BlockInstance} [instance]
	 */
	handleInstanceRemove : function( store, instance, originalParent, slotId, position )
	{
		var me       = this,
		    blockDom = me.findBlockDom( instance );

		if( originalParent && originalParent.slots[ slotId ].length == 0 ) {
			Ext.fly( blockDom ).findParentNode( '.'+me.slotCls, 5, true ).addCls( me.emptyCls );
		}

		if( blockDom ) {
			Ext.fly( blockDom ).remove();
		}
	},

	/**
	 * Handler for change of block instance template
	 *
	 * We need to re-render complete block, because slots may change with
	 * different templates
	 *
	 * @param {WebBuilder.EditorStore} [store]
	 * @param {WebBuilder.BlockInstance} [instance]
	 * @param {Object} [oldSlots]
	 */
	handleInstanceTemplateChange : function( store, instance, oldSlots )
	{
		var me = this;

		// find existing DOM node
		var blockDom = me.findBlockDom( instance );

		// instance not rendered yet, nothing to do
		if( blockDom == null ) {
			return;
		}

		// replace old DOM node with refreshed one
		me.getInstanceTpl( instance ).insertBefore( blockDom, instance );
		blockDom.parentNode.removeChild( blockDom );
	},

	/**
	 * Returns instance belonging to the block DOM node
	 *
	 * @param {HTMLElement} [blockDom]
	 * @return {WebBuilder.BlockInstance}
	 */
	getBlockInstance : function( blockDom )
	{
		var match = blockDom.id.match( this.instanceIdRe );

		if( match == null ) {
			return null;
		}

		return this.instancesStore.get( match[1] );
	},

	/**
	 * Finds DOM node representing the block instance (if any)
	 *
	 * @param {WebBuilder.BlockInstance} [instance]
	 * @return {HTMLElement}
	 */
	findBlockDom : function( instance )
	{
		return this.iframeEl.dom.contentDocument.getElementById( 'template-block-instance-'+ instance.id );
	},

	/**
	 * Returns the slot DOM node
	 *
	 * @param {WebBuilder.BlockInstance} [instance]
	 * @param {Number} [slotId]
	 * @return {HTMLElement}
	 */
	findSlotDom : function( instance, slotId )
	{
		return this.iframeEl.dom.contentDocument.getElementById( 'template-block-instance-'+ instance.id +'-slot-'+ slotId );
	}
});