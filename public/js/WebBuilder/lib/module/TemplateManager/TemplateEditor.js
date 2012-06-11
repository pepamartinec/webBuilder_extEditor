Ext.define( 'WebBuilder.module.TemplateManager.TemplateEditor',
{
	extend : 'Ext.tab.Panel',

	mixins : {
		editor : 'extAdmin.component.editor.DataEditorFeature'
	},

	requires : [
		'Ext.container.Container',
		'WebBuilder.component.TemplateEditor'
	],

	width  : 800,
	height : 600,

	/**
	 * Editor initialization
	 *
	 */
	initComponent : function()
	{
		var me = this;

		me.idField = Ext.create( 'Ext.form.field.Hidden', {
			name : 'ID'
		});

		me.parentIdField = Ext.create( 'Ext.form.field.Hidden', {
			name : 'parentID'
		});

		me.nameField = Ext.create( 'Ext.form.field.Text', {
			fieldLabel : 'Název',
			name       : 'name'
		});

		me.templateEditor = Ext.create( 'WebBuilder.component.TemplateEditor', {
			env : me.env
		});



		var generalTab = Ext.create( 'Ext.container.Container', {
			title   : 'Obecné',
			padding : 5,

			items : [ me.idField, me.parentIdField, me.nameField ]
		});

		var editorTab = Ext.apply( me.templateEditor, {
			title  : 'Návrh šablony'
		});


		Ext.apply( me, {
			title   : 'Úprava šablony',
			iconCls : 'i-delete',
			border  : false,

			items  : [ generalTab, editorTab ]
		});

		me.mixins.editor.constructor.call( me );

		me.callParent( arguments );
	},

	setData : function( data )
	{
		var me = this;

		data = data || {};

		me.idField.setValue( data.ID );
		me.parentIdField.setValue( data.parentID );
		me.nameField.setValue( data.name );

		me.templateEditor.setBlockSetId( data.ID );
		me.templateEditor.setValue( data.template );
	},

	getData : function()
	{
		var me = this;

		return {
			ID       : me.idField.getValue(),
			parentID : me.parentIdField.getValue(),
			name     : me.nameField.getValue(),
			template : me.templateEditor.getValue()
		};
	},

	getRecordId : function()
	{
		return this.getData()['ID'];
	},

	isDirty : function()
	{
		return false;
	}
});