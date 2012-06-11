Ext.define( 'WebBuilder.model.DataProvider',
{
	extend : 'extAdmin.Model',

	uses : [
		'WebBuilder.model.Block',
		'WebBuilder.model.DataRequirement'
	],

	idProperty : 'ID',

	fields : [{
		name : 'ID',
		type : 'int'
	},{
		name : 'requiredPropertyID',
		type : 'int'
	},{
		name : 'blockID',
		type : 'int'
	},{
		name : 'property',
		type : 'string'
	}],

	belongsTo : [{
		model      : 'WebBuilder.model.Block',
		getterName : 'getBlock',
		setterName : 'setBlock',
		primaryKey : 'ID',
		foreingKey : 'blockID'
	},{
		model      : 'WebBuilder.model.DataRequirement',
		getterName : 'getDataRequirement',
		setterName : 'setDataRequirement',
		primaryKey : 'ID',
		foreingKey : 'requiredPropertyID'
	}]
});