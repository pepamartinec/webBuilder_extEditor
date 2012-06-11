Ext.define( 'WebBuilder.UndoPlugin', {
	extemd : 'Ext.AbstractPlugin',

	mixins : {
		observable : 'Ext.util.Observable'
	},

	requires : [
		'Ext.Function',
		'Ext.Array'
	],

	/**
	 * @cfg {Number} maxHistorySize
	 */
	maxHistorySize : 5,

	/**
	 * @required
	 * @cfg {WebBuilder.EditorStore} store
	 */
	store : null,

	/**
	 * Plugin constructor
	 *
	 */
	constructor : function( config )
	{
		var me = this;

		me.mixins.observable.constructor.call( me, config );

		Ext.apply( me, config );

		me.addEvents( 'historychange', 'undo', 'redo' );

		me.reset();

		/**
		 * @private
		 * @property {Boolean} settingHistoryItem
		 */
		me.settingHistoryItem = false;
	},

	/**
	 * Plugin initialization
	 *
	 * @param {WebBuilder.component.TemplateEditor} cmp
	 */
	init : function( cmp )
	{
		var me = this;

		me.store = cmp.instancesStore;

		cmp.setValue = Ext.Function.createInterceptor( cmp.setValue, me.reset, me );
		cmp.on( 'change', function( field, newValue, oldValue ) {
			me.pushState( newValue );
		});

		cmp.undo = Ext.Function.bind( me.undo, me );
		cmp.redo = Ext.Function.bind( me.redo, me );
		cmp.hasPrevState = Ext.Function.bind( me.hasPrevState, me );
		cmp.hasNextState = Ext.Function.bind( me.hasNextState, me );
	},

	/**
	 * Resets history
	 *
	 * @return {WebBuilder.UndoPlugin}
	 */
	reset : function()
	{
		var me = this;

		/**
		 * @protected
		 * @property {Array} history
		 */
		me.history = [];

		/**
		 * @protected
		 * @property {Number} statePtr
		 */
		me.statePtr = 0;

		me.fireEvent( 'historychange' );

		return me;
	},

	/**
	 * Pushes the new state into history
	 *
	 * @param {Object} state
	 * @return {WebBuilder.UndoPlugin}
	 */
	pushState : function( state )
	{
		var me = this;

		if( me.settingHistoryItem ) {
			return;
		}

		me.history = Ext.Array.slice( me.history, 0, me.statePtr );
		me.history.push( state );

		if( me.history.length > me.maxHistorySize ) {
			me.history.shift();

		} else {
			++me.statePtr;
		}

		me.fireEvent( 'historychange' );

		return me;
	},

	/**
	 * Makes undo
	 *
	 * @return {WebBuilder.UndoPlugin}
	 */
	undo : function()
	{
		var me = this;

		// no prev state
		if( ! me.hasPrevState() ) {
			return me;
		}

		var state = me.history[ --me.statePtr - 1 ];

		me.settingHistoryItem = true;
		me.store.setRequestData( state );
		me.settingHistoryItem = false;

		me.fireEvent( 'undo' );
		me.fireEvent( 'historychange' );

		return me;
	},

	/**
	 * Makes redo
	 *
	 * @return {WebBuilder.UndoPlugin}
	 */
	redo : function()
	{
		var me = this;

		// no next state
		if( ! me.hasNextState() ) {
			return me;
		}

		var state = me.history[ me.statePtr++ ];

		me.settingHistoryItem = true;
		me.store.setRequestData( state );
		me.settingHistoryItem = false;

		me.fireEvent( 'redo' );
		me.fireEvent( 'historychange' );

		return me;
	},

	/**
	 * Checks wheter any history state exists
	 *
	 * @return {Boolean}
	 */
	hasPrevState : function()
	{
		return this.statePtr > 1;
	},

	/**
	 * Checks wheter any future state exists
	 *
	 * @return {Boolean}
	 */
	hasNextState : function()
	{
		return this.statePtr < this.history.length;
	}
});