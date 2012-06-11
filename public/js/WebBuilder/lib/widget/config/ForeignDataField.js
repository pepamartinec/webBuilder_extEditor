Ext.define( 'WebBuilder.widget.config.ForeignDataField', {
	extend : 'Ext.form.field.Trigger',

	okBtnTitle     : 'Použít',
	cancelBtnTitle : 'Storno',

	/**
	 * @required
	 * @cfg {extAdmin.Environment} env
	 */
	env : null,

	/**
	 * @required
	 * @cfg {extAdmin.Module} module
	 */
	module : null,

	/**
	 * @required
	 * @cfg {String} displayField
	 */
	displayField : null,

	/**
	 * @property {Ext.window.Window} popup
	 */
	popup : null,

	/**
	 * @propety {Ext.Model} currentRecord
	 */
	currentRecord : null,

	/**
	 * Component initialization
	 *
	 */
	initComponent : function()
	{
		var me = this;

		me.module      = me.env.getModule( me.module );
		me.dataBrowser = me.module.createView();

		Ext.apply( me, {
			editable : false
		});

		me.callParent();
	},

	fetchRecords : function( filters, callback, scope )
	{
		var me = this;

		// FIXME find a better solution than hacking the private interface
		var op = Ext.create( 'Ext.data.Operation', {
			action  : 'read',
			filters : [{
				property : 'ID',
				value    : me.value
			}]
		});

		var cb = null;

		if( callback ) {
			cb = function( operation ) {
				if( operation.wasSuccessful() ) {
					Ext.callback( callback, scope, [ operation.getRecords() ] );
				}
			};
		}

		me.dataBrowser.dataPanel.getStore().getProxy().read( op, cb );
	},

	setRecord : function( record )
	{
		var me = this;

		me.currentRecord = record;
		me.superclass.setValue.call( me, record.getId() );
	},

	valueToRaw : function( value )
	{
		var me = this;

		if( me.currentRecord && me.currentRecord.getId() == value ) {
			return me.currentRecord.get( me.displayField );

		} else {
			return '???';
		}
	},

	rawToValue : function( rawValue )
	{
		var me = this;

		if( me.currentRecord && me.currentRecord.get( me.displayField ) == rawValue ) {
			return me.currentRecord.getId();

		} else {
			return null;
		}
	},

	setValue : function( value )
	{
		me = this;

		if( value != me.value ) {
			me.fetchRecords({
				property : 'ID',
				value    : value

			}, function( records ) {
				me.setRecord( records[0] );
			});
		}

		return this;
	},

	initPopup : function()
	{
		var me = this;

		me.popup = Ext.create( 'Ext.window.Window', {
			layout : 'fit',
			width  : 600,
			height : 400,
			modal  : true,

			closeAction : 'hide',

			items : [ me.dataBrowser ],

			buttons : [{
				text    : me.okBtnTitle,
				iconCls : 'i-ok',
				handler : function()
				{
				    var records = me.dataBrowser.getSelection();

					me.popup.close();
					me.setRecord( records[0] );
				}

			},{
				text    : me.cancelBtnTitle,
				iconCls : 'i-cancel',
				handler : function()
				{
					me.popup.close();
				}
			}]
		});
	},

	onTriggerClick : function()
	{
		var me = this;

		if( ! me.popup ) {
			me.initPopup();
		}

		me.popup.show();
	}
});