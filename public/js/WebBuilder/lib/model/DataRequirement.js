Ext.define( 'WebBuilder.model.DataRequirement',
{
	extend : 'extAdmin.Model',

	uses : [
		'WebBuilder.model.Block',
		'WebBuilder.model.DataProvider'
	],

	idProperty : 'ID',

	fields : [{
		name : 'ID',
		type : 'int'
	},{
		name : 'blockID',
		type : 'int'
	},{
		name : 'property',
		type : 'string'
	},{
		name : 'dataType',
		type : 'string'
	}],

	belongsTo : [{
		model      : 'WebBuilder.model.Block',
		getterName : 'getBlock',
		setterName : 'setBlock',
		primaryKey : 'ID',
		foreingKey : 'blockID'
	}],

	hasMany : [{
		model      : 'WebBuilder.model.DataProvider',
		name       : 'providers',
		primaryKey : 'ID',
		foreingKey : 'requiredPropertyID'
	}]
});