Ext.define( 'WebBuilder.model.Block',
{
	extend : 'extAdmin.Model',

	uses : [
		'WebBuilder.model.BlocksCategory',
		'WebBuilder.model.BlockTemplate',
		'WebBuilder.model.DataRequirement',
		'WebBuilder.model.DataProvider'
	],

	idProperty : 'ID',

	fields : [{
		name : 'ID',
		type : 'int'
	},{
		name : 'categoryID',
		type : 'int'
	},{
		name : 'title',
		type : 'string'
	},{
		name : 'thumb',
		type : 'string'
	},{
		name : 'codeName',
		type : 'string'
	},{
		name : 'config'
	}],

	belongsTo : [{
		model      : 'WebBuilder.model.BlocksCategory',
		getterName : 'getCategory',
		setterName : 'setCategory',
		primaryKey : 'ID',
		foreignKey : 'categoryID'
	}],

	hasMany : [{
		model      : 'WebBuilder.model.BlockTemplate',
		name       : 'templates',
		primaryKey : 'ID',
		foreignKey : 'blockID'
	},{
		model      : 'WebBuilder.model.DataRequirement',
		name       : 'requires',
		primaryKey : 'ID',
		foreignKey : 'blockID'
	},{
		model      : 'WebBuilder.model.DataProvider',
		name       : 'provides',
		primaryKey : 'ID',
		foreignKey : 'blockID'
	}]
});