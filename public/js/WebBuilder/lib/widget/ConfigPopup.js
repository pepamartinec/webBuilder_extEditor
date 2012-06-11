Ext.define( 'WebBuilder.widget.ConfigPopup', {
	extend : 'Ext.window.Window',

	uses : [
		'WebBuilder.ConstantData',
		'WebBuilder.InheritedData'
	],

	title : 'Nastavení bloku',

	okBtnTitle     : 'Použít',
	cancelBtnTitle : 'Storno',

	/**
	 * @required
	 * @cfg {extAdmin.Environment} env
	 */
	env : null,

	/**
	 * Component initialization
	 *
	 */
	initComponent : function()
	{
		var me = this;

		/**
		 * @protected
		 * @property {WebBuilder.BlockInstance/Null} currentInstance
		 */
		me.currentInstance = null;

		/**
		 * @protected
		 * @property {Ext.form.Field} templateField
		 */
		me.templateField = null;

		/**
		 * @protected
		 * @property {Object} dataFields
		 */
		me.dataFields = {};

		me.formPanel = Ext.create( 'Ext.form.Panel', {

		});

		Ext.apply( me, {
			layout      : 'anchor',
			bodyPadding : 5,

			buttons : [{
				text    : me.okBtnTitle,
				iconCls : 'i-ok',
				handler : me.applyConfig,
				scope   : me
			},{
				text    : me.cancelBtnTitle,
				iconCls : 'i-cancel',
				handler : me.close,
				scope   : me
			}]
		});

		me.callParent();
	},

	setInstance : function( instance )
	{
		var me     = this,
		    block  = instance.block,
		    config = block.get('config'),
		    data   = instance.getData();

		// update the config fields
		if( instance !== me.currentInstance ) {

			// remove old fields
			me.removeAll( true );

			// create the template field
			me.templateField = me.createTemplateConfigItem( instance );
			me.add( me.templateField );

			// create config fields
			me.dataFields = Ext.Object.map( config || {}, me.createConfigItem, me );
			me.add( Ext.Object.getValues( me.dataFields ) );

			me.currentInstance = instance;
		}

		// update the filed values
		Ext.Object.each( me.dataFields, function( name, field ) {
			field.setValue( data[ name ] );
		});
	},

	createTemplateConfigItem : function( instance )
	{
		var templates = instance.block.templates();

		return Ext.create( 'Ext.form.field.ComboBox', {
			name       : 'template',
			fieldLabel : 'Šablona',
			value      : instance.template.getId(),
			readOnly   : templates.getCount() == 1,

			store        : instance.block.templates(),
			displayField : 'title',
			valueField   : 'ID',
			queryMode    : 'local'
		});
	},

	createConfigItem : function( name, definition )
	{
		var me = this;

		if( ! Ext.isObject( definition ) || ! definition['type'] ) {
			return;
		}

		itemCfg = Ext.Object.merge( {
			env        : me.env,
			fieldLabel : ( definition.title || name ) + ( definition.required ? ' *' : '' ),

			allowBlank : !definition.required
		}, definition );

		delete itemCfg['type'];

		return Ext.create( definition['type'], itemCfg );

		var me   = this,
	        item = null;

		// constant data
		if( value instanceof WebBuilder.ConstantData ) {
			item = Ext.create( 'Ext.form.field.Text', {
				name       : name,
				fieldLabel : name,
				value      : value.getValue()
			});

		// inherited data
		} else if( value instanceof WebBuilder.InheritedData ) {
			item = Ext.create( 'WebBuilder.widget.DataLinkField', {
				name       : name,
				fieldLabel : name,
				value      : value
			});

		// invalid data
		} else {
			Ext.log({
				level : 'warn',
				msg   : 'Invalid "'+ name +'" value "'+ value +'"'
			});

			return;
		}

		me.configItems.push( item );
	},

	applyConfig : function()
	{
		var me = this;

		// no current instance
		if( me.currentInstance == null ) {
			Ext.log({
				msg : '['+ me.$className +'][applyConfig] Cannot apply the data, no currentInstance is set.'
			});

		// apply config to the current instance
		} else {
			// apply data
			var data  = {},
			    valid = true;

			Ext.Object.each( me.dataFields, function( name, field ) {
				data[ name ] = Ext.create( 'WebBuilder.ConstantData', field.getValue() );
				valid       &= field.validate();
			});

			if( ! valid ) {
				return;
			}

			me.currentInstance.setData( data );

			// set template
			me.currentInstance.setTemplate( me.currentInstance.block.templates().getById( me.templateField.getValue() ) );
		}

		me.close();
	}
});