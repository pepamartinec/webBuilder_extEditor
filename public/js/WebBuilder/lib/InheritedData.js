Ext.define( 'WebBuilder.InheritedData', {
	provider : null,
	property : null,

	constructor : function( provider, property )
	{
		this.provider = provider;
		this.property = property;
	},

	getProvider : function()
	{
		return this.provider;
	},

	getProperty : function()
	{
		return this.property;
	},

	getValue : function()
	{
		return this.provider.getData()[ this.property ];
	}
});