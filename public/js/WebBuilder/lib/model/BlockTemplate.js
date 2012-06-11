Ext.define( 'WebBuilder.model.BlockTemplate',
{
	extend : 'extAdmin.Model',

	uses : [
		'WebBuilder.model.Block',
		'WebBuilder.model.BlockTemplateSlot'
	],

	idProperty : 'ID',

	fields : [{
		name : 'ID',
		type : 'int'
	},{
		name : 'blockID',
		type : 'int'
	},{
		name : 'thumb',
		type : 'string'
	},{
		name    : 'title',
		convert : function( value, record ) {
			return value || record.get('filename').split('/').pop();
		}
	},{
		name : 'filename',
		type : 'string'
	},{
		name : 'content',
		type : 'string'
	}],

	belongsTo : [{
		model      : 'WebBuilder.model.Block',
		getterName : 'getBlock',
		setterName : 'setBlock',
		primaryKey : 'ID',
		foreignKey : 'blockID'
	}],

	hasMany : [{
		model      : 'WebBuilder.model.BlockTemplateSlot',
		name       : 'slots',
		primaryKey : 'ID',
		foreignKey : 'templateID'
	}]
});