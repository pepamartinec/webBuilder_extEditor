Ext.define( 'WebBuilder.module.BlockManager.CategoryEditor',
{
	extend : 'Ext.form.Panel',
	
	mixins : {
		editor : 'extAdmin.component.editor.DataEditorFeature'
	},
	
	requires : [
		'Ext.form.field.Text'
	],
	
	title : 'Úprava kategorie',
	
	bodyPadding : 5,
	border      : false,
	
	width  : 400,
//	height : 100,
	
	/**
	 * Editor initialization
	 * 
	 */
	initComponent : function()
	{
		var me = this;
		
		me.defaults = {
			anchor : '100%'
		};
		
		Ext.apply( me, {
			items : [{
				xtype : 'hiddenfield',
				name  : 'ID'
			},{
				xtype      : 'textfield',
				fieldLabel : 'Název',
				name       : 'title'
			}]
		});
		
		me.mixins.editor.constructor.call( me );
		
		me.callParent( arguments );
	},
	
	setData : function( data )
	{
		return this.getForm().setValues( data );
	},
	
	getData : function()
	{
		return this.getForm().getValues();
	},
	
	getRecordId : function()
	{
		return this.getForm().findField('ID').getValue();
	},
	
	isDirty : function()
	{
		return this.getForm().isDirty();
	}
});