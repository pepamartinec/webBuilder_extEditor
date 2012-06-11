Ext.define( 'WebBuilder.model.BlockTemplateSlot',
{
	extend : 'Ext.data.Model',

	uses : [
		'WebBuilder.model.BlockTemplate'
	],

	idProperty : 'ID',

	fields : [{
		name : 'ID',
		type : 'int'
	},{
		name : 'templateID',
		type : 'int'
	},{
		name : 'codeName',
		type : 'string'
	},{
		name    : 'title',
		convert : function( value, record ) {
			return value || record.get('codeName');
		}
	}],

	belongsTo : [{
		model : 'WebBuilder.model.BlockTemplate',
		getterName : 'getTemplate',
		setterName : 'setTemplate',
		primaryKey : 'ID',
		foreignKey : 'templateID'
	}]
});